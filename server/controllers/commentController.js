const Comment = require('../models/Comment');
const Post = require('../models/Post');
const asyncHandler = require('express-async-handler');

// @desc    Create a new comment
// @route   POST /api/comments
// @access  Private
const createComment = asyncHandler(async (req, res) => {
  const { post, text } = req.body;

  const comment = new Comment({
    post,
    text,
    author: req.user._id
  });

  const createdComment = await comment.save();
  
  // Add comment to post
  const postToUpdate = await Post.findById(post);
  if (postToUpdate) {
    postToUpdate.comments.push(createdComment._id);
    await postToUpdate.save();
  }

  res.status(201).json(createdComment);
});

// @desc    Get comments for a post
// @route   GET /api/comments/post/:postId
// @access  Private
const getCommentsByPost = asyncHandler(async (req, res) => {
  const comments = await Comment.find({ post: req.params.postId })
    .populate('author', 'name avatar')
    .sort({ createdAt: -1 });

  res.json(comments);
});

// @desc    Delete comment
// @route   DELETE /api/comments/:id
// @access  Private
const deleteComment = asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.id);

  if (comment) {
    if (comment.author.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('User not authorized');
    }

    // Remove comment from post
    const post = await Post.findById(comment.post);
    if (post) {
      post.comments = post.comments.filter(
        (commentId) => commentId.toString() !== req.params.id.toString()
      );
      await post.save();
    }

    await comment.remove();
    res.json({ message: 'Comment removed' });
  } else {
    res.status(404);
    throw new Error('Comment not found');
  }
});

module.exports = {
  createComment,
  getCommentsByPost,
  deleteComment
};