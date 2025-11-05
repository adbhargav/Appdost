import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    bio: '',
    avatar: ''
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userPosts, setUserPosts] = useState([]);
  const [userConnections, setUserConnections] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        bio: user.bio || '',
        avatar: user.avatar || ''
      });
      // Don't add the prefix here since we'll add it in the image 
      setAvatarPreview(user.avatar || '');
    }
  }, [user]);

  const fetchUserPosts = async () => {
    try {
      const res = await api.get('/posts');
      const posts = res.data.filter(post => post.author?._id === user._id);
      setUserPosts(posts);
    } catch (err) {
      console.error('Error fetching user posts:', err);
      setUserPosts([]);
    }
  };

  const fetchUserConnections = async () => {
    try {
      const res = await api.get('/connections');
      setUserConnections(res.data);
    } catch (err) {
      console.error('Error fetching user connections:', err);
      setUserConnections([]);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Create FormData for file upload
    const formDataToSend = new FormData();
    formDataToSend.append('name', formData.name);
    formDataToSend.append('email', formData.email);
    formDataToSend.append('bio', formData.bio);
    
    // Only append file if a new one was selected
    if (avatarFile) {
      formDataToSend.append('avatar', avatarFile);
    }

    try {
      const res = await api.put('/users/profile', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Update user in context
      await updateUser({
        name: res.data.name,
        email: res.data.email,
        bio: res.data.bio,
        avatar: res.data.avatar
      });
      
      setIsEditing(false);
      setAvatarFile(null);
      fetchUserConnections(); // Refresh connections after update
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.response?.data?.message || 'Failed to update profile');
    }
    
    setLoading(false);
  };

  // Redirect to login if user is not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 pt-16">
        <div className="max-w-4xl mx-auto py-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Profile</h1>
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900">Please log in to view your profile</h3>
              <p className="mt-1 text-gray-500">
                You need to be logged in to access your profile.
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
      <div className="max-w-4xl mx-auto py-6">
        <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
          <div className="h-48 bg-blue-600"></div>
          <div className="px-6 pb-6">
            <div className="flex flex-col md:flex-row items-start md:items-end -mt-16">
              {avatarPreview || (user.avatar && !isEditing) ? (
                <img 
                  src={isEditing ? avatarPreview : `http://localhost:5000/${user.avatar}`} 
                  alt="Profile" 
                  className="rounded-xl w-32 h-32 object-cover"
                  onError={(e) => {
                    console.error('Avatar failed to load:', e.target.src);
                    // Try alternative URL construction
                    const avatarUrl = user.avatar.startsWith('http') ? user.avatar : `https://appdost-sipb.onrender.com/${user.avatar.replace(/^\/+/, '')}`;
                    e.target.src = avatarUrl;
                    e.target.onerror = null; // Prevent infinite loop
                  }}
                />
              ) : (
                <div className="bg-gray-200 border-2 border-dashed rounded-xl w-32 h-32" />
              )}
              <div className="ml-0 md:ml-6 mt-4 md:mt-0">
                <h1 className="text-2xl font-bold">{user.name}</h1>
                <p className="text-gray-600">{user.email}</p>
                <p className="text-gray-700 mt-2">{user.bio || 'No bio available.'}</p>
                <div className="mt-2 flex items-center">
                  <svg className="w-5 h-5 text-gray-500 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-600">Location not specified</span>
                </div>
                {!isEditing && (
                  <div className="mt-4">
                    <button
                      onClick={() => navigate('/messages')}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path>
                      </svg>
                      Message
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900">Connections</h3>
                <p className="text-3xl font-bold text-blue-600">{user.connections?.length || 0}</p>
                <p className="text-gray-600">Grow your network</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900">Posts</h3>
                <p className="text-3xl font-bold text-blue-600">{userPosts.length}</p>
                <p className="text-gray-600">See all your posts</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900">Profile Views</h3>
                <p className="text-3xl font-bold text-blue-600">0</p>
                <p className="text-gray-600">See who viewed your profile</p>
              </div>
            </div>
            
            {error && (
              <div className="mt-4 rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}
            
            {isEditing ? (
              <form onSubmit={handleSubmit} className="mt-6">
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                      Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      id="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      id="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                      Bio
                    </label>
                    <textarea
                      name="bio"
                      id="bio"
                      rows="3"
                      value={formData.bio}
                      onChange={handleChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    ></textarea>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Avatar
                    </label>
                    <div className="mt-1 flex items-center">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleAvatarChange}
                        accept="image/*"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current.click()}
                        className="bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Change
                      </button>
                      {avatarPreview && (
                        <span className="ml-3 text-sm text-gray-500">New image selected</span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setAvatarFile(null);
                      // Reset to the user's current avatar
                      setAvatarPreview(user.avatar || '');
                    }}
                    className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    {loading ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="mt-6">
                <div className="flex justify-end">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Edit Profile
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Recent Activity Section */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
          {userPosts.length > 0 ? (
            <div className="space-y-4">
              {userPosts.slice(0, 3).map((post) => (
                <div key={post._id} className="border border-gray-200 rounded-lg p-4">
                  <p className="text-gray-700">{post.content}</p>
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
            <p className="text-gray-500">No recent activity</p>
          )}
        </div>
        
        {/* Connections Section */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Connections</h2>
            <a href="/network" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              See all ({user.connections?.length || 0})
            </a>
          </div>
          {userConnections.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {userConnections.slice(0, 6).map((connection) => (
                <div key={connection._id} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                  {connection.avatar ? (
                    <img 
                      src={`http://localhost:5000/${connection.avatar}`} 
                      alt={connection.name} 
                      className="rounded-xl w-12 h-12 object-cover"
                      onError={(e) => {
                        console.error('Avatar failed to load:', e.target.src);
                        // Try alternative URL construction
                        const avatarUrl = connection.avatar.startsWith('http') ? connection.avatar : `https://appdost-sipb.onrender.com/${connection.avatar.replace(/^\/+/, '')}`;
                        e.target.src = avatarUrl;
                        e.target.onerror = null; // Prevent infinite loop
                      }}
                    />
                  ) : (
                    <div className="bg-gray-200 border-2 border-dashed rounded-xl w-12 h-12" />
                  )}
                  <div className="ml-3">
                    <div className="font-semibold text-gray-900">{connection.name}</div>
                    <div className="text-sm text-gray-500">Connected</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No connections yet</p>
          )}
        </div>
      </div>
    </div>
  );
};
export default Profile;
