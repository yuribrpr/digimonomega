import React, { createContext, useContext, useState } from 'react';

const ChatContext = createContext();

export const useChat = () => useContext(ChatContext);

export const ChatProvider = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('lobby'); // 'lobby' | 'dm' | 'contacts'
    const [activeDM, setActiveDM] = useState(null); // { id, username, avatar }

    const openChat = () => setIsOpen(true);
    const closeChat = () => setIsOpen(false);
    
    const startDM = (user) => {
        setActiveDM(user);
        setActiveTab('dm');
        setIsOpen(true);
    };

    return (
        <ChatContext.Provider value={{ 
            isOpen, setIsOpen, 
            activeTab, setActiveTab, 
            activeDM, setActiveDM,
            openChat, closeChat, startDM 
        }}>
            {children}
        </ChatContext.Provider>
    );
};
