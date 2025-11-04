import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api/axiosConfig';

const Messages = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (user) {
      fetchConversations().then(() => {
        // Check if there's a user parameter in the URL
        const params = new URLSearchParams(location.search);
        const userId = params.get('user');
        if (userId) {
          // Find the user in conversations and select them
          const conversation = conversations.find(conv => conv._id === userId);
          if (conversation) {
            handleSelectConversation(conversation);
          }
        }
      });
    }
  }, [user, location.search]);

  useEffect(() => {
    // Also check when conversations are loaded
    if (conversations.length > 0) {
      const params = new URLSearchParams(location.search);
      const userId = params.get('user');
      if (userId && !selectedConversation) {
        const conversation = conversations.find(conv => conv._id === userId);
        if (conversation) {
          handleSelectConversation(conversation);
        }
      }
    }
  }, [conversations, location.search, selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    try {
      const res = await api.get('/messages/conversations');
      setConversations(res.data);
      setLoading(false);
      return res.data;
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError('Failed to load conversations');
      setLoading(false);
    }
  };

  const fetchMessages = async (userId) => {
    try {
      const res = await api.get(`/messages/${userId}`);
      setMessages(res.data);
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError('Failed to load messages');
    }
  };

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
    fetchMessages(conversation._id);
    // Update URL to reflect the selected conversation
    navigate(`/messages?user=${conversation._id}`, { replace: true });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const res = await api.post('/messages', {
        recipientId: selectedConversation._id,
        content: newMessage
      });

      setMessages([...messages, res.data]);
      setNewMessage('');
      
      // Update conversations list to ensure the conversation is at the top
      fetchConversations();
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 pt-16">
        <div className="max-w-4xl mx-auto py-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Messages</h1>
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If user is not logged in, show login prompt
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 pt-16">
        <div className="max-w-4xl mx-auto py-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Messages</h1>
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900">Please log in to view your messages</h3>
              <p className="mt-1 text-gray-500">
                You need to be logged in to send and receive messages.
              </p>
              <div className="mt-6">
                <button
                  onClick={() => navigate('/login')}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Log in
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 pt-16">
      <div className="max-w-6xl mx-auto py-6">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="flex h-[calc(100vh-12rem)]">
            {/* Conversations sidebar */}
            <div className="w-1/3 border-r border-gray-200 flex flex-col">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
              </div>
              <div className="flex-1 overflow-y-auto">
                {conversations.length > 0 ? (
                  conversations.map((conversation) => (
                    <div
                      key={conversation._id}
                      className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 ${
                        selectedConversation?._id === conversation._id ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => handleSelectConversation(conversation)}
                    >
                      <div className="flex items-center">
                        {conversation.avatar ? (
                          <img
                            src={`http://localhost:5000/${conversation.avatar}`}
                            alt={conversation.name}
                            className="w-10 h-10 rounded-full object-cover"
                            onError={(e) => {
                              console.error('Avatar failed to load:', e.target.src);
                              const avatarUrl = conversation.avatar.startsWith('http') 
                                ? conversation.avatar 
                                : `http://localhost:5000/${conversation.avatar.replace(/^\/+/, '')}`;
                              e.target.src = avatarUrl;
                              e.target.onerror = null;
                            }}
                          />
                        ) : (
                          <div className="bg-gray-200 border-2 border-dashed rounded-xl w-10 h-10" />
                        )}
                        <div className="ml-3">
                          <div className="font-medium text-gray-900">{conversation.name}</div>
                          <div className="text-sm text-gray-500 truncate">{conversation.email}</div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    <p>No conversations yet.</p>
                    <p className="mt-2 text-sm">
                      Connect with people in your <a href="/network" className="text-blue-600 hover:underline">network</a> to start messaging.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Messages area */}
            <div className="flex-1 flex flex-col">
              {selectedConversation || location.search.includes('user=') ? (
                <>
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center">
                      {selectedConversation ? (
                        <>
                          {selectedConversation.avatar ? (
                            <img
                              src={`http://localhost:5000/${selectedConversation.avatar}`}
                              alt={selectedConversation.name}
                              className="w-10 h-10 rounded-full object-cover"
                              onError={(e) => {
                                console.error('Avatar failed to load:', e.target.src);
                                const avatarUrl = selectedConversation.avatar.startsWith('http') 
                                  ? selectedConversation.avatar 
                                  : `http://localhost:5000/${selectedConversation.avatar.replace(/^\/+/, '')}`;
                                e.target.src = avatarUrl;
                                e.target.onerror = null;
                              }}
                            />
                          ) : (
                            <div className="bg-gray-200 border-2 border-dashed rounded-xl w-10 h-10" />
                          )}
                          <div className="ml-3">
                            <div className="font-medium text-gray-900">{selectedConversation.name}</div>
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center">
                          <div className="bg-gray-200 border-2 border-dashed rounded-xl w-10 h-10" />
                          <div className="ml-3">
                            <div className="font-medium text-gray-900">Loading...</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                    {messages.length > 0 ? (
                      <div className="space-y-4">
                        {messages.map((message) => (
                          <div
                            key={message._id}
                            className={`flex ${
                              message.sender._id === user._id ? 'justify-end' : 'justify-start'
                            }`}
                          >
                            <div
                              className={`max-w-xs md:max-w-md px-4 py-2 rounded-lg ${
                                message.sender._id === user._id
                                  ? 'bg-blue-500 text-white'
                                  : 'bg-white border border-gray-200'
                              }`}
                            >
                              <div className="text-sm">{message.content}</div>
                              <div
                                className={`text-xs mt-1 ${
                                  message.sender._id === user._id ? 'text-blue-100' : 'text-gray-500'
                                }`}
                              >
                                {new Date(message.createdAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            </div>
                          </div>
                        ))}
                        <div ref={messagesEndRef} />
                      </div>
                    ) : (
                      <div className="flex justify-center items-center h-full">
                        <div className="text-center text-gray-500">
                          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                          </svg>
                          <p className="mt-2">No messages yet. Start a conversation!</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-4 border-t border-gray-200">
                    <form onSubmit={handleSendMessage} className="flex">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 border border-gray-300 rounded-l-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="bg-blue-600 text-white px-6 py-2 rounded-r-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                      >
                        Send
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    <h3 className="mt-2 text-lg font-medium text-gray-900">Select a conversation</h3>
                    <p className="mt-1 text-gray-500">
                      Choose a conversation from the list to start messaging.
                    </p>
                    <p className="mt-2 text-sm">
                      Don't see anyone? Connect with people in your <a href="/network" className="text-blue-600 hover:underline">network</a> to start messaging.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;