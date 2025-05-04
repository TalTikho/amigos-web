import React, { createContext, useState, useContext } from 'react';

// create the context
const UserContext = createContext();

// custom hook for accessing the context
export const useUser = () => useContext(UserContext);

// provider component
export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null); // `null` initially

    // Update user and token
    const saveUser = (userData, token) => {
        if (!userData) {
            // Clear user data and token on logout
            setUser(null);
            localStorage.removeItem('user');
        } else {
            const newUser = { ...userData, token: token };
            setUser(newUser);
            localStorage.setItem('user', JSON.stringify(newUser)); // Save to localStorage
        }
    };

    const logOut = () => { setUser(null); };

    // fetch user data from localStorage on reload
    React.useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem('user'));
        if (storedUser) setUser(storedUser);
    }, []);

    return (
        <UserContext.Provider value={{ user, saveUser, logOut }}>
            {children}
        </UserContext.Provider>
    );
};
