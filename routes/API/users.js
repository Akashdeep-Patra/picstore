const express = require('express')
const gravatar = require('gravatar')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const config = require('config')
const router = express.Router()
const { check, validationResult } = require('express-validator')
const User = require('./../../models/User')
// Route    post api/users
// desc        register user
// acess    public
router.post(
  '/',
  [
    check('name', 'Please enter a name ').not().isEmpty(),
    check('email', 'Please enter a valid email address').isEmail(),
    check('password', 'Please enter a password that is atleast 3 charracter long').isLength({ min: 3 })
  ],
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }
    const { name, email, password } = req.body
    try {
      //see if the user already exists
      let user = await User.findOne({ email })
      if (user) {
        return res.status(400).json({ errors: [{ message: 'Another user with the same email already exists' }] })
      }
      //get users gravatar
      const avatar = gravatar.url(email, {
        s: '200',
        r: 'pg',
        d: 'mm'
      })
      user = new User({
        name,
        email,
        password,
        avatar
      })
      //encrypt the password
      const salt = await bcrypt.genSalt(10)
      user.password = await bcrypt.hash(password, salt)
      await user.save()
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
