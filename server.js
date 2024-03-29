require('dotenv').config();
const express = require('express');
const app = express();
const OpenAI = require('openai');
const openai = new OpenAI();
const axios = require('axios');
const path = require('path');
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
    getResponse(sms);

    // Send a response back to the webhook source
    res.status(200).send();
});

async function getResponse (sms) {
    var message = "Behandlar inkommmande SMS...";
    fs.writeFile('message.txt', message, (err) => {
        if (err) {
            console.error('Error writing to file:', err);
            res.status(500).send('Error writing to file');
            return;
        }
    });

    console.log(sms);

    const imageResponse = await openai.images.generate({
        model: "dall-e-3",
        prompt: sms,
        n: 1,
        size: "1792x1024",
    });

    // Download image
    const response = await axios({
        method: 'get',
        url: imageResponse.data[0].url,
        responseType: 'stream'
    });

    const localImagePath = path.join(__dirname + "/public/", `original.jpg`);
    const writer = fs.createWriteStream(localImagePath);

    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
    });

    message = "Skicka ett SMS som i text beskriver vad du vill se till " + process.env.ELKS_NR + " \n(Nu visas \"" + sms + "\")";
    fs.writeFile('message.txt', message, (err) => {
        if (err) {
            console.error('Error writing to file:', err);
            res.status(500).send('Error writing to file');
            return;
        }
    });
}

// Start the server
const PORT = 3333;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
