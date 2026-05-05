const logger = require('../config/logger');

let nodemailer = null;

try {
    nodemailer = require('nodemailer');
} catch (error) {
    logger.warn('nodemailer is not installed. Email reminders will not be sent.');
}

const gmailHost = 'smtp.gmail.com';
const placeholderValues = new Set([
    'your-email@gmail.com',
    'your-app-password',
    'replace-with-your-email',
    'replace-with-your-app-password',
    'your-gmail-address@gmail.com',
    'your-16-character-app-password'
]);

const getEnvValue = (key) => (process.env[key] || '').trim();

const getFirstEnvValue = (...keys) => {
    for (const key of keys) {
        const value = getEnvValue(key);
        if (value) return value;
    }

    return '';
};

const isGmailHost = (host) => host.toLowerCase() === gmailHost;

const hasPlaceholderValue = (value) => {
    return placeholderValues.has(value.toLowerCase());
};

const resolveEmailConfig = () => {
    const user = getFirstEnvValue('SMTP_USER', 'GMAIL_USER', 'GMAIL_EMAIL');
    const rawPass = getFirstEnvValue('SMTP_PASS', 'GMAIL_APP_PASSWORD', 'GMAIL_PASS', 'GMAIL_PASSWORD');
    const host = getEnvValue('SMTP_HOST') || (user || rawPass ? gmailHost : '');
    const portValue = getEnvValue('SMTP_PORT') || (isGmailHost(host) ? '587' : '');
    const pass = isGmailHost(host) ? rawPass.replace(/\s+/g, '') : rawPass;
    const secure = getEnvValue('SMTP_SECURE')
        ? getEnvValue('SMTP_SECURE') === 'true'
        : portValue === '465';

    return {
        host,
        portValue,
        port: Number(portValue),
        secure,
        user,
        pass,
        from: getFirstEnvValue('SMTP_FROM', 'GMAIL_FROM') || user
    };
};

const getEmailConfigStatus = () => {
    const config = resolveEmailConfig();
    const missing = [];
    const invalid = [];

    if (!config.host) missing.push('SMTP_HOST');
    if (!config.portValue) missing.push('SMTP_PORT');
    if (!config.user) missing.push('SMTP_USER or GMAIL_USER');
    if (!config.pass) missing.push('SMTP_PASS or GMAIL_APP_PASSWORD');
    if (!nodemailer) missing.push('nodemailer');

    if (config.portValue && (!Number.isInteger(config.port) || config.port <= 0 || config.port > 65535)) {
        invalid.push('SMTP_PORT must be a number between 1 and 65535');
    }

    if (config.user && hasPlaceholderValue(config.user)) {
        invalid.push('SMTP_USER/GMAIL_USER still contains the example placeholder');
    }

    if (config.pass && hasPlaceholderValue(config.pass)) {
        invalid.push('SMTP_PASS/GMAIL_APP_PASSWORD still contains the example placeholder');
    }

    return {
        configured: missing.length === 0 && invalid.length === 0,
        missing,
        invalid,
        host: config.host || null,
        port: config.portValue || null,
        secure: config.secure,
        fromConfigured: Boolean(getFirstEnvValue('SMTP_FROM', 'GMAIL_FROM')),
        gmailDefaultsApplied: isGmailHost(config.host) && (!getEnvValue('SMTP_HOST') || !getEnvValue('SMTP_PORT'))
    };
};

const isEmailConfigured = () => getEmailConfigStatus().configured;

const createTransporter = () => {
    const config = resolveEmailConfig();

    return nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: {
            user: config.user,
            pass: config.pass
        }
    });
};

const getMailOptions = (reminder, scheduledDate, roundLabel, safeRoundLabel, safeCompany, safeRole, safeScheduledDate, safeNotes) => ({
    from: resolveEmailConfig().from,
    to: reminder.recipientEmail,
    subject: `Upcoming ${roundLabel} interview: ${reminder.company}`,
    text: [
        `Reminder: your ${roundLabel} round is coming up.`,
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

const getTransportConfigForTest = () => {
    const config = resolveEmailConfig();

    return {
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: {
            user: config.user,
            pass: config.pass
        },
        from: config.from
    };
};

const getConfigErrorMessage = () => {
    const status = getEmailConfigStatus();
    const details = [
        status.missing.length ? `Missing: ${status.missing.join(', ')}` : null,
        status.invalid.length ? `Invalid: ${status.invalid.join('; ')}` : null
    ].filter(Boolean).join('. ');

    return `Email is not configured. For Gmail, set GMAIL_USER and GMAIL_APP_PASSWORD, or set SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS. ${details}`.trim();
};

const getReminderTimeZone = () => getEnvValue('APP_TIME_ZONE') || 'Asia/Kolkata';

const formatDate = (date) => {
    const timeZone = getReminderTimeZone();
    const formattedDate = new Intl.DateTimeFormat('en-US', {
        dateStyle: 'full',
        timeStyle: 'short',
        timeZone
    }).format(date);

    return `${formattedDate} (${timeZone})`;
};

const escapeHtml = (value) => String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const sendInterviewReminderEmail = async (reminder) => {
    if (!isEmailConfigured()) {
        throw new Error(getConfigErrorMessage());
    }

    const scheduledDate = formatDate(new Date(reminder.scheduledAt));
    const roundLabel = reminder.roundType.charAt(0).toUpperCase() + reminder.roundType.slice(1);
    const safeRoundLabel = escapeHtml(roundLabel);
    const safeCompany = escapeHtml(reminder.company);
    const safeRole = escapeHtml(reminder.role);
    const safeScheduledDate = escapeHtml(scheduledDate);
    const safeNotes = escapeHtml(reminder.notes);

    await createTransporter().sendMail(
        getMailOptions(reminder, scheduledDate, roundLabel, safeRoundLabel, safeCompany, safeRole, safeScheduledDate, safeNotes)
    );
};

module.exports = {
    getEmailConfigStatus,
    isEmailConfigured,
    sendInterviewReminderEmail,
    getTransportConfigForTest,
    formatReminderDateForTest: formatDate
};
