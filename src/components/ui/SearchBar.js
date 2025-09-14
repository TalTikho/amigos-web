import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useUser } from '../../services/UserContext';
import { sendGet } from '../../services/RequestSender';
import '../../style/SearchBar.css';

/**
 * SearchBar - Component for searching chats and messages
 * Fixed to prevent visual jumps during chat search by maintaining consistent result structure and single state update
 */
const SearchBar = ({ onSelectChat, onSelectMessage, chats }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]); // Combined results in a single array
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const { user } = useUser();

    const searchRef = useRef(null);
    // Cache for sender information to avoid redundant API calls
    const senderCacheRef = useRef(new Map());
    // Cache for chat messages to avoid repeated API calls
    const chatMessagesCacheRef = useRef(new Map());
    // Cache for processed search results for specific queries
    const searchResultsCacheRef = useRef(new Map());

    const fetchSenderInfo = useCallback(async (senderId) => {
        if (!senderId || !user?.token) return null;

        // Check cache first
        if (senderCacheRef.current.has(senderId)) {
            return senderCacheRef.current.get(senderId);
        }

        try {
            const response = await sendGet(`/users/${senderId}`, user.token);
            if (response.status === 200) {
                const senderData = response.data.data || response.data;
                // Cache the result
                senderCacheRef.current.set(senderId, senderData);
                return senderData;
            }
        } catch (error) {
            console.error(`Error fetching sender ${senderId}:`, error);
        }
        return null;
    }, [user?.token]);

    // Fetch and cache messages for a specific chat
    const fetchChatMessages = useCallback(async (chatId) => {
        if (!chatId || !user?._id || !user?.token) return [];

        // Check cache first
        if (chatMessagesCacheRef.current.has(chatId)) {
            return chatMessagesCacheRef.current.get(chatId);
        }

        try {
            const response = await sendGet(`/messages/${chatId}/chat/${user._id}`, user.token);

            const messagesData = response.status === 200
                ? (Array.isArray(response.data.data) ? response.data.data : (Array.isArray(response.data) ? response.data : []))
                : [];
            // Cache the messages
            chatMessagesCacheRef.current.set(chatId, messagesData);
            return messagesData;
        } catch (error) {
            console.error(`Error fetching messages for chat ${chatId}:`, error);
            return [];
        }
    }, [user?._id, user?.token]);

    const performSearch = useCallback(async (query) => {
        if (!user?._id || !user?.token || !query) {
            setSearchResults([]);
            setShowResults(false);
            return;
        }

        const normalizedQuery = query.toLowerCase().trim();

        // Check if we have cached results for this exact query to prevent re-computation
        if (searchResultsCacheRef.current.has(normalizedQuery)) {
            const cachedResults = searchResultsCacheRef.current.get(normalizedQuery);
            setSearchResults(cachedResults);
            setShowResults(true);
            setIsSearching(false); // Ensure loading is off if cached
            return;
        }

        setIsSearching(true); // Start searching indicator

        try {
            // Filter chat names (fast, no API calls needed)
            const chatResults = chats
                .filter(chat => chat.name && chat.name.toLowerCase().includes(normalizedQuery))
                .map(chat => ({
                    ...chat,
                    type: 'chat',
                    relevanceScore: chat.name.toLowerCase().indexOf(normalizedQuery) // Lower score for earlier match
                }));

            // Search messages in all chats
            let messageResults = [];

            // Use Promise.all to fetch messages for all chats concurrently
            const allMessagePromises = chats.map(async (chat) => {
                const messages = await fetchChatMessages(chat._id);

                const matchingMessages = messages.filter(message =>
                    message.text &&
                    message.text.toLowerCase().includes(normalizedQuery) &&
                    !message.isDeleted
                );

                // Fetch sender info for each matching message
                const messagesWithSenders = await Promise.all(
                    matchingMessages.map(async (message) => {
                        // Handle cases where message.sender might be an object with an _id or just an ID string
                        const senderId = typeof message.sender === 'object' && message.sender?._id ? message.sender._id : message.sender;
                        const senderInfo = await fetchSenderInfo(senderId);

                        return {
                            ...message,
                            type: 'message', // Mark as message type
                            chatName: chat.name,
                            chatId: chat._id,
                            chat: chat, // Keep chat object for navigation
                            senderName: senderInfo?.username || 'Unknown User',
                            senderPhoto: senderInfo?.profile_pic || 'assets/images/default_chat_picture.png',
                            relevanceScore: message.text.toLowerCase().indexOf(normalizedQuery) // Lower score for earlier match
                        };
                    })
                );
                return messagesWithSenders;
            });

            // Wait for all message searches to complete
            messageResults = (await Promise.all(allMessagePromises)).flat();

            // Combine all results (chats and messages)
            let combinedResults = [...chatResults, ...messageResults];

            // Sort by relevance (exact matches first) then by recency
            combinedResults.sort((a, b) => {
                // First sort by relevance score (lower score means the query appears earlier in the name/text)
                if (a.relevanceScore !== b.relevanceScore) {
                    return a.relevanceScore - b.relevanceScore;
                }

                // Then sort by recency (most recent first)
                const dateA = new Date(a.createdAt || a.updatedAt);
                const dateB = new Date(b.createdAt || b.updatedAt);
                return dateB - dateA;
            });

            const limitedResults = combinedResults.slice(0, 20); // Limit results for performance

            // Cache the final results for this query
            searchResultsCacheRef.current.set(normalizedQuery, limitedResults);

            // Clear old cache entries to prevent memory leaks (keep last 10 searches)
            if (searchResultsCacheRef.current.size > 10) {
                const oldestKey = searchResultsCacheRef.current.keys().next().value;
                searchResultsCacheRef.current.delete(oldestKey);
            }

            // Update state ONLY ONCE with the final, combined, and sorted results
            setSearchResults(limitedResults);
            setShowResults(true);

        } catch (error) {
            console.error('Error performing search:', error);
            setSearchResults([]); // Clear results on error
        } finally {
            setIsSearching(false); // End searching indicator
        }
    }, [user, chats, fetchChatMessages, fetchSenderInfo]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            const trimmedQuery = searchQuery.trim();
            if (trimmedQuery) {
                performSearch(trimmedQuery);
            } else {
                setSearchResults([]);
                setShowResults(false);
            }
        }, 150); // Debounce time: 150ms

        return () => clearTimeout(timeoutId);
    }, [searchQuery, performSearch]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowResults(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Clear caches when user changes
    useEffect(() => {
        senderCacheRef.current.clear();
        chatMessagesCacheRef.current.clear();
        searchResultsCacheRef.current.clear();
    }, [user?._id]);

    // Clear message and search results cache when chats array changes (new messages might have been added or chat structure changed)
    useEffect(() => {
        chatMessagesCacheRef.current.clear();
        searchResultsCacheRef.current.clear();
    }, [chats]);


    const handleChatSelect = (chat) => {
        onSelectChat(chat);
        setShowResults(false);
        setSearchQuery('');
    };

    const handleMessageSelect = (message) => {
        onSelectChat(message.chat);
        onSelectMessage?.(message);
        setShowResults(false);
        setSearchQuery('');
    };

    const formatTimestamp = (timestamp) => {
        if (!timestamp) return "";
        try {
            const date = new Date(timestamp);
            const now = new Date();
            const diffInHours = (now - date) / (1000 * 60 * 60);

            return diffInHours < 24
                ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : date.toLocaleDateString();
        } catch {
            return "";
        }
    };

    const highlightText = (text, query) => {
        if (!text || !query) return text;

        const parts = text.split(new RegExp(`(${query})`, 'gi'));
        return parts.map((part, i) =>
            part.toLowerCase() === query.toLowerCase()
                ? <mark key={i} className="search-highlight">{part}</mark>
                : part
        );
    };

    const truncateText = (text, maxLength = 100) => {
        if (!text || text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    };

    return (
        <div className="search-bar-container" ref={searchRef}>
            <div className="search-input-container">
                <input
                    type="text"
                    placeholder="Search chats and messages..."
                    className="search-input"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => searchQuery.trim() && setShowResults(true)}
                />
                {/* Global loading indicator for any ongoing search */}
                {isSearching && (
                    <div className="search-loading">
                        <div className="loading-dots">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                    </div>
                )}
            </div>

            {showResults && (
                <div className="search-results">
                    {searchResults.length > 0 ? (
                        searchResults.map(item => (
                            item.type === 'chat' ? (
                                <div
                                    key={`chat-${item._id}`}
                                    className="search-result-item chat-result"
                                    onClick={() => handleChatSelect(item)}
                                >
                                    <div className="search-result-avatar">
                                        <img
                                            src={item.photo || 'assets/images/default_chat_picture.png'}
                                            alt={item.name}
                                            className="result-avatar"
                                            onError={(e) => {
                                                e.target.src = '/default-avatar.png'; // Fallback image on error
                                            }}
                                        />
                                    </div>
                                    <div className="search-result-content">
                                        <div className="search-result-name">
                                            {highlightText(item.name, searchQuery)}
                                        </div>
                                        <div className="search-result-type">Chat</div>
                                    </div>
                                </div>
                            ) : (
                                <div
                                    key={`message-${item._id}`}
                                    className="search-result-item message-result"
                                    onClick={() => handleMessageSelect(item)}
                                >
                                    <div className="search-result-avatar">
                                        <img
                                            src={item.senderPhoto || '/default-avatar.png'}
                                            alt={item.senderName || 'User'}
                                            className="result-avatar"
                                            onError={(e) => {
                                                e.target.src = '/default-avatar.png'; // Fallback image on error
                                            }}
                                        />
                                    </div>
                                    <div className="search-result-content">
                                        <div className="search-result-header">
                                            <span className="search-result-chat-name">{item.chatName}</span>
                                            <span className="search-result-timestamp">{formatTimestamp(item.createdAt)}</span>
                                        </div>
                                        <div className="search-result-message">
                                            <span className="search-result-sender">{item.senderName}: </span>
                                            <span className="search-result-text">
                                                {highlightText(truncateText(item.text), searchQuery)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )
                        ))
                    ) : (
                        searchQuery.trim() && !isSearching && (
                            <div className="no-search-results">
                                No results found for "{searchQuery}"
                            </div>
                        )
                    )}
                </div>
            )}
        </div>
    );
};

export default SearchBar;