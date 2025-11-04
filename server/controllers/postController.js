const Post = require('../models/Post');
const User = require('../models/User');
const asyncHandler = require('express-async-handler');
const upload = require('../middleware/uploadMiddleware');

// @desc    Create a new post
// @route   POST /api/posts
// @access  Private
const createPost = asyncHandler(async (req, res) => {
  const { content } = req.body;
  let image = '';

  if (req.file) {
    image = req.file.path.replace(/\\/g, '/');
  }

  const post = new Post({
    content,
    image,
    author: req.user._id
  });

  const createdPost = await post.save();
  res.status(201).json(createdPost);
});

// @desc    Get all posts
// @route   GET /api/posts
// @access  Private
const getPosts = asyncHandler(async (req, res) => {
  const posts = await Post.find({})
    .populate('author', 'name avatar')
    .populate('likes', 'name')
    .sort({ createdAt: -1 });

  res.json(posts);
});

// @desc    Get post by ID
// @route   GET /api/posts/:id
// @access  Private
const getPostById = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id)
    .populate('author', 'name avatar')
    .populate('likes', 'name');

  if (post) {
    res.json(post);
  } else {
    res.status(404);
    throw new Error('Post not found');
  }
});

// @desc    Update post
// @route   PUT /api/posts/:id
// @access  Private
const updatePost = asyncHandler(async (req, res) => {
  const { content } = req.body;

  const post = await Post.findById(req.params.id);

  if (post) {
    if (post.author.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('User not authorized');
    }

    post.content = content || post.content;

    const updatedPost = await post.save();
    res.json(updatedPost);
  } else {
    res.status(404);
    throw new Error('Post not found');
  }
});

// @desc    Delete post
// @route   DELETE /api/posts/:id
// @access  Private
const deletePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);

  if (post) {
    if (post.author.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('User not authorized');
    }

    await post.remove();
    res.json({ message: 'Post removed' });
  } else {
    res.status(404);
    throw new Error('Post not found');
  }
});

// @desc    Like a post
// @route   PUT /api/posts/:id/like
// @access  Private
const likePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);

  if (post) {
    // Check if user already liked the post
    if (post.likes.includes(req.user._id)) {
      // Unlike the post
      post.likes = post.likes.filter(
        (like) => like.toString() !== req.user._id.toString()
      );
    } else {
      // Like the post
      post.likes.push(req.user._id);
    }

    const updatedPost = await post.save();
    res.json({
      _id: updatedPost._id,
      likes: updatedPost.likes
    });
  } else {
    res.status(404);
    throw new Error('Post not found');
  }
});

module.exports = {
  createPost,
  getPosts,
  getPostById,
  updatePost,
  deletePost,
  likePost
};