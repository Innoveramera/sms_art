require('dotenv').config();
const express = require('express');
const app = express();
const fs = require('fs');
const chrono = require('chrono-node');
const moment = require('moment-timezone');
const fetch = require('node-fetch');
require('dotenv').config();

const reminders = [];

// Middleware to parse JSON bodies
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

app.get('/message', (req, res) => {
    fs.readFile('message.txt', 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading file:', err);
            res.status(500).send('Error reading file');
            return;
        }
        res.send(data);
    });
});

// Define the route for your webhook
app.post('/webhook', (req, res) => {
    // Extract the object from the request's body
    const sms = req.body.message;
    const from = req.body.from;

    const timezone = 'Europe/Stockholm';
    console.log('Received SMS:', sms);

    try {
        // Parse the date/time from the message
        const parsedDate = chrono.parseDate(sms, new Date(), { forwardDate: true });
        if (!parsedDate) {
            return res.status(200).send('Could not understand the date/time in your message.');
        }

        // Adjust the parsed date to the correct timezone
        const adjustedDate = moment(parsedDate).tz(timezone);

        // Extract the remaining message content after the date/time
        const parsedDetails = chrono.parse(sms);
        const remainingMessage = sms.replace(parsedDetails[0].text, '').trim();

        if (!remainingMessage) {
            return res.status(200).send('Could not understand the reminder content.');
        }

        console.log(`Parsed Reminder:`);
        console.log(`- Time: ${adjustedDate.format('YYYY-MM-DD HH:mm:ss')} (${timezone})`);
        console.log(`- Message: ${remainingMessage}`);

        // Calculate the delay
        const delay = adjustedDate.toDate().getTime() - Date.now();
        if (delay <= 0) {
            return res.status(200).send('The specified time is in the past.');
        }

        // Schedule the reminder
        setTimeout(() => {
            sendSms({ to: from, message: remainingMessage });
        }, delay);

        res.status(200).send(`Reminder booked to ${nextDate}`);
    } catch (err) {
        console.error('Error parsing cron syntax:', err.message);
        res.status(200).send(`Error parsing cron syntax: ${err.message}`);
    }
});

// Method to send an SMS using the 46elks API
function sendSms({ to, message }) {
    const auth = Buffer.from(`${process.env.SMS_USERNAME}:${process.env.SMS_PASSWORD}`).toString('base64');
    const data = new URLSearchParams({ from: process.env.SMS_FROM, to, message });

    fetch("https://api.46elks.com/a1/sms", {
        method: "post",
        body: data.toString(),
        headers: { Authorization: `Basic ${auth}` }
    })
        .then(response => response.json())
        .then(json => console.log("SMS sent:", json))
        .catch(err => console.error("Error sending SMS:", err));
}

// Start the server
const PORT = process.env.PORT || 3334;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
