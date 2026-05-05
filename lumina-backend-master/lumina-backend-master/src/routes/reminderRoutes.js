const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const reminderController = require('../controllers/reminderController');

router.use(auth);

router.get('/email-status', reminderController.getEmailStatus);
router.post('/', reminderController.createReminder);
router.get('/', reminderController.getReminders);
router.delete('/:id', reminderController.cancelReminder);

module.exports = router;
