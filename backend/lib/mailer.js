require('dotenv').config();
const nodemailer = require('nodemailer');

const sendWelcomeEmail = async (toEmail) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    const msg = 'Skipping Welcome Email: EMAIL_USER or EMAIL_PASS not set in environment.';
    console.warn(msg);
    return { success: false, error: msg };
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: toEmail,
    subject: 'Welcome to Golf Charity Platform!',
    text: 'Thank you for joining our platform. Subscribe today to participate in our weekly draws and support your favorite charities!'
  };
  try {
    await transporter.sendMail(mailOptions);
    console.log('Welcome email sent to:', toEmail);
    return { success: true };
  } catch (err) {
    console.error('Error sending welcome email:', err);
    return { success: false, error: err.message };
  }
};

const sendLoginEmail = async (toEmail) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('Skipping Login Email: EMAIL_USER or EMAIL_PASS not set in environment.');
    return;
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: toEmail,
    subject: 'New Login to your Golf Charity Portal',
    text: `Hello, this is a notification that a login was recently performed on your account at ${new Date().toLocaleString()}. If this wasn't you, please secure your account.`
  };
  try {
    await transporter.sendMail(mailOptions);
    console.log('Login notification sent to:', toEmail);
  } catch (err) {
    console.error('Error sending login notification:', err);
  }
};

const sendDrawResultEmail = async (toEmail, matches, amount) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('Skipping Draw Result Email: EMAIL_USER or EMAIL_PASS not set in environment.');
    return;
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: toEmail,
    subject: 'Golf Charity Platform - Draw Results!',
    text: matches >= 3 
      ? `Congratulations! You matched ${matches} numbers and won $${amount}! Log in to your dashboard to claim your prize.`
      : `The recent draw has been completed. Unfortunately, you didn't match enough numbers this time. Better luck next time!`
  };
  try {
    await transporter.sendMail(mailOptions);
    console.log('Draw result email sent to:', toEmail);
  } catch (err) {
    console.error('Error sending draw email:', err);
  }
};

module.exports = {
  sendWelcomeEmail,
  sendDrawResultEmail,
  sendLoginEmail
};
