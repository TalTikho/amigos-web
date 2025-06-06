import React, { useState, useEffect } from 'react';
import AvatarCircle from "./AvatarCircle";
import { sendGet } from "../../services/RequestSender";
import '../../style/UserSquare.css';
import { Dialog } from '@headlessui/react';
import { useUser } from "../../services/UserContext";

const UserSquare = ({ userId }) => {
    const [showUser, setShowUser] = useState(null);
    const [isOpen, setIsOpen] = useState(false);
    const { user } = useUser();

    useEffect(() => {
        const fetchUser = async () => {
            try {
                // get the user from the server
                const response = await sendGet(`/users/${userId}`, user?.token);
                if (response.status === 200) {
                    setShowUser(response.data);
                }
            } catch (error) {
                console.error("Failed to fetch user:", error);
            }
        };

        if (userId && user?.token) {
            fetchUser();
        }
    }, [userId, user]);

    if (!showUser) return null;

    return (
        <>
            <div className="user-square" onClick={() => setIsOpen(true)}>
                <div className="user-square-content">
                    <AvatarCircle src={showUser.profile_pic} radius={40} />
                    <div className="user-square-name">{showUser.username}</div>
                </div>
            </div>

            <Dialog open={isOpen} onClose={() => setIsOpen(false)} className="user-dialog">
                <div className="dialog-backdrop" aria-hidden="true" />
                <div className="dialog-content">

                    {/* Arrow top-left */}
                    <div className="dialog-header">
                        <svg
                            className="back-arrow"
                            onClick={() => setIsOpen(false)}
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                    </div>

                    {/* Centered user info */}
                    <div className="dialog-user-info">
                        <AvatarCircle src={showUser.profile_pic} radius={80} />
                        <div className="dialog-user-text">
                            <h2>{showUser.username}</h2>
                            <p><strong>Email:</strong> {showUser.email}</p>
                            <p><strong>Status:</strong> {showUser.status || 'No status set'}</p>
                        </div>
                    </div>

                </div>
            </Dialog>
        </>
    );
};

export default UserSquare;
