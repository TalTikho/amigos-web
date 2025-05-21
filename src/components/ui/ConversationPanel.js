import React, { useState, useRef, useEffect } from 'react';
import MessageBubble from './MessageBubble';
import AvatarCircle from './AvatarCircle';
import ForwardMessageModal from './ForwardMessageModal';
import { sendGet } from '../../services/RequestSender';
import { useUser } from '../../services/UserContext';
import '../../style/ConversationPanel.css';

/**
 * ConversationPanel - Component for displaying an active conversation
 * 
 * This component shows the currently selected chat conversation,
 * including the header with contact info, message history, and input field.
 * Updated to work with server API structure.
 * 
 * Props:
 * - chat: The active chat object with conversation details and messages
 * - currentUserId: ID of the current user (to identify own messages)
 * - loading: Boolean indicating if messages are loading
 * - onSendMessage: Function to call when sending a new message
 * - onEditMessage: Function to call when editing a message
 * - onDeleteMessage: Function to call when deleting a message
 * - onForwardMessage: Function to call when forwarding a message
 */
const ConversationPanel = ({ 
    chat, 
    currentUserId,
    loading,
    onSendMessage, 
    onEditMessage, 
    onDeleteMessage, 
    onForwardMessage 
}) => {
    // State for the current message being typed
    const [message, setMessage] = useState('');
    // State for message being edited
    const [editingMessage, setEditingMessage] = useState(null);
    // State for forwarding message modal
    const [forwardingMessage, setForwardingMessage] = useState(null);
    // State for showing the forward modal
    const [showForwardModal, setShowForwardModal] = useState(false);
    // State for available chats to forward to
    const [availableChats, setAvailableChats] = useState([]);

    // Reference to the messages container for scrolling functionality
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const { user } = useUser();

    // Fetch available chats for forwarding
    useEffect(() => {
        const fetchAvailableChats = async () => {
            if (!user?._id || !user?.token) return;
            
            try {
                console.log(`Fetching available chats for forwarding`);
                const response = await sendGet(`/chats/${user._id}`, user.token);
                
                if (response.status === 200) {
                    // Handle both API response structures
                    const chatsData = response.data.data && Array.isArray(response.data.data) 
                        ? response.data.data 
                        : Array.isArray(response.data) 
                            ? response.data 
                            : [];
                    
                    // Filter out the current chat
                    const filteredChats = chatsData.filter(c => c._id !== chat._id);
                    setAvailableChats(filteredChats);
                }
            } catch (error) {
                console.error("Error fetching available chats:", error);
            }
        };

        if (showForwardModal) {
            fetchAvailableChats();
        }
    }, [showForwardModal, chat._id, user]);

    // Function to handle message submission
    const handleSendMessage = () => {
        if (message.trim()) {
            if (editingMessage) {
                // Call the edit message handler
                onEditMessage(editingMessage._id, message);
                setEditingMessage(null);
            } else {
                // Call the parent component's message handler
                onSendMessage(message);
            }
            // Clear the input field after sending
            setMessage('');
        }
    };

    // Handle pressing Enter key to send message
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault(); // Prevent default to avoid newline in input
            handleSendMessage();
        } else if (e.key === 'Escape' && editingMessage) {
            // Cancel editing if Escape is pressed
            setEditingMessage(null);
            setMessage('');
        }
    };

    // Start editing a message
    const handleStartEditing = (message) => {
        // Only allow editing your own messages
        if (message.sender === currentUserId && !message.isDeleted) {
            setEditingMessage(message);
            setMessage(message.text);
            // Focus the input field
            if (inputRef.current) {
                inputRef.current.focus();
            }
        }
    };

    // Cancel editing
    const handleCancelEditing = () => {
        setEditingMessage(null);
        setMessage('');
    };

    // Start forwarding a message
    const handleStartForwarding = (message) => {
        if (!message.isDeleted) {
            setForwardingMessage(message);
            setShowForwardModal(true);
        }
    };

    // Complete forwarding a message
    const handleCompleteForwarding = (targetChatId) => {
        if (forwardingMessage) {
            onForwardMessage(forwardingMessage._id, targetChatId);
            setForwardingMessage(null);
            setShowForwardModal(false);
        }
    };

    // Cancel forwarding
    const handleCancelForwarding = () => {
        setForwardingMessage(null);
        setShowForwardModal(false);
    };

    // Auto-scroll to bottom of messages when chat changes or new messages arrive
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [chat?.messages]);

    // Focus input field when editing message changes
    useEffect(() => {
        if (editingMessage && inputRef.current) {
            inputRef.current.focus();
        }
    }, [editingMessage]);

    // If there's no active chat, don't render anything
    if (!chat) {
        return null;
    }

    // Make sure messages exists and is an array
    const messages = chat.messages || [];

    return (
        <div className="conversation-panel">
            {/* Header with contact/group info */}
            <div className="conversation-header">
                <div className="conversation-avatar">
                    <AvatarCircle src={chat.avatarUrl} radius="40px" />
                </div>
                <div className="conversation-info">
                    <h3>{chat.name}</h3>
                    <span className="online-status">online</span>
                </div>
            </div>

            {/* Messages container */}
            <div className="messages-container">
                {loading ? (
                    <div className="loading-messages">
                        <p>Loading messages...</p>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="no-messages">
                        <p>No messages yet. Start the conversation!</p>
                    </div>
                ) : (
                    /* Map through messages and render message bubbles */
                    messages.map(msg => (
                        <MessageBubble 
                            key={msg._id} 
                            message={msg}
                            currentUserId={currentUserId}
                            onEdit={() => handleStartEditing(msg)}
                            onDelete={() => onDeleteMessage(msg._id)}
                            onForward={() => handleStartForwarding(msg)}
                        />
                    ))
                )}
                {/* This empty div serves as a reference for scrolling to bottom */}
                <div ref={messagesEndRef} />
            </div>

            {/* Message input area */}
            <div className="message-input-container">
                {editingMessage && (
                    <div className="editing-indicator">
                        <span>Editing message</span>
                        <button onClick={handleCancelEditing} className="cancel-edit-button">Cancel</button>
                    </div>
                )}
                <div className="message-input-row">
                    <textarea
                        ref={inputRef}
                        className="message-input"
                        placeholder={editingMessage ? "Edit your message..." : "Type a message"}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                    <button
                        className="send-button"
                        onClick={handleSendMessage}
                        disabled={!message.trim()}
                    >
                        {editingMessage ? 'Save' : 'Send'}
                    </button>
                </div>
            </div>

            {/* Forward message modal */}
            {showForwardModal && (
                <ForwardMessageModal
                    message={forwardingMessage}
                    chats={availableChats}
                    onForward={handleCompleteForwarding}
                    onCancel={handleCancelForwarding}
                />
            )}
        </div>
    );
};

export default ConversationPanel;