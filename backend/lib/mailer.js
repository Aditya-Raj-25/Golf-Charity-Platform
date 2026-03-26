require('dotenv').config();
const sgMail = require('@sendgrid/mail');

const getApiKey = () => process.env.SENDGRID_API_KEY || process.env.EMAIL_PASS; // Fallback if user put it in EMAIL_PASS
const getFromEmail = () => process.env.EMAIL_USER || 'adityaraj12jan23@gmail.com';

const sendWelcomeEmail = async (toEmail) => {
  const apiKey = getApiKey();
  if (!apiKey) {
    const msg = 'Skipping Welcome Email: SENDGRID_API_KEY not set in environment.';
    console.warn(msg);
    return { success: false, error: msg };
  }

  sgMail.setApiKey(apiKey);
  const msg = {
    to: toEmail,
    from: { name: 'Golf Charity Platform', email: getFromEmail() },
    subject: 'Welcome to Golf Charity Platform!',
    text: 'Thank you for joining our platform. Subscribe today to participate in our weekly draws and support your favorite charities!'
  };

  try {
    await sgMail.send(msg);
    console.log('Welcome email sent via SendGrid to:', toEmail);
    return { success: true };
  } catch (err) {
    console.error('Error sending welcome email via SendGrid:', err.response ? err.response.body : err);
    return { success: false, error: err.message };
  }
};

const sendLoginEmail = async (toEmail) => {
  const apiKey = getApiKey();
  if (!apiKey) {
    const msg = 'Skipping Login Email: SENDGRID_API_KEY not set in environment.';
    console.warn(msg);
    return { success: false, error: msg };
  }

  sgMail.setApiKey(apiKey);
  const msg = {
    to: toEmail,
    from: { name: 'Golf Charity Platform', email: getFromEmail() },
    subject: 'New Login to your Golf Charity Portal',
    text: `Hello, this is a notification that a login was recently performed on your account at ${new Date().toLocaleString()}. If this wasn't you, please secure your account.`
  };

  try {
    await sgMail.send(msg);
    console.log('Login notification sent via SendGrid to:', toEmail);
    return { success: true };
  } catch (err) {
    console.error('Error sending login notification via SendGrid:', err.response ? err.response.body : err);
    return { success: false, error: err.message };
  }
};

const sendDrawResultEmail = async (toEmail, matches, amount) => {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn('Skipping Draw Result Email: SENDGRID_API_KEY not set.');
    return;
  }

  sgMail.setApiKey(apiKey);
  const msg = {
    to: toEmail,
    from: { name: 'Golf Charity Platform', email: getFromEmail() },
    subject: 'Golf Charity Platform - Draw Results!',
    text: matches >= 3 
      ? `Congratulations! You matched ${matches} numbers and won $${amount}! Log in to your dashboard to claim your prize.`
      : `The recent draw has been completed. Unfortunately, you didn't match enough numbers this time. Better luck next time!`
  };

  try {
    await sgMail.send(msg);
    console.log('Draw result email sent via SendGrid to:', toEmail);
  } catch (err) {
    console.error('Error sending draw email via SendGrid:', err.response ? err.response.body : err);
  }
};

module.exports = {
  sendWelcomeEmail,
  sendDrawResultEmail,
  sendLoginEmail
};
