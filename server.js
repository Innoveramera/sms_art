require('dotenv').config();
const express = require('express');
const app = express();
const fs = require('fs');

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
    console.log(req.body);

    // Send a response back to the webhook source
    res.status(200).send("ACK");
});

// Start the server
const PORT = 3334;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
