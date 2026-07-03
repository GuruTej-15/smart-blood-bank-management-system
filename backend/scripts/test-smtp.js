// Simple SMTP test script — loads backend/.env and tries to send a test email
require('dotenv').config({ path: __dirname + '/../.env' });
const { sendMail } = require('../utils/email');

const to = process.argv[2] || process.env.SMTP_USER || 'test@example.com';
(async () => {
  try {
    console.log('Using SMTP settings:', {
      SMTP_SERVICE: process.env.SMTP_SERVICE,
      SMTP_HOST: process.env.SMTP_HOST,
      SMTP_PORT: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined,
      SMTP_USER: process.env.SMTP_USER ? process.env.SMTP_USER.replace(/.(?=.{2}@)/g, '*') : undefined,
    });
    await sendMail({ to, subject: 'Smart Blood Bank — SMTP test', text: 'This is a test email from Smart Blood Bank.', html: '<p>This is a test email from <strong>Smart Blood Bank</strong>.</p>' });
    console.log('Test email sent successfully to', to);
  } catch (err) {
    console.error('Test email failed:', err && err.message ? err.message : err);
    if (err && err.response) console.error('Response:', err.response);
    process.exit(1);
  }
})();
