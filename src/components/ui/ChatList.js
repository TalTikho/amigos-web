// import React, { useEffect, useState } from 'react';
// import ChatSquare from './ChatSquare';
// import { sendGet } from '../../services/RequestSender';
// import { useUser } from '../../services/UserContext';
// import '../../style/ChatList.css';

// /**
//  * ChatList - Component for displaying the list of all conversations
//  * 
//  * This component renders a scrollable list of conversation previews
//  * similar to WhatsApp's left sidebar. Updated to work with server data structure.
//  * 
//  * Props:
//  * - conversations: Array of conversation objects from the server (not used anymore)
//  * - activeChat: The currently selected chat (if any)
//  * - onSelectChat: Function to call when a chat is selected
//  */
// const ChatList = ({ activeChat, onSelectChat }) => {
//     const { user } = useUser();
//     const [chats, setChats] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState(null);

//     // Getting all the chats
//     useEffect(() => {
//         const fetchChats = async () => {
//             if (!user?._id || !user?.token) return;
            
//             setLoading(true);
//             try {
//                 console.log(`Fetching chats for user ${user._id}`);
//                 const response = await sendGet(`/chats/${user._id}`, user.token);

//                 if (response.status === 200) {
//                     console.log("Chats fetched successfully:", response.data);
//                     // Handle both possible API response structures
//                     const chatsData = response.data.data ? response.data.data : response.data;
//                     setChats(chatsData);
//                 } else {
//                     throw new Error('Failed to fetch chats');
//                 }
//             } catch (error) {
//                 console.error("Error fetching chats:", error);
//                 setError("Failed to load chats. Please try again later.");
//             } finally {
//                 setLoading(false);
//             }
//         };

//         if (user?.token && user?._id) {
//             fetchChats();
//         }
//     }, [user?.token, user?._id]);

//     const handleChatClick = (chat) => {
//         if (onSelectChat) {
//             onSelectChat(chat);
//         }
//     };

//     return (
//         <div className="chat-list">
//             {loading && (
//                 <div className="loading-message">
//                     <p>Loading conversations...</p>
//                 </div>
//             )}

//             {error && (
//                 <div className="error-message">
//                     <p>{error}</p>
//                 </div>
//             )}

//             {/* Map through all conversations and render chat squares */}
//             {!loading && !error && chats && chats.map(chat => (
//                 <div key={chat._id} onClick={() => handleChatClick(chat)}>
//                     <ChatSquare 
//                         chat={chat} 
//                         isActive={activeChat && activeChat._id === chat._id}
//                     />
//                 </div>
//             ))}

//             {/* If there are no conversations, show a message */}
//             {!loading && !error && (!chats || chats.length === 0) && (
//                 <div className="no-chats-message">
//                     <p>No conversations yet</p>
//                 </div>
//             )}
//         </div>
//     );
// };

// export default ChatList;
import React, { useEffect, useState } from 'react';
import ChatSquare from './ChatSquare';
import { sendGet } from '../../services/RequestSender';
import { useUser } from '../../services/UserContext';
import '../../style/ChatList.css';

/**
 * ChatList - Component for displaying the list of all conversations
 * 
 * This component renders a scrollable list of conversation previews
 * similar to WhatsApp's left sidebar. Updated to work with server data structure
 * and uses direct state management for smooth updates without refetching.
 * 
 * Props:
 * - activeChat: The currently selected chat (if any)
 * - onSelectChat: Function to call when a chat is selected
 * - chatListData: Array of chat data managed by parent component
 * - setChatListData: Function to update chat list data
 */
const ChatList = ({ activeChat, onSelectChat, chatListData, setChatListData }) => {
    const { user } = useUser();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Getting all the chats
    useEffect(() => {
        const fetchChats = async () => {
            if (!user?._id || !user?.token) return;
            
            setLoading(true);
            try {
                console.log(`Fetching chats for user ${user._id}`);
                const response = await sendGet(`/chats/${user._id}`, user.token);

                if (response.status === 200) {
                    console.log("Chats fetched successfully:", response.data);
                    // Handle both possible API response structures
                    const chatsData = response.data.data ? response.data.data : response.data;
                    setChatListData(chatsData);
                } else {
                    throw new Error('Failed to fetch chats');
                }
            } catch (error) {
                console.error("Error fetching chats:", error);
                setError("Failed to load chats. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        if (user?.token && user?._id) {
            fetchChats();
        }
    }, [user?.token, user?._id, setChatListData]); // Updated dependencies

    const handleChatClick = (chat) => {
        if (onSelectChat) {
            onSelectChat(chat);
        }
    };

    return (
        <div className="chat-list">
            {loading && (
                <div className="loading-message">
                    <p>Loading conversations...</p>
                </div>
            )}

            {error && (
                <div className="error-message">
                    <p>{error}</p>
                </div>
            )}

            {/* Map through all conversations and render chat squares */}
            {!loading && !error && chatListData && chatListData.map(chat => (
                <div key={chat._id} onClick={() => handleChatClick(chat)}>
                    <ChatSquare 
                        chat={chat} 
                        isActive={activeChat && activeChat._id === chat._id}
                    />
                </div>
            ))}

            {/* If there are no conversations, show a message */}
            {!loading && !error && (!chatListData || chatListData.length === 0) && (
                <div className="no-chats-message">
                    <p>No conversations yet</p>
                </div>
            )}
        </div>
    );
};

export default ChatList;