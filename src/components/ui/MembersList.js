// Fixed version with proper search results display
import React, { useState, useRef, useEffect } from 'react';
import { useUser } from '../../services/UserContext';
import { sendPost, sendDelete, sendGet } from '../../services/RequestSender';
import AvatarCircle from './AvatarCircle';
import Alert from './Alert';
import '../../style/MembersList.css';

const MembersList = ({
  members = [],
  currentUserId,
  chatId,
  isAdmin,
  onMembersChange,
}) => {
  /* ---------- State ---------- */
  const [showAddMember, setShowAddMember] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAlert, setShowAlert] = useState(false);
  const [isSearching, setIsSearching] = useState(false); // Separate loading state for search
  const { user } = useUser();

  /* ---------- Refs ---------- */
  const debounceRef = useRef(null);

  /* ---------- Debug logging ---------- */
  useEffect(() => {
    console.log('MembersList Debug:', {
      searchQuery,
      searchResults: searchResults.length,
      searchResultsData: searchResults,
      loading,
      isSearching,
      showAddMember
    });
  }, [searchQuery, searchResults, loading, isSearching, showAddMember]);

  /* ---------- Helpers ---------- */
  const handleApiError = (err, msg) => {
    console.error(msg, err);
    const errorMsg = err.response?.data?.error || err.message || msg;
    setError(errorMsg);
    setShowAlert(true);
  };

  /* ---------- Enhanced Search (debounced) ---------- */
  const searchUsers = async (query) => {
    const trimmedQuery = query.trim();
    console.log('🔍 searchUsers called with:', { 
      original: query, 
      trimmed: trimmedQuery,
      length: trimmedQuery.length 
    });
    
    if (!trimmedQuery) {
      console.log('❌ Empty query, clearing results');
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    if (!user?._id || !user?.token) {
      console.error('❌ No user credentials available');
      return;
    }

    try {
      console.log('🚀 Starting search...');
      setIsSearching(true);
      setSearchResults([]);
      
      const possibleEndpoints = [
        `/users/${user._id}/search?q=${encodeURIComponent(trimmedQuery)}`,
        `/users/search?q=${encodeURIComponent(trimmedQuery)}`,
        `/search/users?q=${encodeURIComponent(trimmedQuery)}`,
        `/users/search/${encodeURIComponent(trimmedQuery)}`
      ];

      let searchSuccess = false;
      let lastError = null;

      for (const endpoint of possibleEndpoints) {
        try {
          console.log(`🌐 Trying endpoint: ${endpoint}`);
          
          const res = await sendGet(endpoint, user.token);
          console.log(`✅ Response from ${endpoint}:`, res);

          if (res && res.status === 200) {
            let userData = [];

            console.log('📊 Raw response data:', res.data);
            
            if (res.data) {
              if (Array.isArray(res.data)) {
                userData = res.data;
              } else if (res.data.data && Array.isArray(res.data.data)) {
                userData = res.data.data;
              } else if (res.data.users && Array.isArray(res.data.users)) {
                userData = res.data.users;
              } else if (res.data.results && Array.isArray(res.data.results)) {
                userData = res.data.results;
              } else if (res.data._id && res.data.username) {
                userData = [res.data];
              }
            }

            console.log('📦 Extracted user data:', userData);

            const validUsers = userData.filter(u => u && (u._id || u.id) && (u.username || u.name || u.email));
            console.log('✅ Valid users after filtering:', validUsers);

            const normalizedUsers = validUsers.map(u => ({
              _id: u._id || u.id,
              username: u.username || u.name || u.email || 'Unknown',
              email: u.email,
              profileImage: u.profileImage || u.profile_pic || u.avatar
            }));

            const existingIds = members.map(m => m._id);
            const filteredResults = normalizedUsers.filter(u => !existingIds.includes(u._id));

            console.log('🎯 Final filtered results:', {
              existingMemberIds: existingIds,
              filteredResults,
              count: filteredResults.length
            });
            
            setSearchResults(filteredResults);
            searchSuccess = true;
            break; 
          }
        } catch (endpointError) {
          console.log(`❌ Endpoint ${endpoint} failed:`, endpointError);
          lastError = endpointError;
          continue; 
        }
      }

      if (!searchSuccess) {
        throw lastError || new Error('All search endpoints failed');
      }

    } catch (err) {
      console.error('💥 Search error:', err);
      setSearchResults([]);

      if (err.response?.status >= 500) {
        handleApiError(err, 'Search service temporarily unavailable');
      } else if (err.response?.status === 404) {
        setError('Search feature is not available');
        setShowAlert(true);
      } else if (err.response?.status === 401) {
        setError('Authentication failed - please log in again');
        setShowAlert(true);
      }
    } finally {
      console.log('🏁 Search completed, setting isSearching to false');
      setIsSearching(false);
    }
  };

  const handleSearchChange = (e) => {
    const q = e.target.value;
    console.log('📝 Search query changed:', q);
    setSearchQuery(q);
    
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    if (!q.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    
    debounceRef.current = setTimeout(() => {
      console.log('⏰ Debounce triggered, calling searchUsers');
      searchUsers(q);
    }, 300);
  };

  /* ---------- Member mutations ---------- */
  const addMember = async (userId) => {
    try {
      setLoading(true);
      const res = await sendPost(
        `/chats/${chatId}/add-member/${userId}/${user._id}`,
        user.token,
        {},
        {}
      );
      if (res.status === 200) {
        setError('Member added successfully.');
        setShowAlert(true);
        setShowAddMember(false);
        setSearchQuery('');
        setSearchResults([]);
        onMembersChange?.();
        setTimeout(() => setShowAlert(false), 3000);
      }
    } catch (err) {
      handleApiError(err, 'Error adding member');
    } finally {
      setLoading(false);
    }
  };

  const removeMember = async (memberId) => {
    if (!window.confirm('Are you sure you want to remove this member?')) return;
    try {
      setLoading(true);
      const res = await sendDelete(
        `/chats/${chatId}/remove-member/${memberId}/${user._id}`,
        user.token
      );
      if (res.status === 200 || res.status === 204) {
        setError('Member removed successfully.');
        setShowAlert(true);
        onMembersChange?.();
        setTimeout(() => setShowAlert(false), 3000);
      }
    } catch (err) {
      handleApiError(err, 'Error removing member');
    } finally {
      setLoading(false);
    }
  };

  const toggleAdmin = async (memberId, makeAdmin) => {
    const confirmMsg = makeAdmin
      ? 'Make this member an admin?'
      : 'Remove admin privileges from this member?';
    if (!window.confirm(confirmMsg)) return;
    try {
      setLoading(true);
      let res;
      if (makeAdmin) {
        res = await sendPost(
          `/chats/${chatId}/add-manager/${memberId}/${user._id}`,
          user.token,
          {},
          {}
        );
      } else {
        res = await sendDelete(
          `/chats/${chatId}/remove-manager/${memberId}/${user._id}`,
          user.token
        );
      }
      if (res.status === 200 || res.status === 204) {
        setError(
          makeAdmin
            ? 'Member promoted to admin successfully.'
            : 'Admin privileges removed successfully.'
        );
        setShowAlert(true);
        onMembersChange?.();
        setTimeout(() => setShowAlert(false), 3000);
      }
    } catch (err) {
      handleApiError(err, `Error ${makeAdmin ? 'promoting' : 'demoting'} member`);
    } finally {
      setLoading(false);
    }
  };

  /* ---------- UI ---------- */
  const closeAddMember = () => {
    console.log('🚪 Closing add member modal');
    setShowAddMember(false);
    setSearchQuery('');
    setSearchResults([]);
    setIsSearching(false);
    setLoading(false);
    
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
  };

  /* ---------- Cleanup ---------- */
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);
  
  const renderSearchResults = () => {
    if (isSearching) {
      return (
        <div className="loading-message">
          <div className="loading-spinner"></div>
          <span>Searching for users...</span>
        </div>
      );
    }

    if (!searchQuery.trim()) {
      return (
        <div className="search-placeholder">
          <div className="search-placeholder-icon">👥</div>
          <p>Type to search for users to add to the group</p>
        </div>
      );
    }

    if (searchResults.length > 0) {
      return (
        <div className="results-container">
          <div className="results-header">
            <span className="results-count">
              {searchResults.length} user{searchResults.length !== 1 ? 's' : ''} found
            </span>
          </div>
          <div className="results-list">
            {searchResults.map((u, index) => (
              <div key={u._id || index} className="search-result-item">
                <div className="user-info">
                  <AvatarCircle 
                    src={u.profileImage} 
                    alt={u.username || 'User'} 
                    size="small" 
                  />
                  <div className="user-details">
                    <span className="username">{u.username}</span>
                    {u.email && <span className="email">{u.email}</span>}
                  </div>
                </div>
                <button
                  className="add-btn"
                  onClick={() => {
                    console.log('Adding member:', u);
                    addMember(u._id);
                  }}
                  disabled={loading}
                >
                  Add
                </button>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="no-results">
        <div className="no-results-icon">🔍</div>
        <div className="no-results-text">
          <p>No users found for "{searchQuery}"</p>
          <span>Try searching with a different username or email</span>
        </div>
      </div>
    );
  };

  return (
    <div className="members-list">
      {showAlert && (
        <Alert
          message={error}
          onClose={() => setShowAlert(false)}
          type={error?.includes('successfully') ? 'success' : 'error'}
        />
      )}

      <div className="members-header">
        <h3>Members ({members.length})</h3>
        {isAdmin && (
          <button
            className="add-member-btn"
            onClick={() => {
              console.log('Opening add member modal');
              setShowAddMember(true);
            }}
            disabled={loading}
          >
            Add Member
          </button>
        )}
      </div>

      {showAddMember && (
        <div className="add-member-modal" onClick={(e) => {
          if (e.target.classList.contains('add-member-modal')) {
            closeAddMember();
          }
        }}>
          <div className="modal-content">
            <div className="modal-header">
              <h4>Add New Member</h4>
              <button className="close-btn" onClick={closeAddMember}>
                ×
              </button>
            </div>

            <div className="search-section">
              <input
                type="text"
                placeholder="Search users by username or email..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="search-input"
                autoFocus
              />
            </div>
            
            {/* START: ---- MODIFIED SECTION ---- */}
            <div className="search-results">
              {renderSearchResults()}
            </div>
            {/* END: ---- MODIFIED SECTION ---- */}

          </div>
        </div>
      )}

      <div className="members-container">
        {members.map((m) => (
          <div key={m._id} className="member-item">
            <div className="member-info">
              <AvatarCircle src={m.profileImage} alt={m.username} size="medium" />
              <div className="member-details">
                <span className="member-name">{m.username}</span>
                <span className="member-email">{m.email}</span>
                <div className="member-role">
                  {m.isAdmin ? (
                    <span className="admin-badge">Admin</span>
                  ) : (
                    <span className="member-badge">Member</span>
                  )}
                  {m._id === currentUserId && <span className="you-badge">You</span>}
                </div>
              </div>
            </div>

            {isAdmin && m._id !== currentUserId && (
              <div className="member-actions">
                <button
                  className={`admin-toggle-btn ${m.isAdmin ? 'demote' : 'promote'}`}
                  onClick={() => toggleAdmin(m._id, !m.isAdmin)}
                  disabled={loading}
                  title={m.isAdmin ? 'Remove admin' : 'Make admin'}
                >
                  {m.isAdmin ? '👑' : '⬆️'}
                </button>
                <button
                  className="remove-btn"
                  onClick={() => removeMember(m._id)}
                  disabled={loading}
                  title="Remove member"
                >
                  🗑️
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {members.length === 0 && (
        <div className="no-members">
          <p>No members in this group yet.</p>
          {isAdmin && (
            <button
              className="add-first-member-btn"
              onClick={() => setShowAddMember(true)}
            >
              Add First Member
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default MembersList;