require('dotenv').config();
const nodemailer = require('nodemailer');

const sendWelcomeEmail = async (toEmail) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    const msg = 'Skipping Welcome Email: EMAIL_USER or EMAIL_PASS not set in environment.';
    console.warn(msg);
    return { success: false, error: msg };
  }

  // Hardcode Gmail SMTP IPv4 address to bypass Render DNS/IPv6 routing issues
  const transporter = nodemailer.createTransport({
    host: '142.250.31.108', // smtp.gmail.com IPv4
    port: 465,
    secure: true, 
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    tls: { rejectUnauthorized: false } // Bypass certificate issue for IP-based host
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
    const msg = 'Skipping Login Email: EMAIL_USER or EMAIL_PASS not set in environment.';
    console.warn(msg);
    return { success: false, error: msg };
  }

  const transporter = nodemailer.createTransport({
    host: '142.250.31.108',
    port: 465,
    secure: true,
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    tls: { rejectUnauthorized: false }
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
    return { success: true };
  } catch (err) {
    console.error('Error sending login notification:', err);
    return { success: false, error: err.message };
  }
};

const sendDrawResultEmail = async (toEmail, matches, amount) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    const msg = 'Skipping Draw Result Email: EMAIL_USER or EMAIL_PASS not set in environment.';
    console.warn(msg);
    return { success: false, error: msg };
  }

  const transporter = nodemailer.createTransport({
    host: '142.250.31.108',
    port: 465,
    secure: true,
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    tls: { rejectUnauthorized: false }
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
    return { success: true };
  } catch (err) {
    console.error('Error sending draw email:', err);
    return { success: false, error: err.message };
  }
};

module.exports = {
  sendWelcomeEmail,
  sendDrawResultEmail,
  sendLoginEmail
};
