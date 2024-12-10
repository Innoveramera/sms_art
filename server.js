require('dotenv').config();
const express = require('express');
const app = express();
const fs = require('fs');
const cron = require('node-cron');
const cronParser = require('cron-parser');

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
    
    const [cronSyntax, ...messageParts] = sms.split(' ');
    const message = messageParts.join(' ');

    try {
        // Validate the cron syntax
        cronParser.parseExpression(cronSyntax);

        // Store the reminder
        reminders.push({ from, cronSyntax, message });

        // Schedule the reminder
        // cron.schedule(cronSyntax, () => {
        //     client.messages.create({
        //         body: message,
        //         from: 'your_twilio_number',
        //         to: from
        //     });
        // });

        res.send(`Reminder scheduled: "${message}" with cron "${cronSyntax}"`);
    } catch (err) {
        res.status(400).send('Invalid cron syntax. Please check and try again.');
    }
});

// Start the server
const PORT = 3334;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
