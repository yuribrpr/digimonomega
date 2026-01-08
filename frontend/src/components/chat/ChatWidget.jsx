import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { MessageCircle, Send, Users, User, Minimize2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';
import { useChat } from '../../context/ChatContext';

const SOCKET_URL = 'http://localhost:5000'; // Adjust if deployed

const getAvatarUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `http://localhost:5000${cleanPath}`;
};

export default function ChatWidget() {
    const { 
        isOpen, setIsOpen, 
        activeTab, setActiveTab, 
        activeDM,
        startDM 
    } = useChat();

    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [socket, setSocket] = useState(null);
    const [recentChats, setRecentChats] = useState([]);
    const [onlineUsers, setOnlineUsers] = useState(new Set()); 
    const [unreadLobby, setUnreadLobby] = useState(0);
    const unreadDM = recentChats.reduce((acc, chat) => acc + (chat.unread_count || 0), 0);
    const messagesEndRef = useRef(null);
    const navigate = useNavigate();
    
    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');

    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);

    // Fetch Messages Functions
    const fetchLobbyMessages = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/chat/lobby', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessages(res.data);
        } catch (err) {
            console.error('Error fetching lobby messages:', err);
        }
    };

    const fetchDMMessages = async (targetId) => {
        try {
            const res = await axios.get(`http://localhost:5000/api/chat/dm/${targetId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessages(res.data);
        } catch (err) {
            console.error('Error fetching DM messages:', err);
        }
    };

    const fetchRecentChats = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/chat/recent', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRecentChats(res.data);
        } catch (err) {
            console.error('Error fetching recent chats:', err);
        }
    };

    const markMessagesAsRead = async (targetId) => {
        setRecentChats(prev => prev.map(c => {
            if (c.id == targetId) {
                return { ...c, unread_count: 0 };
            }
            return c;
        }));
        
        try {
            await axios.post('http://localhost:5000/api/chat/read', { targetId }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchRecentChats();
        } catch (err) {
            console.error("Error marking messages as read:", err);
        }
    };

    // Initialize Socket
    useEffect(() => {
        if (!user || !token) return;

        const newSocket = io(SOCKET_URL);
        setSocket(newSocket);

        newSocket.on('connect', () => {
            newSocket.emit('join_user_room', user.id);
            if (activeTab === 'lobby') {
                newSocket.emit('join_lobby');
            }
        });

        // Initial fetch of recent chats to populate badges
        fetchRecentChats();

        newSocket.on('online_users_update', (users) => {
            setOnlineUsers(new Set(users));
        });

        return () => newSocket.close();
    }, [user?.id, token]);

    // Reset badges when opening tabs
    useEffect(() => {
        if (isOpen) {
            if (activeTab === 'lobby') {
                setUnreadLobby(0);
            }
        }
    }, [isOpen, activeTab]);

    // Handle Messages & Sound
    useEffect(() => {
        if (!socket) return;

        const playNotificationSound = () => {
             try {
                const ctx = new (window.AudioContext || window.webkitAudioContext)();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.frequency.value = 800; 
                gain.gain.value = 0.05; 
                osc.start();
                osc.stop(ctx.currentTime + 0.1);
            } catch (e) {
                console.error("Audio error", e);
            }
        };

        const handleReceiveMessage = (message) => {
            // Lobby Messages
             if (!message.receiverId) {
                if (activeTab === 'lobby') {
                     setMessages((prev) => [...prev, message]);
                }
                // Update unread lobby count if not in lobby
                if (!isOpen || activeTab !== 'lobby') {
                     setUnreadLobby(prev => prev + 1);
                     if (message.senderId !== user.id) playNotificationSound();
                } else if (message.senderId !== user.id) {
                     // In lobby, still play sound for others
                     playNotificationSound();
                }
            } 
            // DM Messages (Active Chat View Only)
            else if (activeTab === 'dm' && activeDM) {
                 const isRelated = 
                    (message.senderId === user.id && message.receiverId === activeDM.id) ||
                    (message.senderId === activeDM.id && message.receiverId === user.id);
                if (isRelated) {
                    setMessages((prev) => [...prev, message]);
                }
            }
        };

        const handlePrivateMessage = (message) => {
             const isMe = message.senderId === user.id;
             const partnerId = isMe ? message.receiverId : message.senderId;
             
             // Identify partner info from payload
             const partnerInfo = isMe 
                ? { id: message.receiverId, username: message.receiverName, avatar: message.receiverAvatar }
                : { id: message.senderId, username: message.senderName, avatar: message.senderAvatar };

             const isViewingChat = isOpen && activeTab === 'dm' && activeDM && activeDM.id === partnerId;

             if (!isViewingChat) {
                 if (!isMe) playNotificationSound();
             } else {
                 // If viewing chat, mark as read immediately (optional, or just don't count)
                 // But since backend counts, we might want to call markRead if we receive a message while open.
                 // For now, let's just rely on opening the chat triggering the read. 
                 // Actually if I'm looking at it, I should mark it read.
                 if (!isMe) markMessagesAsRead(partnerId);
             }

            // Always update recent chats for DMs
            setRecentChats(prev => {
                const existingIndex = prev.findIndex(c => c.id == partnerId);
                const existingChat = existingIndex > -1 ? prev[existingIndex] : null;
                
                // Calculate new unread count
                let newUnreadCount = existingChat ? (existingChat.unread_count || 0) : 0;
                if (!isViewingChat && !isMe) {
                    newUnreadCount += 1;
                } else if (isViewingChat) {
                    newUnreadCount = 0; // Ensure it stays 0 if viewing
                }

                if (existingIndex > -1) {
                    // Move to top
                    const updated = [...prev];
                    updated.splice(existingIndex, 1);
                    return [{ ...existingChat, unread_count: newUnreadCount }, ...updated];
                } else {
                    // Add new
                    return [{
                        id: partnerInfo.id,
                        username: partnerInfo.username,
                        avatar: partnerInfo.avatar,
                        unread_count: newUnreadCount
                    }, ...prev];
                }
            });
        };

        socket.off('receive_message');
        socket.off('private_message');
        
        socket.on('receive_message', handleReceiveMessage);
        socket.on('private_message', handlePrivateMessage);

        return () => {
            socket.off('receive_message');
            socket.off('private_message');
        };
    }, [socket, activeTab, activeDM, user?.id, isOpen]);

    // Handle Tab Changes and Room Joining
    useEffect(() => {
        if (!socket) return;

        if (activeTab === 'lobby') {
            socket.emit('join_lobby');
            fetchLobbyMessages();
        } else if (activeTab === 'dm' && activeDM) {
            socket.emit('join_dm', { userId: user.id, targetId: activeDM.id });
            fetchDMMessages(activeDM.id);
            markMessagesAsRead(activeDM.id);
        } else if (activeTab === 'contacts') {
            fetchRecentChats();
        }
    }, [activeTab, activeDM, socket]);

    // Search Users
    useEffect(() => {
        const searchUsers = async () => {
            if (!searchQuery.trim()) {
                setSearchResults([]);
                return;
            }
            try {
                const res = await axios.get(`http://localhost:5000/api/users/search?q=${searchQuery}`);
                setSearchResults(res.data);
            } catch (err) {
                console.error("Error searching users", err);
            }
        };
        const timeoutId = setTimeout(searchUsers, 500);
        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    // Auto Scroll
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen, activeTab]);


    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !socket) return;

        const messageData = {
            senderId: user.id,
            receiverId: activeTab === 'dm' ? activeDM.id : null,
            content: newMessage,
            senderName: user.username,
            senderAvatar: user.profile_image // Send profile_image instead of avatar
        };

        socket.emit('send_message', messageData);
        // Optimistic update not needed as we listen to receive_message event which broadcasts back
        // But for better UX we might want to append it immediately or wait for ack. 
        // For simplicity, we wait for the socket event.
        
        setNewMessage('');
    };

    const goToProfile = (userId) => {
        navigate(`/profile/${userId}`);
        // Optional: Close chat or keep it open? Let's keep it open.
    };

    if (!user) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end">
            {/* Chat Window */}
            {isOpen && (
                <Card className="w-80 h-96 mb-4 shadow-xl flex flex-col bg-card border-border">
                    <CardHeader className="p-3 border-b border-border flex flex-row justify-between items-center bg-muted/30 rounded-t-lg">
                        <div className="flex items-center gap-2">
                            {activeTab === 'dm' && (
                                <Button variant="ghost" size="sm" onClick={() => setActiveTab('contacts')} className="h-6 w-6 p-0 hover:bg-accent hover:text-accent-foreground">
                                    ←
                                </Button>
                            )}
                            <CardTitle className="text-sm font-bold text-foreground flex flex-col items-start leading-tight">
                                {activeTab === 'lobby' ? 'Saguão Principal' : 
                                 activeTab === 'dm' ? (
                                    <>
                                        <span>{activeDM?.username}</span>
                                        <span className={cn("text-[10px] font-normal", onlineUsers.has(activeDM?.id) ? "text-green-500" : "text-muted-foreground")}>
                                            {onlineUsers.has(activeDM?.id) ? "Online" : "Offline"}
                                        </span>
                                    </>
                                 ) : 'Conversas'}
                            </CardTitle>
                        </div>
                        <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => setActiveTab('lobby')} 
                                className={cn("h-6 w-6 p-0 hover:bg-accent hover:text-accent-foreground relative", activeTab === 'lobby' && "bg-accent text-accent-foreground")}>
                                <Users size={14} />
                                {unreadLobby > 0 && activeTab !== 'lobby' && (
                                    <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-red-500 border border-background" />
                                )}
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setActiveTab('contacts')}
                                className={cn("h-6 w-6 p-0 hover:bg-accent hover:text-accent-foreground relative", activeTab === 'contacts' && "bg-accent text-accent-foreground")}>
                                <User size={14} />
                                {unreadDM > 0 && activeTab !== 'contacts' && (
                                     <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-blue-500 border border-background" />
                                )}
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)} className="h-6 w-6 p-0 hover:bg-accent hover:text-accent-foreground">
                                <Minimize2 size={14} />
                            </Button>
                        </div>
                    </CardHeader>
                    
                    <CardContent className="flex-1 p-0 overflow-hidden flex flex-col bg-background">
                        {/* Messages Area */}
                        {(activeTab === 'lobby' || activeTab === 'dm') && (
                            <>
                                <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin">
                                    {messages.map((msg, index) => {
                                        const isMe = msg.sender_id === user.id || msg.senderId === user.id;
                                        return (
                                            <div key={index} className={cn("flex gap-2 items-start", isMe ? "flex-row-reverse" : "flex-row")}>
                                                <div 
                                                    className="w-6 h-6 rounded-full bg-muted flex-shrink-0 overflow-hidden cursor-pointer hover:opacity-80 border border-border"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        goToProfile(msg.sender_id || msg.senderId);
                                                    }}
                                                    title={msg.senderName}
                                                >
                                                    {msg.senderAvatar ? (
                                                        <img src={getAvatarUrl(msg.senderAvatar)} alt={msg.senderName} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground font-bold">
                                                            {(msg.senderName || '?')[0].toUpperCase()}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className={cn(
                                                    "max-w-[75%] p-2 rounded-lg text-xs break-words",
                                                    isMe ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                                                )}>
                                                    <span 
                                                        className="font-bold block mb-0.5 hover:underline cursor-pointer opacity-90"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            goToProfile(msg.sender_id || msg.senderId);
                                                        }}
                                                    >
                                                        {msg.senderName}
                                                        {msg.created_at && (
                                                            <span className="text-[10px] text-muted-foreground/70 ml-2 font-normal">
                                                                {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                            </span>
                                                        )}
                                                    </span>
                                                    {msg.content}
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div ref={messagesEndRef} />
                                </div>
                                
                                <form onSubmit={handleSendMessage} className="p-2 border-t border-border bg-card flex gap-2">
                                    <Input 
                                        value={newMessage} 
                                        onChange={(e) => setNewMessage(e.target.value)} 
                                        placeholder="Digite..." 
                                        className="h-8 text-sm bg-background border-input"
                                    />
                                    <Button type="submit" size="sm" className="h-8 w-8 p-0">
                                        <Send size={14} />
                                    </Button>
                                </form>
                            </>
                        )}

                        {/* Contacts / Recent Chats Area */}
                        {activeTab === 'contacts' && (
                            <div className="flex-1 overflow-y-auto p-2 bg-background">
                                <div className="mb-4">
                                    <Input 
                                        placeholder="Buscar usuário para conversar..." 
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="h-8 text-xs mb-2"
                                    />
                                </div>

                                {searchQuery ? (
                                    <>
                                        <div className="text-xs text-muted-foreground mb-2 font-semibold uppercase">Resultados da Busca</div>
                                        {searchResults.length === 0 ? (
                                            <p className="text-xs text-muted-foreground text-center py-2">Nenhum usuário encontrado.</p>
                                        ) : (
                                            searchResults.map((u) => (
                                                <div 
                                                    key={u.id}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        startDM({ id: u.id, username: u.username, avatar: u.profile_image });
                                                    }}
                                                    className="flex items-center gap-3 p-2 hover:bg-accent hover:text-accent-foreground rounded cursor-pointer transition-colors"
                                                >
                                                    <div className="w-8 h-8 rounded-full bg-muted overflow-hidden border border-border">
                                                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-muted-foreground">
                                                            {u.username[0].toUpperCase()}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-sm text-foreground">{u.username}</div>
                                                        <div className="text-xs text-muted-foreground">Nível {u.level}</div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <div className="text-xs text-muted-foreground mb-2 font-semibold uppercase">Todas as Conversas</div>
                                        {recentChats.length === 0 ? (
                                            <p className="text-xs text-muted-foreground text-center py-4">Nenhuma conversa encontrada.</p>
                                        ) : (
                                            recentChats.map((contact) => (
                                                <div 
                                                    key={contact.id}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        startDM(contact);
                                                    }}
                                                    className="flex items-center gap-3 p-2 hover:bg-accent hover:text-accent-foreground rounded cursor-pointer transition-colors relative"
                                                >
                                                    <div className="w-8 h-8 rounded-full bg-muted overflow-hidden border border-border relative">
                                                        {contact.avatar ? (
                                                            <img src={getAvatarUrl(contact.avatar)} alt={contact.username} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-xs font-bold text-muted-foreground">
                                                                {contact.username[0].toUpperCase()}
                                                            </div>
                                                        )}
                                                        {/* Online Indicator */}
                                                        {onlineUsers.has(contact.id) && (
                                                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-background rounded-full"></span>
                                                        )}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="font-bold text-sm text-foreground flex justify-between">
                                                            {contact.username}
                                                            {contact.unread_count > 0 && (
                                                                <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center">
                                                                    {contact.unread_count}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground truncate max-w-[150px]">
                                                            {onlineUsers.has(contact.id) ? "Online" : "Offline"}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </>
                                )}
                                
                                <div className="mt-4 pt-4 border-t border-border">
                                    <p className="text-xs text-muted-foreground text-center">
                                        Busque por um usuário acima para iniciar uma nova conversa.
                                    </p>
                                    <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => setActiveTab('lobby')}>
                                        Voltar ao Saguão
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Floating Toggle Button */}
            {!isOpen && (
                <Button 
                    onClick={() => setIsOpen(true)}
                    className="h-12 w-12 rounded-full shadow-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 relative"
                >
                    <MessageCircle className="h-6 w-6" />
                    {unreadLobby > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white border-2 border-background">
                            {unreadLobby > 99 ? '99+' : unreadLobby}
                        </span>
                    )}
                    {unreadDM > 0 && (
                         <span className={`absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white border-2 border-background ${unreadLobby > 0 ? '-left-1 right-auto' : ''}`}>
                            {unreadDM > 9 ? '!' : unreadDM}
                        </span>
                    )}
                </Button>
            )}
        </div>
    );
}
