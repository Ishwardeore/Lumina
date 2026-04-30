const { InterviewReminder, User } = require('../models');
const { isEmailConfigured } = require('../services/emailService');

exports.createReminder = async (req, res, next) => {
    try {
        const { jobId, company, role, roundType, scheduledAt, notes } = req.body;

        if (!jobId || !company || !role || !roundType || !scheduledAt) {
            return res.status(400).json({ message: 'jobId, company, role, roundType, and scheduledAt are required' });
        }

        const scheduledDate = new Date(scheduledAt);
        if (Number.isNaN(scheduledDate.getTime())) {
            return res.status(400).json({ message: 'scheduledAt must be a valid date' });
        }

        const user = await User.findByPk(req.userData.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const reminder = await InterviewReminder.create({
            userId: user.id,
            jobId,
            company,
            role,
            roundType,
            scheduledAt: scheduledDate,
            notes,
            recipientEmail: user.email
        });

        res.status(201).json({
            reminder,
            emailConfigured: isEmailConfigured(),
            message: isEmailConfigured()
                ? 'Reminder scheduled successfully'
                : 'Reminder saved, but email is not configured on the server yet'
        });
    } catch (error) {
        next(error);
    }
};

exports.getReminders = async (req, res, next) => {
    try {
        const reminders = await InterviewReminder.findAll({
            where: { userId: req.userData.userId },
            order: [['scheduledAt', 'ASC']]
        });

        res.json(reminders);
    } catch (error) {
        next(error);
    }
};

exports.cancelReminder = async (req, res, next) => {
    try {
        const reminder = await InterviewReminder.findOne({
            where: {
                id: req.params.id,
                userId: req.userData.userId
            }
        });

        if (!reminder) {
            return res.status(404).json({ message: 'Reminder not found' });
        }

        reminder.status = 'cancelled';
        await reminder.save();

        res.json({ message: 'Reminder cancelled' });
    } catch (error) {
        next(error);
    }
};
