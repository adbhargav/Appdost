const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
  sendMessage,
  getMessagesBetweenUsers,
  getUserConversations,
  getUnreadMessageCount
} = require('../controllers/messageController');

const router = express.Router();

router.route('/')
  .post(protect, sendMessage);

router.route('/conversations')
  .get(protect, getUserConversations);

router.route('/unread-count')
  .get(protect, getUnreadMessageCount);

router.route('/:userId')
  .get(protect, getMessagesBetweenUsers);

module.exports = router;