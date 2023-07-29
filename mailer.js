// Import necessary modules and libraries
require('dotenv').config(); // Load environment variables from .env file
var nodemailer = require('nodemailer'); // Library for sending emails
const axios = require('axios'); // Library for making HTTP requests

// Function to verify the reCAPTCHA token
const verifyRecaptcha = async (recaptchaToken) => {
  try {
    const secretKey = process.env.KEY; // Secret key for reCAPTCHA verification

    // Make a POST request to Google reCAPTCHA API for verification
    const response = await axios.post(
      `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${recaptchaToken}`
    );

    if (response.data.success) {
      return true; // reCAPTCHA verification successful
    } else {
      return false; // reCAPTCHA verification failed
    }
  } catch (error) {
    console.error('Failed to verify reCAPTCHA:', error);
    return false; // In case of any error, return false
  }
};

// Function to send an email using NodeMailer
const Mailer = async (to, subject, body, recaptchaToken) => {
  const mailPass = process.env.EMAIL_PASS2; // Password for the email account
  const mail = process.env.EMAIL; // Email address from which the email will be sent

  try {
    // Verify the reCAPTCHA token before proceeding with sending the email
    const isRecaptchaValid = await verifyRecaptcha(recaptchaToken);

    if (!isRecaptchaValid) {
      throw new Error('reCAPTCHA verification failed'); // Throw an error if reCAPTCHA verification fails
    }

    // Create a transporter for sending the email using Gmail service
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: mail, // Sender's email address
        pass: mailPass // Sender's email password
      }
    });

    // Define the email content and recipients
    const mailOptions = {
      from: 'Chirag Thathi', // Sender's name
      to: to, // Recipient's email address
      subject: subject, // Email subject
      text: body // Email body (text format)
    };

    // Return a promise to handle the email sending process
    return new Promise((resolve, reject) => {
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error(error);
          reject(new Error('Failed to send email')); // Reject the promise if there's an error
        } else {
          console.log('Email sent: ' + info.response); // Log the email sending status if successful
          resolve(true); // Resolve the promise with 'true' indicating success
        }
      });
    });
  } catch (error) {
    console.error(error);
    throw new Error('Failed to send email'); // Throw an error if any unexpected error occurs
  }
};

// Export the functions to make them accessible in other modules
module.exports = {
  verifyRecaptcha,
  Mailer
};
