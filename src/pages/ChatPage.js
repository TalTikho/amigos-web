import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../services/UserContext';
import { sendGet, sendPost, sendPut, sendDelete } from '../services/RequestSender';
import ChatList from '../components/ui/ChatList';
import ConversationPanel from '../components/ui/ConversationPanel';
import SearchBar from '../components/ui/SearchBar';
import ThemeSwitcher from '../components/ui/ThemeSwitcher';
import AvatarCircle from '../components/ui/AvatarCircle';
import Alert from '../components/ui/Alert';
import '../style/ChatPage.css';

/**
 * ChatPage - The main chat interface component
 * This component is similar to WhatsApp Web's main interface with:
 * - A sidebar showing all chats on the left
 * - The main conversation panel on the right
 * - Enhanced with message editing, deleting, and forwarding functionality
 * - Updated to use the server API structure
 * - Added message event system for real-time updates
 * - Fixed timestamp display for sent vs edited messages
 * - Added search functionality for chats and messages
 */
const ChatPage = () => {
    // State to manage which conversation is currently selected
    const [activeChat, setActiveChat] = useState(null);
    const [activeChatMessages, setActiveChatMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showAlert, setShowAlert] = useState(false);
    // State for chat list data to enable direct updates
    const [chatListData, setChatListData] = useState([]);
    // State for search functionality - removed unused searchMode
    const [highlightedMessageId, setHighlightedMessageId] = useState(null);

    // Access the user context to get user data and authentication status
    const { user, logOut } = useUser();
    const navigate = useNavigate();

    // Function to update chat preview after message operations
    const updateChatPreview = (chatId, newMessage, isDeleted = false) => {
        setChatListData(prevChats =>
            prevChats.map(chat => {
                if (chat._id === chatId) {
                    return {
                        ...chat,
                        lastMessage: isDeleted ? null : newMessage,
                        lastMessageTime: isDeleted ? chat.createdAt : (newMessage?.updatedAt || newMessage?.createdAt)
                    };
                }
                return chat;
            })
        );
    };

    // Handle errors and unauthorized responses
    const handleApiError = (err, errorMessage) => {
        console.error(errorMessage, err);
        setError(err.response?.data?.error || errorMessage);
        setShowAlert(true);

        // If unauthorized (401), log out and redirect to login
        if (err.response?.status === 401) {
            logOut();
            navigate('/login-signup');
        }
    };

    // Fetch messages for a specific conversation
    const fetchMessages = async (chatId) => {
        if (!user?._id || !user?.token || !chatId) return;

        try {
            setLoading(true);
            console.log(`Fetching messages for chat ${chatId} and user ${user._id}`);
            const response = await sendGet(`/messages/${chatId}/chat/${user._id}`, user.token);

            if (response.status === 200) {
                console.log("Messages response:", response.data);

                // Handle both API response structures
                const messagesData = response.data.data && Array.isArray(response.data.data)
                    ? response.data.data
                    : Array.isArray(response.data)
                        ? response.data
                        : [];

                console.log("Processed messages:", messagesData);
                setActiveChatMessages(messagesData);
            } else {
                throw new Error('Failed to fetch messages');
            }
        } catch (err) {
            handleApiError(err, 'Error fetching messages:');
        } finally {
            setLoading(false);
        }
    };

    // Check if user is logged in on component mount - redirect to login if not
    useEffect(() => {
        if (!user) {
            navigate('/login-signup');
        }
    }, [user, navigate]);

    // Handle selecting a conversation
    const handleSelectChat = (chat) => {
        console.log("Selected chat:", chat);
        setActiveChat(chat);
        fetchMessages(chat._id);
        setHighlightedMessageId(null);
    };

    // Handle selecting a specific message from search
    const handleSelectMessage = (message) => {
        console.log("Selected message:", message);
        setHighlightedMessageId(message._id);

        // Scroll to the message after a brief delay to ensure it's rendered
        setTimeout(() => {
            const messageElement = document.querySelector(`[data-message-id="${message._id}"]`);
            if (messageElement) {
                messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

                // Remove highlight after 3 seconds
                setTimeout(() => {
                    setHighlightedMessageId(null);
                }, 3000);
            }
        }, 100);
    };

    // Handle sending a new message
    const handleSendMessage = async (messageText) => {
        if (!activeChat || !messageText.trim() || !user?._id) return;

        try {
            const messageData = {
                text: messageText,
                chat: activeChat._id,
                sender: user._id
            };

            console.log("Sending message:", messageData);
            const response = await sendPost(`/messages/${messageData.chat}/send/${messageData.sender}`, user.token, {}, messageData);

            if (response.status === 201 || response.status === 200) {
                console.log("Message sent successfully:", response.data);

                // Create the new message object for immediate UI update
                const newMessage = {
                    _id: response.data._id || response.data.data?._id || Date.now().toString(),
                    text: messageText,
                    sender: user._id,
                    chat: activeChat._id,
                    createdAt: new Date().toISOString(),
                    isDeleted: false
                    // Note: No updatedAt field for new messages - only createdAt
                };

                // Update active chat messages immediately
                setActiveChatMessages(prevMessages => [...prevMessages, newMessage]);

                // Update chat preview immediately
                updateChatPreview(activeChat._id, newMessage);
            } else {
                throw new Error('Failed to send message');
            }
        } catch (err) {
            handleApiError(err, 'Error sending message:');
        }
    };

    // Handle editing a message
    const handleEditMessage = async (messageId, newText) => {
        if (!activeChat || !messageId || !newText.trim()) return;

        try {
            const messageData = {
                text: newText
            };

            console.log(`Editing message ${messageId}:`, messageData);
            const response = await sendPut(`/messages/${messageId}/edit/${user._id}`, user.token, {}, messageData);

            if (response.status === 200) {
                console.log("Message edited successfully:", response.data);

                // Update active chat messages immediately with updatedAt timestamp
                const updatedMessages = activeChatMessages.map(msg =>
                    msg._id === messageId
                        ? { ...msg, text: newText, updatedAt: new Date().toISOString() }
                        : msg
                );
                setActiveChatMessages(updatedMessages);

                // If this was the last message, update chat preview
                const lastMessage = updatedMessages[updatedMessages.length - 1];
                if (lastMessage && lastMessage._id === messageId) {
                    updateChatPreview(activeChat._id, lastMessage);
                }
            } else {
                throw new Error('Failed to edit message');
            }
        } catch (err) {
            handleApiError(err, 'Error editing message:');
        }
    };

    // Handle deleting a message
    const handleDeleteMessage = async (messageId) => {
        if (!activeChat || !messageId) return;

        try {
            console.log(`Deleting message ${messageId}`);
            const response = await sendDelete(`/messages/${messageId}/delete/${user._id}`, user.token);

            if (response.status === 200 || response.status === 204) {
                console.log("Message deleted successfully");

                // Update the local state immediately to show deletion
                setActiveChatMessages(prevMessages =>
                    prevMessages.map(msg =>
                        msg._id === messageId
                            ? { ...msg, isDeleted: true }
                            : msg
                    )
                );

                // If this was the last message, update chat preview
                const lastMessage = activeChatMessages[activeChatMessages.length - 1];
                if (lastMessage && lastMessage._id === messageId) {
                    // Find the previous non-deleted message or mark as no messages
                    const remainingMessages = activeChatMessages.filter(msg => msg._id !== messageId);
                    const newLastMessage = remainingMessages.length > 0 ? remainingMessages[remainingMessages.length - 1] : null;
                    updateChatPreview(activeChat._id, newLastMessage, !newLastMessage);
                }
            } else {
                throw new Error('Failed to delete message');
            }
        } catch (err) {
            handleApiError(err, 'Error deleting message:');
        }
    };

    // Handle forwarding a message to another chat
    const handleForwardMessage = async (messageId, targetChatId) => {
        if (!activeChat || !messageId || !targetChatId) return;

        try {
            // Find the original message to get its text
            const originalMessage = activeChatMessages.find(msg => msg._id === messageId);
            if (!originalMessage) {
                throw new Error('Original message not found');
            }

            // Prepare the message data for forwarding
            const forwardedMessageData = {
                text: originalMessage.text || originalMessage.content, // Clean text without any prefix
                chat: targetChatId,
                sender: user._id,
                is_forwarded: true // Set the forwarded flag
            };

            console.log("Forwarding message:", forwardedMessageData);

            // Use the existing send message route
            const response = await sendPost(
                `/messages/${targetChatId}/send/${user._id}`,
                user.token,
                {},
                forwardedMessageData
            );

            if (response.status === 201 || response.status === 200) {
                console.log("Message forwarded successfully:", response.data);

                // Create forwarded message object for target chat preview update
                const forwardedMessage = {
                    _id: response.data._id || response.data.data?._id || Date.now().toString(),
                    text: originalMessage.text || originalMessage.content,
                    sender: user._id,
                    chat: targetChatId,
                    createdAt: new Date().toISOString(),
                    is_forwarded: true // Ensure the forwarded flag is set
                };

                // Update target chat preview if it exists in our chat list
                updateChatPreview(targetChatId, forwardedMessage);

                // Show success message
                setShowAlert(true);
                setError("Message forwarded successfully.");
                setTimeout(() => setShowAlert(false), 3000);
            } else {
                throw new Error('Failed to forward message');
            }
        } catch (err) {
            handleApiError(err, 'Error forwarding message:');
        }
    };

    // Component UI rendering
    return (
        <div className="chat-page">
            {/* Left sidebar with all conversations */}
            <div className="chat-sidebar">
                <div className="sidebar-header">
                    <div className="user-profile">
                        <AvatarCircle src={user?.profile_pic} radius="60px" />
                        <div className="user-info">
                            <h3>{user?.username || 'User'}</h3>
                            <h4>{user?.status || ''}</h4>
                        </div>
                        <div className="user-actions">
                            <ThemeSwitcher />
                            <button
                                className="settings-btn"
                                onClick={() => navigate('/settings')}
                                title="Settings"
                            >
                                <AvatarCircle src="/assets/images/settings_icon.png" radius="55px" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="chat-search">
                    <SearchBar
                        onSelectChat={handleSelectChat}
                        onSelectMessage={handleSelectMessage}
                        chats={chatListData}
                    />
                </div>

                <ChatList
                    activeChat={activeChat}
                    onSelectChat={handleSelectChat}
                    chatListData={chatListData}
                    setChatListData={setChatListData}
                />
            </div>

            {/* Main conversation panel */}
            <div className="conversation-panel-container">
                {activeChat ? (
                    <ConversationPanel
                        chat={{
                            ...activeChat,
                            messages: activeChatMessages
                        }}
                        currentUserId={user?._id}
                        loading={loading}
                        onSendMessage={handleSendMessage}
                        onEditMessage={handleEditMessage}
                        onDeleteMessage={handleDeleteMessage}
                        onForwardMessage={handleForwardMessage}
                        highlightedMessageId={highlightedMessageId}
                    />
                ) : (
                    <div className="empty-conversation">
                        <div className="empty-conversation-content">
                            <div className="app-logo">
                                <span className="logo-text">SocialChat</span>
                            </div>
                            <p>Select a chat to start messaging</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Alert for errors */}
            {showAlert && error && (
                <Alert
                    message={error}
                    type={error.includes("successfully") ? "success" : "error"}
                    onClose={() => setShowAlert(false)}
                />
            )}
        </div>
    );
};

export default ChatPage;