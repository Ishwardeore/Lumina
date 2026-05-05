const { Op } = require('sequelize');
const logger = require('../config/logger');
const { InterviewReminder } = require('../models');
const { getEmailConfigStatus, sendInterviewReminderEmail } = require('./emailService');

let scheduler = null;
let isRunning = false;
let hasWarnedAboutEmailConfig = false;
const reminderLeadTimeMs = 24 * 60 * 60 * 1000;

const processDueReminders = async () => {
    if (isRunning) return;

    const emailConfig = getEmailConfigStatus();
    if (!emailConfig.configured) {
        if (!hasWarnedAboutEmailConfig) {
            logger.warn('Interview reminder scheduler is paused because SMTP email is not configured.', {
                missing: emailConfig.missing,
                invalid: emailConfig.invalid
            });
            hasWarnedAboutEmailConfig = true;
        }
        return;
    }

    hasWarnedAboutEmailConfig = false;
    isRunning = true;

    try {
        // Keep scheduledAt as the user's actual round time.
        // Send when the current time has reached scheduledAt minus the 24-hour reminder lead time.
        const reminderWindowEnd = new Date(Date.now() + reminderLeadTimeMs);
        const reminders = await InterviewReminder.findAll({
            where: {
                status: 'pending',
                scheduledAt: {
                    [Op.lte]: reminderWindowEnd
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
