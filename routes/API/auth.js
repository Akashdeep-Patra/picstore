const User = require('./../../models/User')
const express = require('express')
const router = express.Router()
const auth = require('./../../middleware/auth')
const { check, validationResult } = require('express-validator')
const jwt = require('jsonwebtoken')
const config = require('config')
const bcrypt = require('bcryptjs')

// Route    get api/auth
// desc      authenticate user and get token
// acess    public
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password')
    res.json(user)
  } catch (err) {
    console.error(err.message)
    res.status(500).json({ message: 'Server error' })
  }
})

// Route    post api/auth
// desc        register user
// acess    public
router.post(
  '/',
  [check('email', 'Please enter a valid email address').isEmail(), check('password', 'Password is requierd').exists()],
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }
    const { email, password } = req.body
    try {
      //see if the user already exists
      let user = await User.findOne({ email })
      if (!user) {
        return res.status(400).json({ errors: [{ message: 'Invalid credentials' }] })
      }
      // see if the password matches with the database
      const isMatch = await bcrypt.compare(password, user.password)
      if (!isMatch) {
        return res.status(400).json({ errors: [{ message: 'Invalid credentials' }] })
      }
      //return json-webtoken
      const payload = {
        user: {
          id: user.id
        }
      }
      jwt.sign(payload, config.get('jwtSecret'), { expiresIn: 360000 }, (err, token) => {
        if (err) throw err
        res.json({ token })
      })
    } catch (err) {
      console.error(err.message)
      res.status(500).send('Server error')
    }
  }
)

module.exports = router
