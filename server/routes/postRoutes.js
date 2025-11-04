const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const {
  createPost,
  getPosts,
  getPostById,
  updatePost,
  deletePost,
  likePost
} = require('../controllers/postController');
const router = express.Router();

router.route('/')
  .get(protect, getPosts)
  .post(protect, upload.single('image'), createPost);

router.route('/:id')
  .get(protect, getPostById)
  .put(protect, updatePost)
  .delete(protect, deletePost);

router.route('/:id/like')
  .put(protect, likePost);

module.exports = router;