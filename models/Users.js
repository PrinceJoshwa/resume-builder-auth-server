const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
  googleId: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  picture: String,
  resumeData: {
    type: Object,
    default: {}
  }
})

module.exports = mongoose.model('User', userSchema)