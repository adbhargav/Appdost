const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const {
  getUserProfile,
  updateUserProfile,
  uploadUserAvatar,
  getUsers,
  getUserById
} = require('../controllers/userController');
const router = express.Router();

router.route('/profile')
  .get(protect, getUserProfile)
  .put(protect, upload.single('avatar'), updateUserProfile);

router.route('/avatar')
  .post(protect, upload.single('avatar'), uploadUserAvatar);

router.route('/')
  .get(protect, getUsers);

router.route('/:id')
  .get(protect, getUserById);

module.exports = router;