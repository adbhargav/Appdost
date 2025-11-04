const Message = require('../models/Message');
const User = require('../models/User');
const Notification = require('../models/Notification');
const asyncHandler = require('express-async-handler');

// @desc    Send a new message
// @route   POST /api/messages
// @access  Private
const sendMessage = asyncHandler(async (req, res) => {
  const { recipientId, content } = req.body;

  // Validate recipient exists
  const recipient = await User.findById(recipientId);
  if (!recipient) {
    res.status(404);
    throw new Error('Recipient not found');
  }

  // Prevent sending message to self
  if (recipientId.toString() === req.user._id.toString()) {
    res.status(400);
    throw new Error('Cannot send message to yourself');
  }

  const message = new Message({
    sender: req.user._id,
    recipient: recipientId,
    content
  });

  const createdMessage = await message.save();
  
  // Create notification for recipient if they're not already in the conversation
  // or if it's been a while since last notification
  const recentNotification = await Notification.findOne({
    recipient: recipientId,
    sender: req.user._id,
    type: 'message',
    read: false
  }).sort({ createdAt: -1 });

  // Only create notification if there isn't a recent unread message notification
  if (!recentNotification) {
    const sender = await User.findById(req.user._id).select('name');
    await Notification.create({
      recipient: recipientId,
      sender: req.user._id,
      type: 'message',
      content: `New message from ${sender.name}: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`,
      relatedId: createdMessage._id,
      relatedModel: 'Message'
    });
  }
  
  // Populate sender and recipient details
  await createdMessage.populate([
    { path: 'sender', select: 'name email avatar' },
    { path: 'recipient', select: 'name email avatar' }
  ]);

  res.status(201).json(createdMessage);
});

// @desc    Get messages between two users
// @route   GET /api/messages/:userId
// @access  Private
const getMessagesBetweenUsers = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  
  // Validate user exists
  const user = await User.findById(userId);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Get messages between current user and specified user
  const messages = await Message.find({
    $or: [
      { sender: req.user._id, recipient: userId },
      { sender: userId, recipient: req.user._id }
    ]
  }).populate([
    { path: 'sender', select: 'name email avatar' },
    { path: 'recipient', select: 'name email avatar' }
  ]).sort({ createdAt: 1 });

  // Mark messages as read where current user is recipient
  await Message.updateMany(
    { recipient: req.user._id, sender: userId, read: false },
    { read: true }
  );

  res.json(messages);
});

// @desc    Get user's conversations (distinct users they've messaged or received messages from)
// @route   GET /api/messages/conversations
// @access  Private
const getUserConversations = asyncHandler(async (req, res) => {
  const messages = await Message.find({
    $or: [
      { sender: req.user._id },
      { recipient: req.user._id }
    ]
  }).populate([
    { path: 'sender', select: 'name email avatar' },
    { path: 'recipient', select: 'name email avatar' }
  ]);

  // Get unique users that the current user has messaged or received messages from
  const userIds = new Set();
  messages.forEach(msg => {
    if (msg.sender._id.toString() !== req.user._id.toString()) {
      userIds.add(msg.sender._id.toString());
    }
    if (msg.recipient._id.toString() !== req.user._id.toString()) {
      userIds.add(msg.recipient._id.toString());
    }
  });

  // Get user details for these conversations
  const users = await User.find({
    _id: { $in: Array.from(userIds) }
  }).select('name email avatar');

  res.json(users);
});

// @desc    Get unread message count
// @route   GET /api/messages/unread-count
// @access  Private
const getUnreadMessageCount = asyncHandler(async (req, res) => {
  const count = await Message.countDocuments({
    recipient: req.user._id,
    read: false
  });

  res.json({ count });
});

module.exports = {
  sendMessage,
  getMessagesBetweenUsers,
  getUserConversations,
  getUnreadMessageCount
};