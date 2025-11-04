import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await api.get('/posts');
      setPosts(res.data);
    } catch (err) {
      console.error('Error fetching posts:', err);
      // Set posts to empty array on error
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Redirect to login if user is not authenticated
    if (!user) {
      navigate('/login');
      return;
    }
    
    const formData = new FormData();
    formData.append('content', content);
    if (image) {
      formData.append('image', image);
    }
    
    try {
      const res = await api.post('/posts', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setPosts([res.data, ...posts]);
      setContent('');
      setImage(null);
      setImagePreview('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error('Error creating post:', err);
      alert(err.response?.data?.message || 'Failed to create post');
    }
  };

  const handleLike = async (postId) => {
    // Redirect to login if user is not authenticated
    if (!user) {
      navigate('/login');
      return;
    }
    
    try {
      const res = await api.put(`/posts/${postId}/like`);
      setPosts(posts.map(post => 
        post._id === postId ? { ...post, likes: res.data.likes } : post
      ));
    } catch (err) {
      console.error('Error liking post:', err);
      alert(err.response?.data?.message || 'Failed to like post');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 pt-16">
        <div className="max-w-2xl mx-auto py-6">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 pt-16">
      <div className="max-w-2xl mx-auto py-6">
        {user ? (
          <div className="bg-white shadow rounded-lg p-4 mb-6">
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="What do you want to talk about?"
                  required
                ></textarea>
              </div>
              {imagePreview && (
                <div className="mb-4">
                  <img src={imagePreview} alt="Preview" className="rounded-lg max-h-60 w-full object-contain" />
                </div>
              )}
              <div className="flex justify-between items-center">
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current.click()}
                    className="text-gray-500 hover:text-gray-700 flex items-center"
                  >
                    <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                    Photo
                  </button>
                </div>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Post
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Join your professional community</h2>
            <p className="text-gray-700 mb-4">Sign in to post updates, connect with professionals, and grow your network.</p>
            <button
              onClick={() => navigate('/login')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Sign in
            </button>
          </div>
        )}

        <div className="space-y-6">
          {posts.map((post) => (
            <div key={post._id} className="bg-white shadow rounded-lg p-4">
              <div className="flex items-center mb-4">
                {post.author?.avatar ? (
                  <img 
                    src={`http://localhost:5000/${post.author.avatar}`} 
                    alt={post.author.name} 
                    className="rounded-xl w-12 h-12 object-cover"
                    onError={(e) => {
                      console.error('Avatar failed to load:', e.target.src);
                      // Try alternative URL construction
                      const avatarUrl = post.author.avatar.startsWith('http') ? post.author.avatar : `http://localhost:5000/${post.author.avatar.replace(/^\/+/, '')}`;
                      e.target.src = avatarUrl;
                      e.target.onerror = null; // Prevent infinite loop
                    }}
                  />
                ) : (
                  <div className="bg-gray-200 border-2 border-dashed rounded-xl w-12 h-12" />
                )}
                <div className="ml-3">
                  <div className="font-semibold">{post.author?.name || 'Unknown'}</div>
                  <div className="text-sm text-gray-500">
                    {new Date(post.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className="mb-4">
                <p className="text-gray-700">{post.content}</p>
                {post.image && (
                  <img 
                    src={`http://localhost:5000/${post.image}`} 
                    alt="Post" 
                    className="mt-3 rounded-lg max-h-96 w-full object-contain"
                    onError={(e) => {
                      console.error('Image failed to load:', e.target.src);
                      // Try alternative URL construction
                      const imageUrl = post.image.startsWith('http') ? post.image : `http://localhost:5000/${post.image.replace(/^\/+/, '')}`;
                      e.target.src = imageUrl;
                      e.target.onerror = null; // Prevent infinite loop
                    }}
                  />
                )}
              </div>
              <div className="flex items-center">
                <button
                  onClick={() => handleLike(post._id)}
                  className={`flex items-center text-gray-500 hover:text-blue-600 ${
                    post.likes?.includes(user?._id) ? 'text-blue-600' : ''
                  }`}
                  disabled={!user}
                >
                  <svg
                    className="w-5 h-5 mr-1"
                    fill={post.likes?.includes(user?._id) ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                    ></path>
                  </svg>
                  <span>{post.likes?.length || 0}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;