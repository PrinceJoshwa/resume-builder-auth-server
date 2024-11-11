require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const axios = require('axios'); // Import axios to make API requests
const authRoutes = require('./routes/auth');
const Resume = require('./models/Resume');
const User = require('./models/Users');

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL, 
  credentials: true,
}));
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('Error connecting to MongoDB:', err));

// JWT Authentication Middleware
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(403).json({ message: 'No token provided' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Failed to authenticate token' });
    }
    req.userId = decoded.id;
    next();
  });
};

// Google OAuth2 Login
app.post('/api/auth/google', async (req, res) => {
  const { token: accessToken } = req.body;
  try {
    const userInfoResponse = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const { sub: googleId, name, email, picture } = userInfoResponse.data;

    let user = await User.findOne({ email });
    if (!user) {
      user = new User({
        googleId,
        name,
        email,
        picture,
      });
      await user.save();
    }

    const jwtToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token: jwtToken, user: { id: user._id, name: user.name, email: user.email } });
  } catch (error) {
    console.error('Error retrieving user info with access token:', error);
    res.status(400).json({ message: 'Invalid token' });
  }
});

app.post('/api/save-user-data', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    user.resumeData = req.body;
    await user.save();
    res.json({ message: 'Data saved successfully' });
  } catch (error) {
    console.error('Error saving user data:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/save-resume', verifyToken, async (req, res) => {
  try {
    const { templateId, data } = req.body;
    const resume = new Resume({
      userId: req.userId,
      templateId,
      data
    });
    await resume.save();
    res.json({ message: 'Resume saved successfully' });
  } catch (error) {
    console.error('Error saving resume:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/my-resumes', verifyToken, async (req, res) => {
  try {
    const resumes = await Resume.find({ userId: req.userId });
    res.json(resumes);
  } catch (error) {
    console.error('Error fetching resumes:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/resume/:id', verifyToken, async (req, res) => {
  try {
    const resume = await Resume.findOne({
      _id: req.params.id,
      userId: req.userId
    });
    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }
    res.json(resume);
  } catch (error) {
    console.error('Error fetching resume:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
