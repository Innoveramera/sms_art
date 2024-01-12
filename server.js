const express = require('express');
const app = express();
const openai = new OpenAI();
const axios = require('axios');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Middleware to parse JSON bodies
app.use(express.json());

app.get('/', (req, res) => {
    res.status(200).send('Hej');
});

// Define the route for your webhook
app.post('/webhook', async (req, res) => {
    console.log('Webhook received:', req.body);

        const imageResponse = await openai.images.generate({
            model: "dall-e-3",
            prompt: prompt,
            n: 1,
            size: "1024x1792",
            user: userId
        });

        // Download image
        const response = await axios({
            method: 'get',
            url: imageResponse.data[0].url,
            responseType: 'stream'
        });

        const localImagePath = path.join(__dirname, `original.jpg`);
        const writer = fs.createWriteStream(localImagePath);

        response.data.pipe(writer);

        await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });



    // Send a response back to the webhook source
    res.status(200);
});

// Start the server
const PORT = 3333;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
