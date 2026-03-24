require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendWelcomeEmail = async (toEmail) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return;
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: toEmail,
    subject: 'Welcome to Golf Charity Platform!',
    text: 'Thank you for joining our platform. Subscribe today to participate in our weekly draws and support your favorite charities!'
  };
  try {
    await transporter.sendMail(mailOptions);
    console.log('Welcome email sent to:', toEmail);
  } catch (err) {
    console.error('Error sending welcome email:', err);
  }
};

const sendLoginEmail = async (toEmail) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return;
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

module.exports = {
  sendWelcomeEmail,
  sendDrawResultEmail,
  sendLoginEmail
};
