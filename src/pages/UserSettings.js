import React, { useState } from 'react';
import AvatarCircle from '../components/ui/AvatarCircle';
import Alert from '../components/ui/Alert';
import { useUser } from '../services/UserContext';
import { ArrowLeft } from 'lucide-react';
import '../style/UserSettings.css';
import { useNavigate } from 'react-router-dom';
import ThemeSwitcher from "../components/ui/ThemeSwitcher";
import { sendPut } from "../services/RequestSender";
import UserSquare from '../components/ui/UserSquare';

const UserSettings = () => {
    const navigate = useNavigate();
    const { user, saveUser } = useUser();
    const [activeTab, setActiveTab] = useState('info');

    const [error, setError] = useState(null);
    const [showAlert, setShowAlert] = useState(false);
    const [alertType, setAlertType] = useState('');

    const [formData, setFormData] = useState({
        username: user.username,
        email: user.email,
        password: '',
        status: user.status,
        profile_pic: user.profile_pic,
    });

    const handleEdit = async () => {

        try {
            const newInfo = {
                username: formData.username.trim() !== '' ? formData.username : user.username,
                email: formData.email.trim() !== '' ? formData.email : user.email,
                password: formData.password.trim() !== '' ? formData.password : undefined, // optional: skip sending password if unchanged
                status: formData.status.trim() !== '' ? formData.status : user.status,
                profile_pic: formData.profile_pic || user.profile_pic,
            };

            const response = await sendPut(`/users/${user._id}/update`, user.token, {}, newInfo);

            if (response.status === 200) {
                setShowAlert(true);
                setError("Changes Saved.");
                setAlertType('success');
                saveUser({ ...user, ...newInfo }, user.token);
                setActiveTab('info');
            }
            else {
                setShowAlert(true);
                setError(response.data.error);
                setAlertType('error');
            }
        } catch(error) {
            setShowAlert(true);
            const errorMsg =
                error.response?.data?.error ||
                error.response?.data?.errors ||
                error.message ||
                "An unexpected error occurred.";

            setError(errorMsg);
            setAlertType('error');
        }
    }

    return (
        <div>
            <button className="back-button" onClick={() => navigate('/')}>
                <ArrowLeft size={20} />
            </button>

            <div className="theme-switcher-wrapper">
                <ThemeSwitcher />
            </div>

            {showAlert && error &&
                <Alert message={error} type={alertType} onClose={() => setShowAlert(false)} />
            }

            {/* Small Navbar */}
            <div className="settings-navbar">
                <button onClick={() => setActiveTab('info')} className={activeTab === 'info' ? 'active' : ''}>Info</button>
                <button onClick={() => setActiveTab('edit')} className={activeTab === 'edit' ? 'active' : ''}>Edit Info</button>
                <button onClick={() => setActiveTab('contacts')} className={activeTab === 'contacts' ? 'active' : ''}>Contacts</button>
            </div>

            <div className="settings-content">
                {activeTab === 'info' && (
                    <div className="user-details-container">
                        <AvatarCircle src={user.profile_pic} radius={250} />

                        <div className="user-info">
                            <div className="username">{user.username}</div>
                            <div><strong>Email:</strong> {user.email}</div>
                            <div><strong>Status:</strong> {user.status || 'No status set'}</div>
                            <div><strong>Password:</strong> ******</div>
                        </div>
                    </div>
                )}


                {activeTab === 'edit' && (
                    <div className="edit-form">
                        <div className="avatar-upload-section">
                            <p className="avatar-upload-label">Profile Picture</p>
                            <div onClick={() => document.getElementById('profilePicInput').click()}>
                                <AvatarCircle
                                    src={formData.profile_pic}
                                    radius="120px"
                                />
                            </div>
                            <input
                                id="profilePicInput"
                                type="file"
                                accept="image/*"
                                style={{ display: 'none' }}
                                onChange={(e) => {
                                    const file = e.target.files[0];
                                    if (file) {
                                        const imageURL = URL.createObjectURL(file);
                                        setFormData({ ...formData, profile_pic: imageURL });
                                    }
                                }}
                            />
                        </div>

                        <label>
                            Username:
                            <input
                                type="text"
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            />
                        </label>

                        <label>
                            Email:
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </label>

                        <label>
                            Password:
                            <input
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            />
                        </label>

                        <label>
                            Status:
                            <input
                                type="text"
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            />
                        </label>

                        <div className="edit-actions">
                            <button className="save-btn" onClick={handleEdit}>
                                Save
                            </button>

                            <button className="cancel-btn" onClick={() => setActiveTab('info')}>
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'contacts' && (
                    <UserSquare userId={user._id}/>
                )}
            </div>
        </div>
    );
};

export default UserSettings;
