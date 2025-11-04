import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';

const Network = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [userPosts, setUserPosts] = useState([]);

  useEffect(() => {
    if (user) {
      fetchUsers();
      fetchConnectionRequests();
    }
  }, [user]);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data.filter(u => u._id !== user?._id));
    } catch (err) {
      console.error('Error fetching users:', err);
      // Set users to empty array on error to prevent infinite loading
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchConnectionRequests = async () => {
    try {
      const res = await api.get('/connections/requests');
      setRequests(res.data);
    } catch (err) {
      console.error('Error fetching connection requests:', err);
      // Set requests to empty array on error
      setRequests([]);
    }
  };

  const fetchUserPosts = async (userId) => {
    try {
      const res = await api.get('/posts');
      const posts = res.data.filter(post => post.author?._id === userId);
      setUserPosts(posts);
    } catch (err) {
      console.error('Error fetching user posts:', err);
      setUserPosts([]);
    }
  };

  const sendConnectionRequest = async (recipientId) => {
    try {
      const res = await api.post('/connections/request', { recipientId });
      console.log('Connection request sent:', res.data);
      // Refresh users list
      fetchUsers();
    } catch (err) {
      console.error('Error sending connection request:', err);
      // Show user-friendly error message
      alert(err.response?.data?.message || 'Failed to send connection request');
    }
  };

  const acceptConnectionRequest = async (requestId) => {
    try {
      await api.put(`/connections/accept/${requestId}`);
      // Refresh requests and users
      fetchConnectionRequests();
      fetchUsers();
    } catch (err) {
      console.error('Error accepting connection request:', err);
      alert(err.response?.data?.message || 'Failed to accept connection request');
    }
  };

  const rejectConnectionRequest = async (requestId) => {
    try {
      await api.put(`/connections/reject/${requestId}`);
      // Refresh requests
      fetchConnectionRequests();
    } catch (err) {
      console.error('Error rejecting connection request:', err);
      alert(err.response?.data?.message || 'Failed to reject connection request');
    }
  };

  const viewUserProfile = async (user) => {
    setSelectedUser(user);
    await fetchUserPosts(user._id);
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 pt-16">
        <div className="max-w-6xl mx-auto py-6">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  // If user is not logged in, show login prompt
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 pt-16">
        <div className="max-w-6xl mx-auto py-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">My Network</h1>
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900">Please log in to view your network</h3>
              <p className="mt-1 text-gray-500">
                You need to be logged in to connect with others.
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
        <h1 className="text-2xl font-bold text-gray-900 mb-6">My Network</h1>
        
        {selectedUser ? (
          // User Profile View
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="h-48 bg-blue-600"></div>
            <div className="px-6 pb-6">
              <div className="flex flex-col md:flex-row items-start md:items-end -mt-16">
                {selectedUser.avatar ? (
                  <img 
                    src={`http://localhost:5000/${selectedUser.avatar}`} 
                    alt="Profile" 
                    className="rounded-xl w-32 h-32 object-cover"
                    onError={(e) => {
                      console.error('Avatar failed to load:', e.target.src);
                      // Try alternative URL construction
                      const avatarUrl = selectedUser.avatar.startsWith('http') ? selectedUser.avatar : `http://localhost:5000/${selectedUser.avatar.replace(/^\/+/, '')}`;
                      e.target.src = avatarUrl;
                      e.target.onerror = null; // Prevent infinite loop
                    }}
                  />
                ) : (
                  <div className="bg-gray-200 border-2 border-dashed rounded-xl w-32 h-32" />
                )}
                <div className="ml-0 md:ml-6 mt-4 md:mt-0">
                  <h1 className="text-2xl font-bold">{selectedUser.name}</h1>
                  <p className="text-gray-600">{selectedUser.email}</p>
                  <p className="text-gray-700 mt-2">Software Developer at Tech Corp</p>
                  <div className="mt-2 flex items-center">
                    <svg className="w-5 h-5 text-gray-500 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-600">San Francisco, CA</span>
                  </div>
                </div>
                <div className="ml-auto mt-4 md:mt-0">
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                    {user.connections && user.connections.includes(selectedUser._id) ? (
                      // Already connected - show message button
                      <>
                        <button
                          onClick={() => navigate(`/messages?user=${selectedUser._id}`)}
                          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path>
                          </svg>
                          Message
                        </button>
                        <button
                          onClick={() => setSelectedUser(null)}
                          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          Back
                        </button>
                      </>
                    ) : (
                      // Not connected - show connect button
                      <>
                        <button
                          onClick={() => sendConnectionRequest(selectedUser._id)}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path>
                          </svg>
                          Connect
                        </button>
                        <button
                          onClick={() => setSelectedUser(null)}
                          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          Back
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <h2 className="text-lg font-semibold text-gray-900">About</h2>
                <p className="mt-2 text-gray-700">
                  Passionate software developer with 5+ years of experience in building web applications. 
                  Specialized in React, Node.js, and MongoDB. Love to contribute to open source projects 
                  and mentor junior developers.
                </p>
              </div>
              
              <div className="mt-6">
                <h2 className="text-lg font-semibold text-gray-900">Activity</h2>
                {userPosts.length > 0 ? (
                  <div className="mt-4 space-y-4">
                    {userPosts.slice(0, 3).map((post) => (
                      <div key={post._id} className="border border-gray-200 rounded-lg p-4">
                        <p className="text-gray-700">{post.content}</p>
                        {post.image && (
                          <img 
                            src={`http://localhost:5000/${post.image}`} 
                            alt="Post" 
                            className="mt-3 rounded-lg max-h-60 w-full object-contain"
                            onError={(e) => {
                              console.error('Image failed to load:', e.target.src);
                              // Try alternative URL construction
                              const imageUrl = post.image.startsWith('http') ? post.image : `http://localhost:5000/${post.image.replace(/^\/+/, '')}`;
                              e.target.src = imageUrl;
                              e.target.onerror = null; // Prevent infinite loop
                            }}
                          />
                        )}
                        <div className="mt-2 flex items-center text-sm text-gray-500">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                          </svg>
                          <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 mt-2">No recent activity</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Connections Section */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Connections</h2>
                <a href="/network" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  See all ({user.connections?.length || 0})
                </a>
              </div>
              {user.connections && user.connections.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {user.connections.slice(0, 6).map((connectionId) => {
                    // Find the full user object for this connection
                    const connection = users.find(u => u._id === connectionId) || { _id: connectionId, name: 'Unknown User', email: '' };
                    return (
                      <div key={connection._id} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                        {connection.avatar ? (
                          <img 
                            src={`http://localhost:5000/${connection.avatar}`} 
                            alt={connection.name} 
                            className="rounded-xl w-12 h-12 object-cover"
                            onError={(e) => {
                              console.error('Avatar failed to load:', e.target.src);
                              // Try alternative URL construction
                              const avatarUrl = connection.avatar.startsWith('http') ? connection.avatar : `http://localhost:5000/${connection.avatar.replace(/^\/+/, '')}`;
                              e.target.src = avatarUrl;
                              e.target.onerror = null; // Prevent infinite loop
                            }}
                          />
                        ) : (
                          <div className="bg-gray-200 border-2 border-dashed rounded-xl w-12 h-12" />
                        )}
                        <div className="ml-3 flex-1">
                          <div className="font-semibold text-gray-900">{connection.name}</div>
                          <div className="text-sm text-gray-500">Connected</div>
                        </div>
                        <button
                          onClick={() => navigate(`/messages?user=${connection._id}`)}
                          className="ml-2 inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          Message
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-500">No connections yet</p>
              )}
            </div>
            
            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Search for people, jobs, and more..."
                />
              </div>
            </div>
            
            {requests.length > 0 && (
              <div className="bg-white shadow rounded-lg p-6 mb-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Connection Requests</h2>
                <div className="space-y-4">
                  {requests.map((request) => (
                    <div key={request._id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center mb-2 sm:mb-0">
                        {request.requester?.avatar ? (
                          <img 
                            src={`http://localhost:5000/${request.requester.avatar}`} 
                            alt={request.requester.name} 
                            className="rounded-xl w-12 h-12 object-cover"
                            onError={(e) => {
                              console.error('Avatar failed to load:', e.target.src);
                              // Try alternative URL construction
                              const avatarUrl = request.requester.avatar.startsWith('http') ? request.requester.avatar : `http://localhost:5000/${request.requester.avatar.replace(/^\/+/, '')}`;
                              e.target.src = avatarUrl;
                              e.target.onerror = null; // Prevent infinite loop
                            }}
                          />
                        ) : (
                          <div className="bg-gray-200 border-2 border-dashed rounded-xl w-12 h-12" />
                        )}
                        <div className="ml-3">
                          <div className="font-semibold">{request.requester?.name}</div>
                          <div className="text-sm text-gray-500">{request.requester?.email}</div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => acceptConnectionRequest(request._id)}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => rejectConnectionRequest(request._id)}
                          className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          Ignore
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Connect with others</h2>
              {filteredUsers.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredUsers.map((u) => (
                    <div key={u._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center">
                        {u.avatar ? (
                          <img 
                            src={`http://localhost:5000/${u.avatar}`} 
                            alt={u.name} 
                            className="rounded-xl w-12 h-12 object-cover"
                            onError={(e) => {
                              console.error('Avatar failed to load:', e.target.src);
                              // Try alternative URL construction
                              const avatarUrl = u.avatar.startsWith('http') ? u.avatar : `http://localhost:5000/${u.avatar.replace(/^\/+/, '')}`;
                              e.target.src = avatarUrl;
                              e.target.onerror = null; // Prevent infinite loop
                            }}
                          />
                        ) : (
                          <div className="bg-gray-200 border-2 border-dashed rounded-xl w-12 h-12" />
                        )}
                        <div className="ml-3 flex-1">
                          <div className="font-semibold">{u.name}</div>
                          <div className="text-sm text-gray-500">{u.email}</div>
                        </div>
                      </div>
                      <div className="mt-4 flex space-x-2">
                        {user.connections && user.connections.includes(u._id) ? (
                          // Already connected - show message button
                          <>
                            <button
                              onClick={() => navigate(`/messages?user=${u._id}`)}
                              className="flex-1 inline-flex items-center justify-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                              Message
                            </button>
                            <button
                              onClick={() => viewUserProfile(u)}
                              className="flex-1 inline-flex items-center justify-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                              View
                            </button>
                          </>
                        ) : (
                          // Not connected - check if request was sent
                          <>
                            <button
                              onClick={() => sendConnectionRequest(u._id)}
                              className="flex-1 inline-flex items-center justify-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                              Connect
                            </button>
                            <button
                              onClick={() => viewUserProfile(u)}
                              className="flex-1 inline-flex items-center justify-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                              View
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No users found</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Network;
