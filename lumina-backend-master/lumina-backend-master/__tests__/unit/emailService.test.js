const ORIGINAL_ENV = process.env;

describe('emailService configuration status', () => {
    beforeEach(() => {
        jest.resetModules();
        process.env = { ...ORIGINAL_ENV };
        delete process.env.SMTP_HOST;
        delete process.env.SMTP_PORT;
        delete process.env.SMTP_SECURE;
        delete process.env.SMTP_USER;
        delete process.env.SMTP_PASS;
        delete process.env.SMTP_FROM;
        delete process.env.GMAIL_USER;
        delete process.env.GMAIL_EMAIL;
        delete process.env.GMAIL_APP_PASSWORD;
        delete process.env.GMAIL_PASS;
        delete process.env.GMAIL_PASSWORD;
        delete process.env.GMAIL_FROM;
        delete process.env.APP_TIME_ZONE;
    });

    afterAll(() => {
        process.env = ORIGINAL_ENV;
    });

    it('reports missing SMTP settings', () => {
        const { getEmailConfigStatus } = require('../../src/services/emailService');

        const status = getEmailConfigStatus();

        expect(status.configured).toBe(false);
        expect(status.missing).toEqual(expect.arrayContaining([
            'SMTP_HOST',
            'SMTP_PORT',
            'SMTP_USER or GMAIL_USER',
            'SMTP_PASS or GMAIL_APP_PASSWORD'
        ]));
    });

    it('rejects example placeholder credentials', () => {
        process.env.SMTP_HOST = 'smtp.gmail.com';
        process.env.SMTP_PORT = '587';
        process.env.SMTP_USER = 'your-email@gmail.com';
        process.env.SMTP_PASS = 'your-app-password';

        const { getEmailConfigStatus } = require('../../src/services/emailService');

        const status = getEmailConfigStatus();

        expect(status.configured).toBe(false);
        expect(status.invalid).toEqual(expect.arrayContaining([
            'SMTP_USER/GMAIL_USER still contains the example placeholder',
            'SMTP_PASS/GMAIL_APP_PASSWORD still contains the example placeholder'
        ]));
    });

    it('accepts complete SMTP settings', () => {
        process.env.SMTP_HOST = 'smtp.gmail.com';
        process.env.SMTP_PORT = '587';
        process.env.SMTP_USER = 'sender@example.com';
        process.env.SMTP_PASS = 'real-app-password';
        process.env.SMTP_FROM = 'Lumina <sender@example.com>';

        const { getEmailConfigStatus } = require('../../src/services/emailService');

        const status = getEmailConfigStatus();

        expect(status).toMatchObject({
            configured: true,
            missing: [],
            invalid: [],
            host: 'smtp.gmail.com',
            port: '587',
            secure: false,
            fromConfigured: true
        });
    });

    it('accepts Gmail shorthand settings and strips app-password spaces', () => {
        process.env.GMAIL_USER = 'sender@gmail.com';
        process.env.GMAIL_APP_PASSWORD = 'abcd efgh ijkl mnop';

        const { getEmailConfigStatus, getTransportConfigForTest } = require('../../src/services/emailService');

        const status = getEmailConfigStatus();
        const transportConfig = getTransportConfigForTest();

        expect(status).toMatchObject({
            configured: true,
            missing: [],
            invalid: [],
            host: 'smtp.gmail.com',
            port: '587',
            secure: false,
            fromConfigured: false,
            gmailDefaultsApplied: true
        });
        expect(transportConfig).toMatchObject({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: 'sender@gmail.com',
                pass: 'abcdefghijklmnop'
            },
            from: 'sender@gmail.com'
        });
    });

    it('formats reminder time in the configured app timezone', () => {
        process.env.APP_TIME_ZONE = 'Asia/Kolkata';

        const { formatReminderDateForTest } = require('../../src/services/emailService');

        const formattedDate = formatReminderDateForTest(new Date('2026-05-02T09:30:00.000Z'));

        expect(formattedDate).toContain('3:00 PM');
        expect(formattedDate).toContain('Asia/Kolkata');
    });
});
