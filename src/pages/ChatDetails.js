// src/pages/ChatDetails.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

// Services and Context
import { useUser } from '../services/UserContext';
import { sendGet, sendPut, sendDelete } from '../services/RequestSender';

// UI Components
import AvatarCircle from '../components/ui/AvatarCircle';
import Alert from '../components/ui/Alert';
import MediaGallery from '../components/ui/MediaGallery';
import MembersList from '../components/ui/MembersList';

// Styling
import '../style/ChatDetails.css';

/**
 * ChatDetails - Component for displaying and managing chat information.
 * This component shows details of a selected chat, including its name,
 * description, members (for groups), shared media, and settings like
 * muting notifications, blocking users, or leaving/deleting the chat.
 * It's adjusted to match backend API routes and coding style.
 */
const ChatDetails = () => {
  // Extract chat ID from URL parameters
  const { chatId } = useParams();
  // Access user context for current user's ID and token
  const { user }   = useUser();
  // Navigation hook
  const navigate   = useNavigate();

  /* ---------- State Management ---------- */
  // Holds the main chat object fetched from the backend
  const [chat, setChat] = useState(null);
  // Stores an array of full user objects for chat members
  const [members, setMembers] = useState([]);
  // Stores an array of media objects (images/videos) shared in the chat
  const [media, setMedia] = useState([]);
  // Indicates if data is currently being loaded
  const [loading, setLoading] = useState(true);
  // Manages alert messages for user feedback (success/error)
  const [alert, setAlert] = useState({ msg: '', type: 'success' });
  // Controls the visibility of the description edit input
  const [isEditing, setIsEditing] = useState(false);
  // Holds the new description text while editing
  const [newDescription, setNewDescription] = useState('');
  // Controls which tab (media, members, settings) is currently active
  const [activeTab, setActiveTab] = useState('media'); // Default to 'media' tab

  /* ---------- Helper Functions ---------- */

  // Displays a temporary alert message to the user
  const flash = useCallback((msg, type = 'error', ttl = 2500) => {
    setAlert({ msg, type });
    // Clear the alert after a set time
    setTimeout(() => setAlert({ msg: '', type: 'success' }), ttl);
  }, []);

  // Handles API errors, logs them, flashes an alert, and redirects on auth failure
  const apiError = useCallback((err, msg) => {
    console.error(msg, err);
    // Display error message from response, or a generic one
    flash(err.response?.data?.error || msg);
    // Redirect to login/signup if unauthorized
    if (err.response?.status === 401) {
      navigate('/login-signup');
    }
  }, [flash, navigate]);

  /* ---------- Data Fetching ---------- */

  // Fetches full user details for a given user ID
  const fetchUser = useCallback(async (id) => {
    if (!user?.token) return { _id: id, username: 'Unknown User', profileImage: null };
    
    try {
      const r = await sendGet(`/users/${id}`, user.token);
      if (r.status === 200) {
        const userData = r.data.data || r.data;
        return {
          _id: userData._id,
          username: userData.username || 'Unknown User', // Fallback for username
          email: userData.email,
          // Prioritize 'profileImage' for consistency, fall back to 'profile_pic'
          profileImage: userData.profileImage || userData.profile_pic || null,
        };
      }
      // Return a basic user object with a fallback username on non-200 status
      return { _id: id, username: 'Unknown User', profileImage: null };
    } catch (error) {
      console.error(`Error fetching user ${id}:`, error);
      // Return a basic user object with a fallback username on fetch error
      return { _id: id, username: 'Unknown User', profileImage: null };
    }
  }, [user?.token]);

  // Fetches media for the current chat using your existing media API
  const fetchChatMedia = useCallback(async () => {
    if (!chatId || !user?._id || !user?.token) return;
    
    try {
      // Use your existing media route: GET /media/:userId/related/:relatedId/:onModel
      const response = await sendGet(`/media/${user._id}/related/${chatId}/Chat`, user.token);
      
      if (response.status === 200) {
        const mediaData = response.data.data || response.data;
        console.log("Fetched chat media:", mediaData);
        setMedia(mediaData);
      }
    } catch (error) {
      console.error("Error fetching chat media:", error);
      // Don't show error to user for media fetch failures, just log it
      setMedia([]);
    }
  }, [chatId, user?._id, user?.token]);

  // Update the main fetchChat function to also fetch media
  const fetchChat = useCallback(async () => {
    console.log("fetchChat: Starting fetch process.");
    if (!chatId || !user?._id || !user?.token) {
      console.log("fetchChat: Missing chatId, user ID, or token. Aborting fetch.");
      setLoading(false);
      return;
    }
    console.log(`fetchChat: Attempting to fetch chat ${chatId} for user ${user._id}`);

    try {
      setLoading(true);
      // Updated to match your server route
      const res = await sendGet(`/chats/get-single-chat/${chatId}`, user.token);
      console.log("fetchChat: Response from /chats/get-single-chat/:chatId:", res);

      if (res.status !== 200) {
        console.error("fetchChat: Non-200 status received:", res.status);
        throw new Error(`Failed to fetch chat: Status ${res.status}`);
      }

      const rawChatData = res.data.data || res.data;
      console.log("fetchChat: Raw chat data received:", rawChatData);

      // Process the chat data based on your backend response structure
      const processedChat = {
        _id: rawChatData._id,
        name: rawChatData.name,
        description: rawChatData.description || '',
        is_group: rawChatData.is_group || rawChatData.isGroup,
        photo: rawChatData.photo || rawChatData.groupPhoto,
        createdAt: rawChatData.createdAt,
        participants: rawChatData.members || [],
        managerIds: rawChatData.managerIds || rawChatData.manager || [],
        isMuted: rawChatData.isMuted || false,
        isBlocked: rawChatData.isBlocked || false,
      };

      setChat(processedChat);

      // Fetch detailed user info for all participants
      if (processedChat.participants && processedChat.participants.length > 0) {
        console.log("fetchChat: Fetching participant details...");
        const memberPromises = processedChat.participants.map(participantId => 
          fetchUser(participantId)
        );
        const membersData = await Promise.all(memberPromises);
        
        // Add admin status to members
        const membersWithAdminStatus = membersData.map(member => ({
          ...member,
          isAdmin: processedChat.managerIds.includes(member._id)
        }));
        
        setMembers(membersWithAdminStatus);
        console.log("fetchChat: Members data processed:", membersWithAdminStatus);
      }

      // Fetch media for this chat using your existing API
      await fetchChatMedia();

    } catch (e) {
      console.error("fetchChat: Error during fetchChat execution:", e);
      apiError(e, 'Could not fetch chat details');
    } finally {
      setLoading(false);
      console.log("fetchChat: Fetch process completed.");
    }
  }, [chatId, user?._id, user?.token, fetchUser, apiError, fetchChatMedia]);

  // Effect hook to trigger chat data fetching on component mount or dependency change
  useEffect(() => {
    // Only fetch if user is available
    if (user) {
      fetchChat();
    } else {
      // If user is null, redirect to login
      navigate('/login-signup');
    }
  }, [user, fetchChat, navigate]);

  /* ---------- Chat Mutations (API Interactions) ---------- */

  // Handles updating the chat's description
  const updateDescription = async () => {
    if (!user?.token) return;
    
    // Exit if description hasn't changed or is empty
    if (!newDescription.trim() || newDescription === chat.description) {
      setIsEditing(false);
      return;
    }
    try {
      // Adjusted to use the generic /update/:userId route for description update
      const r = await sendPut(
        `/chats/${chatId}/update/${user._id}`, // Matches router.route('/:chatId)/update/:userId')
        user.token,
        {},
        { description: newDescription } // Sending description in the request body
      );
      if (r.status >= 200 && r.status < 300) {
        setChat((c) => ({ ...c, description: newDescription })); // Update local state
        setIsEditing(false); // Exit editing mode
        flash('Description updated', 'success');
      } else {
        throw new Error('Failed to update description');
      }
    } catch (e) {
      apiError(e, 'Description update failed');
    }
  };

  // Handles toggling the chat's mute status
  const toggleMute = async () => {
    if (!user?.token) return;
    
    try {
      // Adjusted to use the generic /update/:userId route for mute status
      const r = await sendPut(
        `/chats/${chatId}/update/${user._id}`, // Matches router.route('/:chatId)/update/:userId')
        user.token,
        {},
        { isMuted: !chat.isMuted } // Sending new mute status in the request body
      );
      if (r.status === 200) {
        setChat((c) => ({ ...c, isMuted: !c.isMuted })); // Update local state
        flash(`Notifications ${!chat.isMuted ? 'muted' : 'unmuted'}`, 'success');
      } else {
        throw new Error('Failed to toggle mute');
      }
    } catch (e) {
      apiError(e, 'Mute toggle failed');
    }
  };

  // Handles toggling the block status for a direct chat user
  const toggleBlock = async () => {
    if (!user?.token || chat.is_group) return; // Only applicable for direct chats

    const other = members.find((m) => m._id !== user._id);
    if (!other) {
        flash("Could not find the other user to block/unblock.", "error");
        return;
    }
    try {
      // This is a user-specific route, assumed to exist outside chat routes
      const r = await sendPut(
        `/users/${other._id}/block/${user._id}`,
        user.token, {}, { blocked: !chat.isBlocked }
      );
      if (r.status === 200) {
        setChat((c) => ({ ...c, isBlocked: !c.isBlocked })); // Update local state
        flash(`User ${!chat.isBlocked ? 'blocked' : 'unblocked'}`, 'success');
      } else {
        throw new Error('Failed to toggle block');
      }
    } catch (e) {
      apiError(e, 'Block/unblock failed');
    }
  };

  // Handles the current user leaving a group chat
  const leaveGroup = async () => {
    if (!user?.token || !chat.is_group) return; // Only applicable for group chats
    if (!window.confirm('Are you sure you want to leave this group?')) return; // Confirmation dialog

    try {
      // Matches router.route('/:chatId)/leave/:userId').delete
      const r = await sendDelete(`/chats/${chatId}/leave/${user._id}`, user.token);
      if (r.status === 200 || r.status === 204) {
        flash('You have left the group.', 'success');
        navigate('/'); // Redirect to home/chat list after leaving
      } else {
        throw new Error('Failed to leave group');
      }
    } catch (e) {
      apiError(e, 'Leave group failed');
    }
  };

  // Handles deleting the entire chat
  const deleteChat = async () => {
    if (!user?.token) return;
    if (!window.confirm('Are you sure you want to delete this chat permanently? This action cannot be undone.')) return; // Confirmation dialog

    try {
      // Matches router.route('/:chatId)/delete/:userId').delete
      const r = await sendDelete(`/chats/${chatId}/delete/${user._id}`, user.token);
      if (r.status === 200 || r.status === 204) {
        flash('Chat deleted successfully.', 'success');
        navigate('/'); // Redirect to home/chat list after deletion
      } else {
        throw new Error('Failed to delete chat');
      }
    } catch (e) {
      apiError(e, 'Delete failed');
    }
  };

  /* ---------- Conditional Rendering (Early Exits for Loading/Errors) ---------- */

  // If user is not loaded yet, show loading
  if (!user) {
    return (
      <div className="chat-details-loading">
        <div className="loading-spinner" />
        <p>Loading user data…</p>
      </div>
    );
  }

  // Display a loading spinner while data is being fetched
  if (loading) {
    return (
      <div className="chat-details-loading">
        <div className="loading-spinner" />
        <p>Loading chat details…</p>
      </div>
    );
  }

  // Display an error message if the chat could not be found or fetched
  if (!chat) {
    return (
      <div className="chat-details-error">
        <p>Chat not found. It might have been deleted or never existed.</p>
        <button className="back-btn" onClick={() => navigate('/')}>Go Home</button>
      </div>
    );
  }

  /* ---------- Derived Properties (for rendering) ---------- */

  // Determine if the current chat is a group chat
  const isGroup = chat?.is_group;
  // Check if the current user is an administrator of the group
  const iAmAdmin = chat?.managerIds?.includes(user._id);

  // For direct chats, find the other participant
  const otherUser = !isGroup && members.find((m) => m._id !== user._id);

  // Determine the chat's display name
  const titleName = chat?.name || otherUser?.username || 'Unnamed Chat';

  // Determine the avatar source URL
  // Assumes 'chat.photo' for group chats, 'profileImage' for direct chat users
  const avatarSrc = isGroup ? chat?.photo : otherUser?.profileImage;

  /* ---------- Main Component Render ---------- */
  return (
    <div className="chat-details">
      {/* Header section with back button and title */}
      <div className="chat-details-header">
        <button className="back-button" onClick={() => navigate(-1)}>←</button>
        <h2>Chat Info</h2>
      </div>

      {/* Alert component for feedback messages */}
      {alert.msg && (
        <Alert
          message={alert.msg}
          type={alert.type}
          onClose={() => setAlert({ msg: '', type: 'success' })}
        />
      )}

      {/* Chat profile section: Avatar, Name, Description, Stats */}
      <div className="chat-profile">
        <AvatarCircle
          src={avatarSrc}
          alt={titleName} // Alt text for accessibility
          size="large"
          // You might add an 'initials' prop here if your AvatarCircle supports it
        />

        <div className="chat-info">
          <h2 className="chat-name">{titleName}</h2>

          {/* Group description section, editable by admins */}
          {isGroup && (
            <div className="chat-description">
              {isEditing ? (
                <div className="description-edit">
                  <textarea
                    className="description-textarea"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    rows={3}
                    maxLength={200}
                    placeholder="Enter group description..."
                  />
                  <div className="description-actions">
                    <button className="save-btn" onClick={updateDescription} disabled={loading}>Save</button>
                    <button
                      className="cancel-btn"
                      onClick={() => {
                        setIsEditing(false);
                        setNewDescription(chat.description || ''); // Revert to original description
                      }}
                      disabled={loading}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="description-display">
                  <p className="description-text">
                    {chat.description || 'No description provided.'}
                  </p>
                  {iAmAdmin && ( // Only show edit button if current user is an admin
                    <button
                      className="edit-description-btn"
                      onClick={() => setIsEditing(true)}
                    >
                      ✏️
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Chat statistics (members count, creation date) */}
          <div className="chat-stats">
            <span>{isGroup ? `${members.length} members` : 'Direct chat'}</span>
            {chat.createdAt && (
              <span>
                {' • Created '}
                {new Date(chat.createdAt).toLocaleDateString(undefined, {
                  year: 'numeric', month: 'short', day: 'numeric',
                })}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation for Media, Members, and Settings */}
      <div className="tab-navigation">
        {['media', 'members', 'settings'].map((tab) => (
          <button
            key={tab}
            className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab[0].toUpperCase() + tab.slice(1)} {/* Capitalize first letter */}
          </button>
        ))}
      </div>

      {/* Content displayed based on the active tab */}
      <div className="tab-content">
        {activeTab === 'media' && <MediaGallery media={media} loading={loading} />}

        {activeTab === 'members' && (
          <MembersList
            members={members} // Pass the full user objects
            currentUserId={user._id}
            chatId={chatId}
            isAdmin={iAmAdmin}
            isGroup={isGroup} // Pass isGroup prop to MembersList for conditional rendering
            onMembersChange={fetchChat} // Pass fetchChat to refresh list after changes (e.g., add/remove member)
          />
        )}

        {activeTab === 'settings' && (
          <div className="chat-settings">
            {/* Notifications settings */}
            <div className="settings-section">
              <h4>Notifications</h4>
              <div className="setting-item">
                <span>Mute notifications</span>
                <button
                  className={`toggle-btn ${chat.isMuted ? 'active-off' : 'active-on'}`}
                  onClick={toggleMute}
                  disabled={loading}
                >
                  {chat.isMuted ? 'Off' : 'On'}
                </button>
              </div>
            </div>

            {/* Direct chat specific actions */}
            {!isGroup && (
              <div className="settings-section">
                <h4>User actions</h4>
                <div className="setting-item">
                  <span>{chat.isBlocked ? 'Unblock user' : 'Block user'}</span>
                  <button
                    className={`toggle-btn ${chat.isBlocked ? 'active-off' : 'active-on'}`}
                    onClick={toggleBlock}
                    disabled={loading}
                  >
                    {chat.isBlocked ? 'Unblock' : 'Block'}
                  </button>
                </div>
              </div>
            )}

            {/* Group specific actions */}
            {isGroup && (
              <div className="settings-section">
                <h4>Group actions</h4>
                <div className="setting-item">
                  <span>Leave group</span>
                  <button className="danger-btn" onClick={leaveGroup} disabled={loading}>
                    Leave
                  </button>
                </div>
              </div>
            )}

            {/* Danger Zone: Actions with significant consequences */}
            <div className="danger-section">
              <h4>Danger zone</h4>
              <button className="danger-btn" onClick={deleteChat} disabled={loading}>
                Delete chat
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatDetails;