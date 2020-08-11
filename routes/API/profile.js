const express = require('express')
const router = express.Router()
const auth = require('./../../middleware/auth')
const Profile = require('./../../models/Profile')
const User = require('./../../models/User')
// const axios = require('axios')
const request = require('request')
const config = require('config')
const { check, validationResult } = require('express-validator')
const { response } = require('express')
// Route    get api/Profile/me
// desc     own profile route
// acess    private
router.get('/me', auth, async (req, res) => {
  try {
    // try getting the profile from current user
    const profile = await Profile.findOne({ user: req.user.id }).populate('user', ['name', 'avatar'])
    //check if we are getting the profile
    if (!profile) {
      return res.status(400).json({ message: 'There is no profile for this user' })
    }
    res.json(profile)
  } catch (err) {
    console.error(err.message)
    res.status(500).send('server error')
  }
})

// Route    post api/Profile
// desc     create or update user profile
// acess    private
router.post(
  '/',
  [
    auth,
    check('status', 'Status is requierd').not().isEmpty(),
    check('skills', 'skills are requiered').not().isEmpty()
  ],
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }
    const {
      company,
      website,
      location,
      bio,
      status,
      githubusername,
      skills,
      youtube,
      facebook,
      twitter,
      instagram,
      linkedin
    } = req.body

    //build profile object
    const profileFields = {}
    profileFields.user = req.user.id
    if (company) profileFields.company = company
    if (website) profileFields.website = website
    if (location) profileFields.location = location
    if (bio) profileFields.bio = bio
    if (status) profileFields.status = status
    if (githubusername) profileFields.githubusername = githubusername
    if (skills) profileFields.skills = skills.split(',').map((a) => a.trim())
    // build social object for social media
    profileFields.social = {}
    if (youtube) profileFields.social.youtube = youtube
    if (facebook) profileFields.social.facebook = facebook
    if (twitter) profileFields.social.twitter = twitter
    if (instagram) profileFields.social.instagram = instagram
    if (linkedin) profileFields.social.linkedin = linkedin
    // console.log(profileFields.skills)
    try {
      let profile = await Profile.findOne({ user: req.user.id })
      //check if there already a profile existing
      if (profile) {
        //update the profile
        profile = await Profile.findOneAndUpdate({ user: req.user.id }, { $set: profileFields })
        return res.status(200).json(profile)
      }
      //not found create
      profile = new Profile(profileFields)
      await profile.save()
      res.json(profile)
    } catch (err) {
      res.status(500).json({ message: 'Server error' })
    }
    // res.send('Hello')
  }
)
// Route    get api/profile
// desc     gets all the user profiles
// acess    public

router.get('/', async (req, res) => {
  try {
    const profiles = await Profile.find().populate('user', ['name', 'avatar'])
    res.json(profiles)
  } catch (err) {
    console.error(err.message)
    res.status(500).json({ message: 'Server error' })
  }
})

// Route    get api/profile/user/:user_id
// desc     gets the profile by userid
// acess    public

router.get('/user/:user_id', async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.params.user_id }).populate('user', ['name', 'avatar'])
    if (!profile) return res.status(400).json({ message: 'user does not exists' })
    res.json(profile)
  } catch (err) {
    console.error(err.message)
    if (err.kind == 'ObjectId') return res.status(400).json({ message: 'user does not exists' })
    res.status(500).json({ message: 'Server error' })
  }
})

// Route    delete api/profile
// desc     deletes the user, profile and all the corresponding posts
// acess    private

router.delete('/', auth, async (req, res) => {
  try {
    // todo---- delete the posts

    // delete the current users Profile
    await Profile.findOneAndDelete({ user: req.user.id })
    //delete the current user
    await User.findOneAndDelete({ _id: req.user.id })
    res.json({ message: 'successfully deleted' })
  } catch (err) {
    console.error(err.message)
    res.status(500).json({ message: 'Server error' })
  }
})
// Route    put api/profile/experience
// desc     puts the user user experience
// acess    private
router.put(
  '/experience',
  [
    auth,
    [
      check('title', 'title is requiered').not().isEmpty(),
      check('company', 'company is requiered').not().isEmpty(),
      check('from', 'from date is requiered').not().isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

    const { title, company, location, from, to, current, description } = req.body
    const newExp = { title, company, location, from, to, current, description }

    try {
      const profile = await Profile.findOne({ user: req.user.id })
      profile.experience.unshift(newExp)
      await profile.save()
      res.json(profile)
    } catch (err) {
      console.error(err.message)
      res.status(500).json({ message: 'Server error' })
    }
  }
)

// Route    delete api/profile/experience/:exp_id
// desc     deletes an experience of the current user
// acess    private

router.delete('/experience/:exp_id', auth, async (req, res) => {
  try {
    //get the current profile
    const profile = await Profile.findOne({ user: req.user.id })
    //get the index of the experience that we need to remove
    const removeIndex = profile.experience.map((item) => item._id).indexOf(req.params.exp_id)
    profile.experience.splice(removeIndex, 1)
    await profile.save()
    res.json(profile)
  } catch (err) {
    console.error(err.message)
    res.status(500).json({ message: 'Server error' })
  }
})

// Route    put api/profile/education
// desc     puts the user  education
// acess    private
router.put(
  '/education',
  [
    auth,
    [
      check('school', 'School is requiered').not().isEmpty(),
      check('degree', 'Degree is requiered').not().isEmpty(),
      check('fieldofstudy', 'Field of study is requiered').not().isEmpty(),
      check('from', 'from date is requiered').not().isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

    const { school, degree, fieldofstudy, from, to, current, description } = req.body
    const newEdu = { school, degree, fieldofstudy, from, to, current, description }

    try {
      const profile = await Profile.findOne({ user: req.user.id })
      profile.education.unshift(newEdu)
      await profile.save()
      res.json(profile)
    } catch (err) {
      console.error(err.message)
      res.status(500).json({ message: 'Server error' })
    }
  }
)

// Route    delete api/profile/education/:edu_id
// desc     deletes an education of the current user
// acess    private

router.delete('/education/:edu_id', auth, async (req, res) => {
  try {
    //get the current profile
    const profile = await Profile.findOne({ user: req.user.id })
    //get the index of the experience that we need to remove
    const removeIndex = profile.education.map((item) => item._id).indexOf(req.params.exp_id)
    profile.education.splice(removeIndex, 1)
    await profile.save()
    res.json(profile)
  } catch (err) {
    console.error(err.message)
    res.status(500).json({ message: 'Server error' })
  }
})

// Route    get api/profile/github/:username
// desc     get the github repo of an user
// acess    public
router.get('/github/:username', async (req, res) => {
  try {
    const options = {
      uri: `https://api.github.com/users/${
        req.params.username
      }/repos?per_page=5&sort=created:asc&client_id=${config.get('githubClientId')}&client_secret=${config.get(
        'githubSecret'
      )}`,
      method: 'GET',
      headers: { 'user-agent': 'node.js' }
    }

    request(options, (error, response, body) => {
      if (error) console.error(error)
      if (response.statusCode !== 200) {
        return res.status(404).json({ message: 'No github profile found' })
      }
      res.json(JSON.parse(body))
    })
  } catch (err) {
    console.error(err.response.statusText)
    res.status(500).json({ message: 'Server error' })
  }
})
module.exports = router
