const { Op } = require('sequelize');
const logger = require('../config/logger');
const { InterviewReminder } = require('../models');
const { isEmailConfigured, sendInterviewReminderEmail } = require('./emailService');

let scheduler = null;
let isRunning = false;
let hasWarnedAboutEmailConfig = false;

const processDueReminders = async () => {
    if (isRunning) return;

    if (!isEmailConfigured()) {
        if (!hasWarnedAboutEmailConfig) {
            logger.warn('Interview reminder scheduler is paused because SMTP email is not configured.');
            hasWarnedAboutEmailConfig = true;
        }
        return;
    }

    hasWarnedAboutEmailConfig = false;
    isRunning = true;

    try {
        const reminders = await InterviewReminder.findAll({
            where: {
                status: 'pending',
                scheduledAt: {
                    [Op.lte]: new Date()
                }
            },
            limit: 25,
            order: [['scheduledAt', 'ASC']]
        });

        for (const reminder of reminders) {
            try {
                await sendInterviewReminderEmail(reminder);
                reminder.status = 'sent';
                reminder.sentAt = new Date();
                reminder.lastError = null;
                await reminder.save();
                logger.info('Interview reminder email sent', { reminderId: reminder.id });
            } catch (error) {
                reminder.status = 'failed';
                reminder.lastError = error.message;
                await reminder.save();
                logger.error('Failed to send interview reminder email', {
                    reminderId: reminder.id,
                    error: error.message
                });
            }
        }
    } catch (error) {
        logger.error('Interview reminder scheduler failed', { error: error.message });
    } finally {
        isRunning = false;
    }
};

const startReminderScheduler = () => {
    if (scheduler) return;

    processDueReminders();
    scheduler = setInterval(processDueReminders, 60 * 1000);
    logger.info('Interview reminder scheduler started');
};

module.exports = {
    startReminderScheduler,
    processDueReminders
};
