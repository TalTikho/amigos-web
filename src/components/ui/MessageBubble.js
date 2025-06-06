// import React, { useState } from 'react';
// import '../../style/MessageBubble.css';

// /**
//  * MessageBubble - Component for displaying individual chat messages
//  * 
//  * This component displays a single message bubble similar to WhatsApp.
//  * It handles both sent and received messages with different styles
//  * and includes options for editing, deleting, and forwarding messages.
//  * Updated to work with server data structure.
//  * 
//  * Props:
//  * - message: Object containing message data (text, sender, timestamp, etc.)
//  * - currentUserId: ID of the current user, to determine if message is sent or received
//  * - onEdit: Function to call when edit action is triggered
//  * - onDelete: Function to call when delete action is triggered
//  * - onForward: Function to call when forward action is triggered
//  */
// const MessageBubble = ({ message, currentUserId, onEdit, onDelete, onForward }) => {
//     // State for showing and hiding message actions
//     const [showActions, setShowActions] = useState(false);

//     // Determine if message is from current user
//     const isCurrentUserMessage = message.sender === currentUserId;

//     // Determine message class based on sender (for styling purposes)
//     const bubbleClass = isCurrentUserMessage ? 'message-sent' : 'message-received';

//     // Toggle message actions dropdown
//     const toggleActions = () => {
//         setShowActions(!showActions);
//     };

//     // Check if message is forwarded by looking for the [Forwarded] prefix
//     const isForwardedMessage = message.text && message.text.startsWith('[Forwarded]');
//     const displayText = isForwardedMessage
//         ? message.text.replace('[Forwarded] ', '')
//         : message.text;

//     // Handle click away to hide actions
//     const handleClickAway = (e) => {
//         if (!e.target.closest('.message-actions') && !e.target.closest('.message-options-toggle')) {
//             setShowActions(false);
//         }
//     };

//     // Add event listener when actions are shown
//     React.useEffect(() => {
//         if (showActions) {
//             document.addEventListener('click', handleClickAway);
//         } else {
//             document.removeEventListener('click', handleClickAway);
//         }

//         return () => {
//             document.removeEventListener('click', handleClickAway);
//         };
//     }, [showActions]);

//     // Function to format timestamp
//     const formatTimestamp = (timestamp) => {
//         if (!timestamp) return '';

//         try {
//             // If it's an ISO string from the server, format it
//             const date = new Date(timestamp);
//             return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
//         } catch (error) {
//             console.error("Error formatting timestamp:", error);
//             return '';
//         }
//     };

//     return (
//         <div className={`message-bubble-container ${bubbleClass}`}>
//             <div className={`message-bubble ${message.isDeleted ? 'message-deleted' : ''}`}>
//                 {isForwardedMessage && (
//                     <div className="forwarded-indicator">
//                         <span className="forwarded-icon">↩️</span>
//                         <span className="forwarded-text">Forwarded</span>
//                     </div>
//                 )}
//                 {/* Message text content */}
//                 <div className="message-text">
//                     {message.is_forwarded && !message.isDeleted && (
//                         <div className="forwarded-label">
//                             <span>Forwarded</span>
//                         </div>
//                     )}
//                     {message.isDeleted ? "Message was deleted" : message.text || message.content || ""}
//                 </div>

//                 {/* Message timestamp and status */}
//                 <div className="message-info">
//                     {message.updatedAt && message.updatedAt !== message.createdAt ? (
//                         <span className="edited-indicator">
//                             {message.isDeleted ? 'deleted at' : 'edited at'} {formatTimestamp(message.updatedAt)}
//                         </span>
//                     ) : (
//                         <span className="message-timestamp">
//                             {formatTimestamp(message.createdAt)}
//                         </span>
//                     )}
//                 </div>

//                 {/* Message options toggle (three dots) - Only show for non-deleted messages */}
//                 {!message.isDeleted && (
//                     <button
//                         className="message-options-toggle"
//                         onClick={toggleActions}
//                         aria-label="Message options"
//                     >
//                         ...
//                     </button>
//                 )}

//                 {/* Message actions dropdown */}
//                 {showActions && !message.isDeleted && (
//                     <div className="message-actions">
//                         {/* Only show edit option for your own messages */}
//                         {isCurrentUserMessage && (
//                             <button onClick={() => { onEdit(); setShowActions(false); }}>
//                                 Edit
//                             </button>
//                         )}

//                         {/* Only show delete option for your own messages */}
//                         {isCurrentUserMessage && (
//                             <button onClick={() => { onDelete(); setShowActions(false); }}>
//                                 Delete
//                             </button>
//                         )}

//                         {/* Forward option available for all messages */}
//                         <button onClick={() => { onForward(); setShowActions(false); }}>
//                             Forward
//                         </button>
//                     </div>
//                 )}
//             </div>
//         </div>
//     );
// };

// export default MessageBubble;

import React, { useState } from 'react';
import '../../style/MessageBubble.css';

/**
 * MessageBubble - Component for displaying individual chat messages
 * 
 * This component displays a single message bubble similar to WhatsApp.
 * It handles both sent and received messages with different styles
 * and includes options for editing, deleting, and forwarding messages.
 * Updated to work with server data structure and is_forwarded flag.
 * Editing is disabled for forwarded messages.
 * 
 * Props:
 * - message: Object containing message data (text, sender, timestamp, etc.)
 * - currentUserId: ID of the current user, to determine if message is sent or received
 * - onEdit: Function to call when edit action is triggered
 * - onDelete: Function to call when delete action is triggered
 * - onForward: Function to call when forward action is triggered
 */
const MessageBubble = ({ message, currentUserId, onEdit, onDelete, onForward }) => {
    // State for showing and hiding message actions
    const [showActions, setShowActions] = useState(false);

    // Determine if message is from current user
    const isCurrentUserMessage = message.sender === currentUserId;

    // Determine message class based on sender (for styling purposes)
    const bubbleClass = isCurrentUserMessage ? 'message-sent' : 'message-received';

    // Toggle message actions dropdown
    const toggleActions = () => {
        setShowActions(!showActions);
    };

    // Check if message is forwarded using the server flag
    const isForwardedMessage = message.is_forwarded === true;

    // Get clean message text (no need to remove prefix since server handles it properly)
    const getCleanMessageText = () => {
        return message.text || message.content || "";
    };

    // Handle click away to hide actions
    const handleClickAway = (e) => {
        if (!e.target.closest('.message-actions') && !e.target.closest('.message-options-toggle')) {
            setShowActions(false);
        }
    };

    // Add event listener when actions are shown
    React.useEffect(() => {
        if (showActions) {
            document.addEventListener('click', handleClickAway);
        } else {
            document.removeEventListener('click', handleClickAway);
        }

        return () => {
            document.removeEventListener('click', handleClickAway);
        };
    }, [showActions]);

    // Function to format timestamp
    const formatTimestamp = (timestamp) => {
        if (!timestamp) return '';

        try {
            const date = new Date(timestamp);
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch (error) {
            console.error("Error formatting timestamp:", error);
            return '';
        }
    };

    return (
        <div className={`message-bubble-container ${bubbleClass}`}>
            <div className={`message-bubble ${message.isDeleted ? 'message-deleted' : ''}`}>
                {/* Show forwarded indicator for forwarded messages */}
                {isForwardedMessage && !message.isDeleted && (
                    <div className="forwarded-indicator">
                        <span className="forwarded-icon">↩️</span>
                        <span className="forwarded-text">Forwarded</span>
                    </div>
                )}

                {/* Message text content - always show clean text */}
                <div className="message-text">
                    {message.isDeleted ? "Message was deleted" : getCleanMessageText()}
                </div>

                {/* Message timestamp and status */}
                <div className="message-info">
                    {message.updatedAt && message.updatedAt !== message.createdAt ? (
                        <span className="edited-indicator">
                            {message.isDeleted ? 'deleted at' : 'edited at'} {formatTimestamp(message.updatedAt)}
                        </span>
                    ) : (
                        <span className="message-timestamp">
                            {formatTimestamp(message.createdAt)}
                        </span>
                    )}
                </div>

                {/* Message options toggle (three dots) - Only show for non-deleted messages */}
                {!message.isDeleted && (
                    <button
                        className="message-options-toggle"
                        onClick={toggleActions}
                        aria-label="Message options"
                    >
                        ...
                    </button>
                )}

                {/* Message actions dropdown */}
                {showActions && !message.isDeleted && (
                    <div className="message-actions">
                        {/* Only show edit option for your own messages AND if message is not forwarded */}
                        {isCurrentUserMessage && !isForwardedMessage && (
                            <button onClick={() => { onEdit(); setShowActions(false); }}>
                                Edit
                            </button>
                        )}

                        {/* Only show delete option for your own messages */}
                        {isCurrentUserMessage && (
                            <button onClick={() => { onDelete(); setShowActions(false); }}>
                                Delete
                            </button>
                        )}

                        {/* Forward option available for all messages */}
                        <button onClick={() => { onForward(); setShowActions(false); }}>
                            Forward
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MessageBubble;