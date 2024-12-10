require('dotenv').config();
const express = require('express');
const app = express();
const fs = require('fs');
const cron = require('node-cron');
const cronParser = require('cron-parser');
const fetch = require('node-fetch');

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
        // Validate the cron syntax
        cronParser.parseExpression(cronSyntax);

        // Store the reminder
        reminders.push({ from, cronSyntax, message });

        // Schedule the reminder
        cron.schedule(cronSyntax, () => {
            const username = "u65e77ddc6ccb7e725c4334bae308aecd";
            const password = "A771270B62CD8A3211F4D5DDAB06B3E8";
            const auth = Buffer.from(username + ":" + password).toString("base64");

            let data = {
                from: "Remind.me",
                to: from,
                message: message
            }

            data = new URLSearchParams(data);
            data = data.toString();

                
            fetch("https://api.46elks.com/a1/sms", {
                method: "post",
                body: data,
                headers: { "Authorization": "Basic " + auth }
            })
                .then(res => res.json())
                .then(json => console.log(json))
                .catch(err => console.log(err))
        });

        res.status(200).send(`Reminder scheduled: "${message}" with cron "${cronSyntax}"`);
    } catch (err) {
        console.error('Error parsing cron syntax:', err.message);
        res.status(400).send(`Error parsing cron syntax: ${err.message}`);
    }
});

// Start the server
const PORT = 3334;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
