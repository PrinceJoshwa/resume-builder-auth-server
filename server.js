require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const authRoutes = require('./routes/auth')

const app = express()

app.use(cors({
  origin: 'http://localhost:5173', // Update this to match your Vite frontend URL
  credentials: true,
}))
app.use(express.json())

mongoose.connect(process.env.MONGODB_URI, {
  // Remove deprecated options
})
.then(() => console.log('Connected to MongoDB'))
.catch((err) => console.error('Error connecting to MongoDB:', err))

app.use('/api/auth', authRoutes)

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))