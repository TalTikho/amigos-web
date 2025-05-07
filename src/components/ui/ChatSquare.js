import "../../style/ChatSquare.css";
import React from 'react';
import AvatarCircle from './AvatarCircle';

const ChatSquare = ({ chat = {} }) => {

    // TODO change the variable according to the mongo

    const { name, lastMessage, lastMessageTimestamp, avatarUrl } = chat;

    // TODO need to add the name of the user that sent the lase message only if this is a group!

    return (
        // return the chat box
        <div className="chat-square">
            { /* show the pic of the chat */ }
            <div className="avatar-wrapper">
                <AvatarCircle src={avatarUrl} radius="60px" />
            </div>

            { /* show the chat name, last msg time and the last msg */ }
            <div className="chat-square-content">
                <div className="chat-square-header">
                    <span className="chat-name">{name || "Unknown"}</span>
                    <span className="chat-timestamp">{lastMessageTimestamp || "--:--"}</span>
                </div>
                <p className="chat-preview">{lastMessage || "No messages yet"}</p>
            </div>
        </div>
    );
};

export default ChatSquare;
