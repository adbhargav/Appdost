const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
  sendConnectionRequest,
  acceptConnectionRequest,
  rejectConnectionRequest,
  getConnectionRequests,
  getConnections
} = require('../controllers/connectionController');
const router = express.Router();

router.route('/request')
  .post(protect, sendConnectionRequest);

router.route('/accept/:id')
  .put(protect, acceptConnectionRequest);

router.route('/reject/:id')
  .put(protect, rejectConnectionRequest);

router.route('/requests')
  .get(protect, getConnectionRequests);

router.route('/')
  .get(protect, getConnections);

module.exports = router;