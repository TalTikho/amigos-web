import "../style/Signup.css";
import React, { useState } from 'react';
import AvatarCircle from '../components/ui/AvatarCircle';
import { sendPost } from '../services/RequestSender';
import Alert from "../components/ui/Alert";
import { useNavigate } from 'react-router-dom';

const Signup = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [verifyPassword, setVerifyPassword] = useState('');
    const [email, setEmail] = useState('');
    const [profilePicBase64, setProfilePicBase64] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showAlert, setShowAlert] = useState(false);
    const [alertType, setAlertType] = useState('');
    const navigate = useNavigate();

    // Convert image file to Base64 string
    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            setProfilePicBase64(reader.result); // Base64 string here
        };
        reader.readAsDataURL(file);
    };

    const handleSignup = async () => {
        try {
            setLoading(true);

            if (password !== verifyPassword) {
                setError('Password and verify password must be the same.');
                setShowAlert(true);
                return;
            }

            const body = {
                username,
                password,
                email,
                profile_pic: profilePicBase64,  // send Base64 string here
            };

            const response = await sendPost('/users', '', {}, body);

            if (response.status === 201) {
                setError('Created. please log in.');
                setShowAlert(true);
                setAlertType('success');
                navigate('/login-signup');
            } else {
                const errorMessage = response.data.errors || 'Invalid credentials';
                setError(Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage);
                setShowAlert(true);
                setAlertType('error');
            }
        } catch (err) {
            const errorMessage = err.response?.data?.errors || 'An unexpected error occurred';
            setError(Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage);
            setShowAlert(true);
            setAlertType('error');
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSignup();
        }
    };

    return (
        <div className="signup-container">
            <h2>Sign Up</h2>
            <input
                type="text"
                placeholder="Username"
                value={username}
                onKeyDown={handleKeyDown}
                onChange={(e) => setUsername(e.target.value)} />
            <input
                type="email"
                placeholder="Email"
                value={email}
                onKeyDown={handleKeyDown}
                onChange={(e) => setEmail(e.target.value)} />
            <input
                type="password"
                placeholder="Password"
                value={password}
                onKeyDown={handleKeyDown}
                onChange={(e) => setPassword(e.target.value)} />
            <input
                type="password"
                placeholder="Verify Password"
                value={verifyPassword}
                onKeyDown={handleKeyDown}
                onChange={(e) => setVerifyPassword(e.target.value)} />

            {/* Image upload input */}
            {!profilePicBase64 && <input
                id="profile-pic-upload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
            />}

            {profilePicBase64 && (
                <div className="avatar-wrapper">
                    <AvatarCircle src={profilePicBase64}/>
                </div>
            )}

            <button
                className="signup-button"
                onClick={handleSignup}
                disabled={loading}>
                {loading ? 'Creating Account...' : 'Sign Up'}
            </button>

            {showAlert && error && <Alert message={error} type={alertType} onClose={() => setShowAlert(false)} />}
        </div>
    );
};

export default Signup;
