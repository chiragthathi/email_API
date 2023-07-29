const express = require("express");
const app = express();
const port = 5000;
require('dotenv').config();

// Required packages
const cors = require('cors'); // Cross-Origin Resource Sharing middleware
const bodyparser = require('body-parser'); // Middleware to parse the request body
const { body, validationResult } = require('express-validator'); // Middleware for form input validation

// Custom mailer module
const { verifyRecaptcha, Mailer } = require('./mailer');

app.use(bodyparser.json()); // Add support for parsing JSON-encoded request bodies
app.use(bodyparser.urlencoded({ extended: true })); // Add support for parsing URL-encoded request bodies
app.use(cors()); // Enable Cross-Origin Resource Sharing for the server

// Endpoint for handling email submissions
app.post('/email', [
    // Input validation using express-validator
    body('InputName')
        .notEmpty().withMessage('Name is required')
        .isLength({ min: 4 }).withMessage('Name should contain at least 4 characters'),
    body('InputEmail').isEmail().withMessage('Enter a valid email address'),
    body('InputSubject')
        .notEmpty().withMessage('Subject is required')
        .isLength({ min: 8 }).withMessage('Subject should contain at least 8 characters'),
    body('InputMessage')
        .notEmpty().withMessage('Message is required')
        .isLength({ min: 10 }).withMessage('Message should contain at least 10 characters'),
    body('recaptchaToken').notEmpty().withMessage('reCAPTCHA token is required')
], async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    // Extract form data
    const { InputName, InputEmail, InputSubject, InputMessage, recaptchaToken } = req.body;

    try {
        // Verify the reCAPTCHA token
        const isRecaptchaValid = await verifyRecaptcha(recaptchaToken);

        if (!isRecaptchaValid) {
            return res.status(400).json({ message: 'reCAPTCHA verification failed' });
        }

        // Send the email to the recipient
        await Mailer(process.env.EMAIL, "New Query", `name : ${InputName}\nEmail : ${InputEmail}\nSubject : ${InputSubject}\nMessage : ${InputMessage}`, recaptchaToken);
        
        // Send confirmation email to the sender
        console.log(InputEmail)
        const confirmationResult = await Mailer(InputEmail, "Email Received - Thank You", `Hi ${InputName}\n\nThank you for contacting us. We appreciate your message and will be in touch soon.\n\nThanks and Regards\nChirag Thathi`, recaptchaToken);

        if (confirmationResult) {
            return res.status(200).json({ message: "Submitted" });
        } else {
            return res.status(500).json({ message: "Failed to submit" });
        }
    } catch (error) {
        console.error('An error occurred:', error);
        return res.status(500).json({ message: "An error occurred" });
    }
});

// Redirect to a website
app.get('/', (req, res) => {
    res.redirect('http://thathichirag.xyz');
});

// Start the server on the specified port or environment variable
app.listen(process.env.PORT || port, () => {
    console.log(`Server started on port ${port}`);
});
