const express = require('express');
const mongoose = require('mongoose');
const webpush = require('web-push');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const Thought = require('./models/Thought');

const app = express();
const PORT = process.env.PORT || 5000;

const publicKey = "BPaEKIdCdkDnrf7-ohnr5d9rvhqKkFmgaC6uypYkXCty6HpkvY_fan_LpbERvqYJ1j5DKNA8X1FMLQysLMiSWKs";
const privateKey = "OSs63SX03YiIK0urKTABXH0gQrnRpFP2BVsyyHcTbMo";

webpush.setVapidDetails(
  'mailto:your-email@example.com',
  publicKey,
  privateKey
);

app.use(cors());  
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

mongoose.connect('mongodb://127.0.0.1:27017/feelings', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

let adminSubscriptions = [];

// Save admin subscription only
app.post('/subscribe-admin', (req, res) => {
  const subscription = req.body;
  // Optional: check if subscription already exists to avoid duplicates
  adminSubscriptions.push(subscription);
  res.status(201).json({ message: 'Admin subscribed successfully' });
});

// Save new thought and notify admin
app.post('/thoughts', async (req, res) => {
  const { message, mood } = req.body;

  if (!message || message.trim() === '') {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const newThought = new Thought({
      message: message.trim(),
      mood: mood ? mood.trim() : ''
    });
    await newThought.save();

    const payload = JSON.stringify({
      title: 'New Thought Received',
      body: `Feeling shared: "${newThought.message}"`,
      data: { mood: newThought.mood, message: newThought.message }
    });

    adminSubscriptions.forEach(sub => {
      webpush.sendNotification(sub, payload).catch(console.error);
    });

    res.status(201).json({ message: 'Thought saved and notification sent to admin' });
  } catch (error) {
    console.error('Save thought error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/thoughts', async (req, res) => {
  try {
    const thoughts = await Thought.find().sort({ timestamp: -1 });
    res.json(thoughts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.listen(PORT,'0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
