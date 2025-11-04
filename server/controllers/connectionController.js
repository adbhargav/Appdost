const Connection = require('../models/Connection');
const User = require('../models/User');
const Notification = require('../models/Notification');
const asyncHandler = require('express-async-handler');

// @desc    Send connection request
// @route   POST /api/connections/request
// @access  Private
const sendConnectionRequest = asyncHandler(async (req, res) => {
  const { recipientId } = req.body;

  // Check if recipient exists
  const recipient = await User.findById(recipientId);
  if (!recipient) {
    res.status(404);
    throw new Error('User not found');
  }

  // Prevent sending request to self
  if (recipientId.toString() === req.user._id.toString()) {
    res.status(400);
    throw new Error('Cannot send connection request to yourself');
  }

  // Check if connection already exists
  const existingConnection = await Connection.findOne({
    $or: [
      { requester: req.user._id, recipient: recipientId },
      { requester: recipientId, recipient: req.user._id }
    ]
  });

  if (existingConnection) {
    res.status(400);
    throw new Error('Connection request already sent or connection already exists');
  }

  const connection = new Connection({
    requester: req.user._id,
    recipient: recipientId,
    status: 'pending'
  });

  const createdConnection = await connection.save();
  
  // Create notification for recipient
  const sender = await User.findById(req.user._id).select('name');
  await Notification.create({
    recipient: recipientId,
    sender: req.user._id,
    type: 'connection_request',
    content: `${sender.name} sent you a connection request`,
    relatedId: createdConnection._id,
    relatedModel: 'Connection'
  });
  
  // Populate requester and recipient details
  await createdConnection.populate([
    { path: 'requester', select: 'name email avatar' },
    { path: 'recipient', select: 'name email avatar' }
  ]);

  res.status(201).json(createdConnection);
});

// @desc    Get connection requests
// @route   GET /api/connections/requests
// @access  Private
const getConnectionRequests = asyncHandler(async (req, res) => {
  const connections = await Connection.find({ 
    recipient: req.user._id, 
    status: 'pending' 
  }).populate([
    { path: 'requester', select: 'name email avatar' },
    { path: 'recipient', select: 'name email avatar' }
  ]);

  res.json(connections);
});

// @desc    Accept connection request
// @route   PUT /api/connections/accept/:id
// @access  Private
const acceptConnectionRequest = asyncHandler(async (req, res) => {
  const connection = await Connection.findById(req.params.id);

  if (!connection) {
    res.status(404);
    throw new Error('Connection request not found');
  }

  // Check if current user is the recipient of the request
  if (connection.recipient.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error('Not authorized to accept this connection request');
  }

  // Update connection status
  connection.status = 'accepted';
  const updatedConnection = await connection.save();

  // Add each user to the other's connections array
  await User.findByIdAndUpdate(
    connection.requester,
    { $addToSet: { connections: connection.recipient } }
  );

  await User.findByIdAndUpdate(
    connection.recipient,
    { $addToSet: { connections: connection.requester } }
  );
  
  // Create notification for requester
  const recipient = await User.findById(req.user._id).select('name');
  await Notification.create({
    recipient: connection.requester,
    sender: req.user._id,
    type: 'connection_accepted',
    content: `${recipient.name} accepted your connection request`,
    relatedId: updatedConnection._id,
    relatedModel: 'Connection'
  });

  // Populate requester and recipient details
  await updatedConnection.populate([
    { path: 'requester', select: 'name email avatar' },
    { path: 'recipient', select: 'name email avatar' }
  ]);

  res.json(updatedConnection);
});

// @desc    Reject connection request
// @route   PUT /api/connections/reject/:id
// @access  Private
const rejectConnectionRequest = asyncHandler(async (req, res) => {
  const connection = await Connection.findById(req.params.id);

  if (!connection) {
    res.status(404);
    throw new Error('Connection request not found');
  }

  // Check if current user is the recipient of the request
  if (connection.recipient.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error('Not authorized to reject this connection request');
  }

  await connection.remove();
  res.json({ message: 'Connection request rejected' });
});

// @desc    Get all connections
// @route   GET /api/connections
// @access  Private
const getConnections = asyncHandler(async (req, res) => {
  const connections = await Connection.find({
    $or: [
      { requester: req.user._id },
      { recipient: req.user._id }
    ],
    status: 'accepted'
  }).populate([
    { path: 'requester', select: 'name email avatar' },
    { path: 'recipient', select: 'name email avatar' }
  ]);

  res.json(connections);
});

// @desc    Remove connection
// @route   DELETE /api/connections/:id
// @access  Private
const removeConnection = asyncHandler(async (req, res) => {
  const connection = await Connection.findById(req.params.id);

  if (!connection) {
    res.status(404);
    throw new Error('Connection not found');
  }

  // Check if current user is part of the connection
  if (
    connection.requester.toString() !== req.user._id.toString() &&
    connection.recipient.toString() !== req.user._id.toString()
  ) {
    res.status(401);
    throw new Error('Not authorized to remove this connection');
  }

  await connection.remove();

  // Remove each user from the other's connections array
  await User.findByIdAndUpdate(
    connection.requester,
    { $pull: { connections: connection.recipient } }
  );

  await User.findByIdAndUpdate(
    connection.recipient,
    { $pull: { connections: connection.requester } }
  );

  res.json({ message: 'Connection removed' });
});

module.exports = {
  sendConnectionRequest,
  getConnectionRequests,
  acceptConnectionRequest,
  rejectConnectionRequest,
  getConnections,
  removeConnection
};