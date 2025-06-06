// import "../../style/ChatSquare.css";
// import React, { useEffect, useState } from 'react';
// import AvatarCircle from './AvatarCircle';
// import { sendGet } from '../../services/RequestSender';
// import { useUser } from '../../services/UserContext';

// const ChatSquare = ({ chat = {} }) => {
//     const { name, avatarUrl } = chat;
//     const { user } = useUser();
    
//     const [messagesArray, setMessagesArray] = useState([]);
//     const [lastMessage, setLastMessage] = useState(null);
//     const [sender, setSender] = useState(null);
    
//     // First fetch messages for this chat
//     useEffect(() => {
//         const fetchMessages = async () => {
//             if (!chat._id || !user || !user._id || !user.token) return;
            
//             try {
//                 console.log(`Fetching messages for chat ${chat._id}`);
//                 const response = await sendGet(`/messages/${chat._id}/chat/${user._id}`, user.token);
                
//                 if (response.status === 200) {
//                     console.log("Full API response:", response.data);
                    
//                     // Check if the response has a data property that is an array
//                     const messagesData = response.data.data && Array.isArray(response.data.data) 
//                         ? response.data.data 
//                         : Array.isArray(response.data) 
//                             ? response.data 
//                             : [];
                    
//                     console.log("Extracted messages array:", messagesData);
//                     setMessagesArray(messagesData);
//                 }
//             } catch (error) {
//                 console.error("Error fetching messages:", error);
//             }
//         };

//         fetchMessages();
//     }, [chat._id, user]);

//     // After messages are loaded, get the last message and then fetch sender info
//     useEffect(() => {
//         if (messagesArray && messagesArray.length > 0) {
//             const lastMsg = messagesArray[messagesArray.length - 1];
//             console.log("Last message in array:", lastMsg);
//             setLastMessage(lastMsg);

//             // Only fetch sender if we have a valid sender ID
//             if (lastMsg && lastMsg.sender) {
//                 const fetchSender = async () => {
//                     try {
//                         console.log(`Fetching sender ${lastMsg.sender}`);
//                         const response = await sendGet(`/users/${lastMsg.sender}`, user.token);
                        
//                         if (response.status === 200) {
//                             console.log("Full sender response:", response.data);
                            
//                             // Check if response has a data property
//                             const senderData = response.data.data || response.data;
//                             console.log("Extracted sender data:", senderData);
//                             setSender(senderData);
//                         }
//                     } catch (error) {
//                         console.error("Error fetching sender:", error);
//                     }
//                 };
                
//                 fetchSender();
//             } else {
//                 console.warn("Last message has no sender property:", lastMsg);
//             }
//         }
//     }, [messagesArray, user.token]);

//     // Format the timestamp for display
//     const formatTimestamp = (timestamp) => {
//         if (!timestamp) return "--:--";
        
//         try {
//             const date = new Date(timestamp);
//             return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
//         } catch (error) {
//             console.error("Error formatting timestamp:", error);
//             return "--:--";
//         }
//     };

//     // For debugging
//     useEffect(() => {
//         console.log("Current state:", {
//             messagesArray,
//             lastMessage,
//             sender
//         });
//     }, [messagesArray, lastMessage, sender]);

//     return (
//         <div className="chat-square">
//             <div className="avatar-wrapper">
//                 <AvatarCircle src={avatarUrl} radius="60px" />
//             </div>

//             <div className="chat-square-content">
//                 <div className="chat-square-header">
//                     <span className="chat-name">{name || "Unknown"}</span>
//                     <span className="chat-timestamp">
//                         {formatTimestamp(lastMessage?.createdAt)}
//                     </span>
//                 </div>
                
//                 <p className="chat-preview chat-preview-container">
//                     {sender && typeof sender === 'object' && sender.username ? (
//                         <>
//                             <span className="sender-name">{sender.username}:</span>
//                             <span className="message-text">{lastMessage?.text || ""}</span>
//                         </>
//                     ) : (
//                         <span className="message-text">{lastMessage?.text || "No messages yet"}</span>
//                     )}
//                 </p>
//             </div>
//         </div>
//     );
// };

// export default ChatSquare;
import "../../style/ChatSquare.css";
import React, { useEffect, useState } from 'react';
import AvatarCircle from './AvatarCircle';
import { sendGet } from '../../services/RequestSender';
import { useUser } from '../../services/UserContext';

const ChatSquare = ({ chat = {}, messageUpdateTrigger }) => {
    const { name, avatarUrl } = chat;
    const { user } = useUser();
    
    const [messagesArray, setMessagesArray] = useState([]);
    const [lastMessage, setLastMessage] = useState(null);
    const [sender, setSender] = useState(null);
    
    // First fetch messages for this chat
    useEffect(() => {
        const fetchMessages = async () => {
            if (!chat._id || !user || !user._id || !user.token) return;
            
            try {
                console.log(`Fetching messages for chat ${chat._id}`);
                const response = await sendGet(`/messages/${chat._id}/chat/${user._id}`, user.token);
                
                if (response.status === 200) {
                    console.log("Full API response:", response.data);
                    
                    // Check if the response has a data property that is an array
                    const messagesData = response.data.data && Array.isArray(response.data.data) 
                        ? response.data.data 
                        : Array.isArray(response.data) 
                            ? response.data 
                            : [];
                    
                    console.log("Extracted messages array:", messagesData);
                    setMessagesArray(messagesData);
                }
            } catch (error) {
                console.error("Error fetching messages:", error);
            }
        };

        fetchMessages();
    }, [chat._id, user, messageUpdateTrigger]); // messageUpdateTrigger is now a prop

    // After messages are loaded, get the last message and then fetch sender info
    useEffect(() => {
        if (messagesArray && messagesArray.length > 0) {
            const lastMsg = messagesArray[messagesArray.length - 1];
            console.log("Last message in array:", lastMsg);
            setLastMessage(lastMsg);

            // Only fetch sender if we have a valid sender ID
            if (lastMsg && lastMsg.sender) {
                const fetchSender = async () => {
                    try {
                        console.log(`Fetching sender ${lastMsg.sender}`);
                        const response = await sendGet(`/users/${lastMsg.sender}`, user.token);
                        
                        if (response.status === 200) {
                            console.log("Full sender response:", response.data);
                            
                            // Check if response has a data property
                            const senderData = response.data.data || response.data;
                            console.log("Extracted sender data:", senderData);
                            setSender(senderData);
                        }
                    } catch (error) {
                        console.error("Error fetching sender:", error);
                    }
                };
                
                fetchSender();
            } else {
                console.warn("Last message has no sender property:", lastMsg);
            }
        } else {
            // Reset states when there are no messages
            setLastMessage(null);
            setSender(null);
        }
    }, [messagesArray, user.token]);

    // Format the timestamp for display
    const formatTimestamp = (timestamp) => {
        if (!timestamp) return "--:--";
        
        try {
            const date = new Date(timestamp);
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch (error) {
            console.error("Error formatting timestamp:", error);
            return "--:--";
        }
    };

    // Get the display timestamp - last message time or chat creation time
    const getDisplayTimestamp = () => {
        // If we have lastMessage data from parent (ChatPage updates), use it
        if (chat.lastMessageTime) {
            return formatTimestamp(chat.lastMessageTime);
        }
        
        // If there's a last message from our local fetch, use its timestamp
        if (lastMessage?.createdAt) {
            return formatTimestamp(lastMessage.createdAt);
        }
        
        // If no messages, use chat creation time
        if (chat.createdAt) {
            return formatTimestamp(chat.createdAt);
        }
        
        // Fallback
        return "--:--";
    };

    // Get the display message - prioritize parent updates over local state
    const getDisplayMessage = () => {
        // If parent has updated lastMessage data, use it
        if (chat.lastMessage) {
            return chat.lastMessage;
        }
        
        // Otherwise use local lastMessage
        return lastMessage;
    };

    // For debugging
    useEffect(() => {
        console.log("Current state:", {
            messagesArray,
            lastMessage,
            sender,
            chatCreatedAt: chat.createdAt
        });
    }, [messagesArray, lastMessage, sender, chat.createdAt]);

    return (
        <div className="chat-square">
            <div className="avatar-wrapper">
                <AvatarCircle src={avatarUrl} radius="60px" />
            </div>

            <div className="chat-square-content">
                <div className="chat-square-header">
                    <span className="chat-name">{name || "Unknown"}</span>
                    <span className="chat-timestamp">
                        {getDisplayTimestamp()}
                    </span>
                </div>
                
                <p className="chat-preview chat-preview-container">
                    {(() => {
                        const displayMessage = getDisplayMessage();
                        
                        if (!displayMessage) {
                            return <span className="message-text">No messages yet</span>;
                        }
                        
                        if (sender && typeof sender === 'object' && sender.username) {
                            return (
                                <>
                                    <span className="sender-name">{sender.username}:</span>
                                    <span className="message-text">
                                        {displayMessage.isDeleted ? "Message was deleted" : (displayMessage?.text || "")}
                                    </span>
                                </>
                            );
                        }
                        
                        return (
                            <span className="message-text">
                                {displayMessage.isDeleted ? "Message was deleted" : (displayMessage?.text || "")}
                            </span>
                        );
                    })()}
                </p>
            </div>
        </div>
    );
};

export default ChatSquare;