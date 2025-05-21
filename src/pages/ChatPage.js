import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../services/UserContext';
import { sendGet, sendPost, sendPut, sendDelete } from '../services/RequestSender';
import ChatList from '../components/ui/ChatList';
import ConversationPanel from '../components/ui/ConversationPanel';
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
 */
const ChatPage = () => {
    // State to manage which conversation is currently selected
    const [activeChat, setActiveChat] = useState(null);
    const [activeChatMessages, setActiveChatMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showAlert, setShowAlert] = useState(false);

    // Access the user context to get user data and authentication status
    const { user, logOut } = useUser();
    const navigate = useNavigate();

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
                // Fetch updated messages after successful send
                fetchMessages(activeChat._id);
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
                // Fetch updated messages after successful edit
                fetchMessages(activeChat._id);
            } else {
                throw new Error('Failed to edit message');
            }
        } catch (err) {
            handleApiError(err, 'Error editing message:');
        }
    };

    // Handle deleting a message
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

                // Optional: fetch updated messages from server
                // fetchMessages(activeChat._id);
            } else {
                throw new Error('Failed to delete message');
            }
        } catch (err) {
            handleApiError(err, 'Error deleting message:');
        }
    }

    // Handle forwarding a message to another chat
    const handleForwardMessage = async (messageId, targetChatId) => {
        if (!activeChat || !messageId || !targetChatId) return;

        try {
            const forwardData = {
                message_id: messageId,
                target_chat_id: targetChatId,
                sender: user._id
            };

            console.log("Forwarding message:", forwardData);
            const response = await sendPost('/messages/forward', user.token, {}, forwardData);

            if (response.status === 201 || response.status === 200) {
                console.log("Message forwarded successfully:", response.data);
                // No need to refresh current chat as the forwarded message goes to another chat
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
                        <h3>{user?.username || 'User'}</h3>
                    </div>
                    <div className="theme-switch-container">
                        <ThemeSwitcher />
                    </div>
                </div>
                <div className="chat-search">
                    <input
                        type="text"
                        placeholder="Search or start new chat"
                        className="search-input"
                    />
                </div>
                <ChatList
                    activeChat={activeChat}
                    onSelectChat={handleSelectChat}
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