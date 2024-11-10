const express = require('express')
const router = express.Router()
const { OAuth2Client } = require('google-auth-library')
const jwt = require('jsonwebtoken')
const User = require('../models/Users')

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

router.post('/google', async (req, res) => {
  const { token } = req.body

  try {
    const ticket = await client.getTokenInfo(token);

    // Use the data from the token info
    const { sub: googleId, email, name } = ticket;

    let user = await User.findOne({ googleId })

    if (!user) {
      user = new User({
        googleId,
        email,
        name,
      })
      await user.save()
    }

    const jwtToken = jwt.sign(
      { id: user._id, email: user.email, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    )

    res.json({
      token: jwtToken,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
      },
    })
  } catch (error) {
    console.error('Error verifying Google token:', error)
    res.status(401).json({ error: 'Invalid token' })
  }
})

module.exports = router