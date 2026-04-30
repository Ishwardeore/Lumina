const logger = require('../config/logger');

let nodemailer = null;

try {
    nodemailer = require('nodemailer');
} catch (error) {
    logger.warn('nodemailer is not installed. Email reminders will not be sent.');
}

const requiredEnv = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM'];

const isEmailConfigured = () => Boolean(nodemailer) && requiredEnv.every(key => Boolean(process.env[key]));

const createTransporter = () => nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

const formatDate = (date) => new Intl.DateTimeFormat('en-US', {
    dateStyle: 'full',
    timeStyle: 'short'
}).format(date);

const escapeHtml = (value) => String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const sendInterviewReminderEmail = async (reminder) => {
    if (!isEmailConfigured()) {
        throw new Error('Email is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and SMTP_FROM.');
    }

    const scheduledDate = formatDate(new Date(reminder.scheduledAt));
    const roundLabel = reminder.roundType.charAt(0).toUpperCase() + reminder.roundType.slice(1);
    const safeRoundLabel = escapeHtml(roundLabel);
    const safeCompany = escapeHtml(reminder.company);
    const safeRole = escapeHtml(reminder.role);
    const safeScheduledDate = escapeHtml(scheduledDate);
    const safeNotes = escapeHtml(reminder.notes);

    await createTransporter().sendMail({
        from: process.env.SMTP_FROM,
        to: reminder.recipientEmail,
        subject: `${roundLabel} interview reminder: ${reminder.company}`,
        text: [
            `Reminder: your ${roundLabel} round is scheduled.`,
            '',
            `Company: ${reminder.company}`,
            `Role: ${reminder.role}`,
            `Date: ${scheduledDate}`,
            reminder.notes ? `Notes: ${reminder.notes}` : null
        ].filter(Boolean).join('\n'),
        html: `
            <h2>${safeRoundLabel} interview reminder</h2>
            <p>Your scheduled round is coming up.</p>
            <ul>
                <li><strong>Company:</strong> ${safeCompany}</li>
                <li><strong>Role:</strong> ${safeRole}</li>
                <li><strong>Date:</strong> ${safeScheduledDate}</li>
                ${reminder.notes ? `<li><strong>Notes:</strong> ${safeNotes}</li>` : ''}
            </ul>
        `
    });
};

module.exports = {
    isEmailConfigured,
    sendInterviewReminderEmail
};
