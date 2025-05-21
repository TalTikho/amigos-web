import React from 'react';
import AvatarCircle from './AvatarCircle';
import '../../style/ForwardMessageModal.css';

/**
 * ForwardMessageModal - Component for forwarding messages to other chats
 * 
 * This modal displays a list of available chats that the user can
 * forward a message to. Updated to work with server data structure.
 * 
 * Props:
 * - message: The message being forwarded
 * - chats: Array of available chats to forward to
 * - onForward: Function to call when a chat is selected for forwarding
 * - onCancel: Function to call when forwarding is cancelled
 */
const ForwardMessageModal = ({ message, chats, onForward, onCancel }) => {
    if (!message) return null;
    
    // Get the message text, handling different property names
    const messageText = message.text || message.content || "";

    return (
        <div className="forward-modal-overlay">
            <div className="forward-modal">
                <div className="forward-modal-header">
                    <h3>Forward Message</h3>
                    <button className="close-modal-button" onClick={onCancel}>×</button>
                </div>
                
                <div className="forward-message-preview">
                    <p className="preview-label">Message to forward:</p>
                    <div className="message-preview">
                        {messageText.length > 100 
                            ? `${messageText.substring(0, 100)}...` 
                            : messageText
                        }
                    </div>
                </div>
                
                <div className="forward-modal-content">
                    <p className="select-chat-label">Select a chat to forward to:</p>
                    <div className="forward-chats-list">
                        {!chats || chats.length === 0 ? (
                            <p className="no-chats-message">No other chats available</p>
                        ) : (
                            chats.map(chat => (
                                <div 
                                    key={chat._id} 
                                    className="forward-chat-item"
                                    onClick={() => onForward(chat._id)}
                                >
                                    <div className="forward-chat-avatar">
                                        <AvatarCircle src={chat.avatarUrl} radius="30px" />
                                    </div>
                                    <div className="forward-chat-info">
                                        <h4>{chat.name}</h4>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
                
                <div className="forward-modal-footer">
                    <button className="cancel-button" onClick={onCancel}>Cancel</button>
                </div>
            </div>
        </div>
    );
};

export default ForwardMessageModal;