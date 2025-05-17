import React, { useState } from 'react';
import { sendPost, sendGet } from '../services/RequestSender';
import Alert from '../components/ui/Alert';
import { useNavigate  } from 'react-router-dom';
import { useUser } from '../services/UserContext';
import { jwtDecode } from 'jwt-decode';
import "../style/Login.css";

const Login = () => {

    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showAlert, setShowAlert] = useState(false);
    const { saveUser } = useUser();
    const navigate = useNavigate();

    const handleLogin = async () => {

        try {
            setLoading(true); // set loading state to true when the request starts (put Login in...)

            // prepare the request body
            const body = identifier.includes('@')
                ? { email: identifier, password: password }
                : { username: identifier, password: password };

            // send post request and check if user exist
            const response = await sendPost('/tokens', '', {}, body, {});

            if (response.status === 200) {
                // extract the user data
                const token = response.data.token;
                const userId = jwtDecode(token).user_id;
                const userDetailsRes = await sendGet(`/users/${userId}`, token, {}, {});
                saveUser(userDetailsRes.data, token); // save the user

                // navigate to home page
                navigate('/');
            } else {
                // if the user not exist
                const errorMessage = response.data.error || 'Invalid credentials';
                setError(errorMessage);
                setShowAlert(true); // Trigger the alert to show the error message
            }
        } catch (err) {
            // if there was an error catch it and show the alert
            setError(err.response?.data?.error || 'An unexpected error occurred');
            setShowAlert(true);
        } finally {
            setLoading(false); // Stop loading
        }
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleLogin();
        }
    };

    return(
        <div className="login-container">
            <h2>Login</h2>
            <input
                type="text"
                placeholder="Username or Email"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                onKeyDown={handleKeyDown}
            />
            <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
            />
            <button className="login-button" onClick={handleLogin} disabled={loading}>
                {loading ? 'Logging in...' : 'Login'}
            </button>
            {showAlert && error && <Alert message={error} type="error" onClose={() => {setShowAlert(false)}}/>}
        </div>
    )
};

export default Login;
