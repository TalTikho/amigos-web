import React, { useEffect, useState } from 'react';

const Alert = ({ message, type, onClose }) => {
    const [visible, setVisible] = useState(true);
    const [fadeOut, setFadeOut] = useState(false); // New state for fade out

    useEffect(() => {
        // start the fade out after 3 seconds
        const timeout = setTimeout(() => {
            setFadeOut(true); // trigger fade out
            setTimeout(() => {
                setVisible(false); // after the time, set visible to false
                onClose(); // call onClose
            }, 1000); // Match this duration with the fade-out transition duration
        }, 3000);

        // clear timeout on component unmount or re-render
        return () => clearTimeout(timeout);
    }, [message, onClose]);

    // define the alert style
    const alertStyles = {
        success: { backgroundColor: '#13b407', color: 'black' },
        error: { backgroundColor: '#a20a0a', color: 'white' },
        warning: { backgroundColor: '#c7c709', color: 'black' },
        info: { backgroundColor: '#A9A9A9', color: 'black' },
    };

    const fadeStyle = {
        opacity: fadeOut ? 0 : 1, // change opacity based on fadeOut state
        transition: 'opacity 1s ease-out',
    };

    // set up the alert type style
    const alertType = alertStyles[type] || alertStyles.info;

    // apply styles with the fade transition
    const alertStyle = {
        ...alertType,
        padding: '10px 20px',
        borderRadius: '5px',
        position: 'fixed',
        bottom: '-100px',
        left: '50%',
        transform: 'translateX(-50%)',
        marginBottom: '10px',
        zIndex: 1000,
        ...fadeStyle,
    };

    // if visible = false
    if (!visible) {
        return null; // not show up the alert
    }

    // return the alert
    return (
        <div style={alertStyle}>
            <span>{message}</span>
        </div>
    );
};

export default Alert;