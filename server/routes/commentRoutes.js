const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
  createComment,
  getCommentsByPost,
  deleteComment
} = require('../controllers/commentController');
const router = express.Router();

router.route('/')
  .post(protect, createComment);

router.route('/post/:postId')
  .get(protect, getCommentsByPost);

router.route('/:id')
  .delete(protect, deleteComment);

module.exports = router;