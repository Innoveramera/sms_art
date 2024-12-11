require('dotenv').config();
const express = require('express');
const app = express();
const fs = require('fs');
const cron = require('node-cron');
const cronParser = require('cron-parser');
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

    console.log('Received SMS:', sms);

    const parts = sms.split('|');
    if (parts.length !== 2) {
        return res.status(400).send('Invalid format. Use "<CRON SYNTAX> | <MESSAGE>".');
    }

    const cronSyntax = parts[0].trim();
    const message = parts[1].trim();


    console.log('Received SMS:', sms);
    console.log('Parsed cron syntax:', cronSyntax);
    console.log('Parsed message:', message);

    try {
        const interval = cronParser.parseExpression(cronSyntax);
        const nextDate = interval.next().toDate(); // Get the next execution date as a Date object

        console.log(`Reminder scheduled for: ${nextDate}`);

        // Calculate the delay in milliseconds
        const delay = nextDate.getTime() - Date.now();

        if (delay <= 0) {
            return res.status(200).send('Invalid cron syntax or time in the past.');
        }

        // Schedule a one-time reminder
        setTimeout(() => {
            const auth = Buffer.from(`${process.env.SMS_USERNAME}:${process.env.SMS_PASSWORD}`).toString('base64');
            const data = new URLSearchParams({ from: process.env.SMS_FROM, to: from, message });

            fetch("https://api.46elks.com/a1/sms", {
                method: "post",
                body: data.toString(),
                headers: { Authorization: `Basic ${auth}` }
            })
                .then(response => response.json())
                .then(json => console.log("SMS sent:", json))
                .catch(err => console.error("Error sending SMS:", err));
        }, delay); // Schedule for the delay duration

        res.status(200).send(`Reminder scheduled: "${message}" for ${nextDate}.`);
    } catch (err) {
        console.error('Error parsing cron syntax:', err.message);
        res.status(400).send(`Error parsing cron syntax: ${err.message}`);
    }
});

// Start the server
const PORT = process.env.PORT || 3334;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
