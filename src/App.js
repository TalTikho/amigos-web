import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { UserProvider } from './services/UserContext';
import RegisterContainer from './pages/RegisterContainer';
import ChatPage from './pages/ChatPage';
import UserSettings from './pages/UserSettings';

/**
 * App - The main application component
 * 
 * This component sets up routing and context providers for the application.
 * It defines all routes and their corresponding components.
 */
function App() {
    return (
        <UserProvider>
            <BrowserRouter>
                <Routes>
                    {/* Route for the login/signup page */}
                    <Route path="/login-signup" element={<RegisterContainer />} />
                    
                    {/* Route for the main chat page - will be shown after login */}
                    <Route path="/" element={<ChatPage />} />
                    
                    {/* You can add more routes here as needed */}
                    <Route path="/settings" element={<UserSettings />} />
                </Routes>
            </BrowserRouter>
        </UserProvider>
    );
}

export default App;