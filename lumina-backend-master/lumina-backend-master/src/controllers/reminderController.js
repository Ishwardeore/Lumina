const { InterviewReminder, User } = require('../models');
const { getEmailConfigStatus } = require('../services/emailService');

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

        const recipientEmail = (req.userData.email || user.email || '').trim();
        if (!recipientEmail) {
            return res.status(400).json({ message: 'Logged-in user email is required to create an email reminder' });
        }

        const reminder = await InterviewReminder.create({
            userId: user.id,
            jobId,
            company,
            role,
            roundType,
            scheduledAt: scheduledDate,
            notes,
            recipientEmail
        });

        const emailConfig = getEmailConfigStatus();

        res.status(201).json({
            reminder,
            emailConfigured: emailConfig.configured,
            missingEmailConfig: emailConfig.missing,
            invalidEmailConfig: emailConfig.invalid,
            message: emailConfig.configured
                ? 'Reminder scheduled successfully'
                : `Reminder saved, but email is not configured on the server yet. ${[
                    emailConfig.missing.length ? `Missing: ${emailConfig.missing.join(', ')}` : null,
                    emailConfig.invalid.length ? `Invalid: ${emailConfig.invalid.join('; ')}` : null
                ].filter(Boolean).join(' ')}`
        });
    } catch (error) {
        next(error);
    }
};

exports.getEmailStatus = async (req, res, next) => {
    try {
        const emailConfig = getEmailConfigStatus();

        res.json({
            emailConfigured: emailConfig.configured,
            missingEmailConfig: emailConfig.missing,
            invalidEmailConfig: emailConfig.invalid,
            smtp: {
                host: emailConfig.host,
                port: emailConfig.port,
                secure: emailConfig.secure,
                fromConfigured: emailConfig.fromConfigured,
                gmailDefaultsApplied: emailConfig.gmailDefaultsApplied
            }
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
