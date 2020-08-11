const express = require('express')
const router = express.Router()
const { check, validationResult } = require('express-validator')
const auth = require('./../../middleware/auth')
const Post = require('./../../models/Post')
const User = require('./../../models/User')
const Pofile = require('./../../models/Profile')
// Route    get api/posts
// desc       get all the posts in db
// acess    private

router.get('/', auth, async (req, res) => {
  try {
    const posts = await Post.find().sort({ date: -1 })
    res.json(posts)
  } catch (err) {
    console.error(err.message)
    res.status(500).json({ message: 'Server error' })
  }
})
// Route    get api/posts/my
// desc       get all the posts by the current user id
// acess    private

router.get('/my', auth, async (req, res) => {
  try {
    const posts = await Post.find({ user: req.user.id }).sort({ date: -1 })
    res.json(posts)
  } catch (err) {
    console.error(err.message)
    res.status(500).json({ message: 'Server error' })
  }
})

// Route    get api/posts/:id
// desc       get the post by post-id
// acess    private

router.get('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
    if (!post) return res.status(404).json({ message: 'Post not found' })
    res.json(post)
  } catch (err) {
    console.error(err.message)
    if (err.kind === 'ObjectId') return res.status(404).json({ message: 'Post not found' })
    res.status(500).json({ message: 'Server error' })
  }
})

// Route    post  api/posts
// desc     posts a post from the current user
// acess    private

router.post('/', [auth, check('text', 'Text is required').not().isEmpty()], async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }
  try {
    // get the user excluding password
    const user = await User.findById(req.user.id).select('-password')
    //new post variable
    const newPost = Post({
      text: req.body.text,
      name: user.name,
      avatar: user.avatar,
      user: req.user.id
    })

    const savedPost = await newPost.save()
    res.json(savedPost)
  } catch (err) {
    console.error(err.message)
    res.status(500).json({ message: 'Server error' })
  }
})

// Route    delete api/posts/:id
// desc       delete a post by id
// acess    private

router.delete('/:id', auth, async (req, res) => {
  try {
    // get the post by the current user and the given post id
    const post = await Post.findOne({ _id: req.params.id, user: req.user.id })
    if (!post) return res.status(404).json({ message: 'User not authorizeed' })
    post.delete()
    res.json({ message: 'Post removed' })
  } catch (err) {
    console.error(err.message)
    if (err.kind === 'ObjectId') return res.status(404).json({ message: 'Post not found' })
    res.status(500).json({ message: 'Server error' })
  }
})

// Route    put api/posts/like/:id
// desc       adding like to  a post by the current request
// acess    private

router.put('/like/:id', auth, async (req, res) => {
  try {
    // get the post by the current user and the given post id
    const post = await Post.findById(req.params.id)
    if (!post) return res.status(404).json({ message: 'Post  not found' })
    //check if the the current user already has liked the post
    if (post.likes.filter((like) => like.user.toString() === req.user.id).length > 0) {
      return res.status(400).json({ message: 'Post already liked by this user' })
    }
    post.likes.unshift({ user: req.user.id })
    await post.save()
    res.json(post.likes)
  } catch (err) {
    console.error(err.message)
    if (err.kind === 'ObjectId') return res.status(404).json({ message: 'Post not found' })
    res.status(500).json({ message: 'Server error' })
  }
})

// Route    put api/posts/unlike/:id
// desc       removing the alredy liked to  a post by the current request
// acess    private

router.put('/unlike/:id', auth, async (req, res) => {
  try {
    // get the post by the current user and the given post id
    const post = await Post.findById(req.params.id)
    if (!post) return res.status(404).json({ message: 'Post  not found' })
    //check if the the current user already has liked the post
    if (post.likes.filter((like) => like.user.toString() === req.user.id).length === 0) {
      return res.status(400).json({ message: 'Post has not been liked by the user' })
    }
    //   get the remove index
    const removeIndex = post.likes.map((like) => like.user.toString()).indexOf(req.user.id)
    post.likes.splice(removeIndex, 1)

    await post.save()
    res.json(post.likes)
  } catch (err) {
    console.error(err.message)
    if (err.kind === 'ObjectId') return res.status(404).json({ message: 'Post not found' })
    res.status(500).json({ message: 'Server error' })
  }
})

// Route    post  api/posts/comment/:id
// desc     posts a comment on the given post id
// acess    private

router.post('/comment/:id', [auth, check('text', 'Text is required').not().isEmpty()], async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }
  try {
    // get the user excluding password
    const user = await User.findById(req.user.id).select('-password')
    //get the post
    const post = await Post.findById(req.params.id)
    //new comment variable
    const newComment = {
      text: req.body.text,
      name: user.name,
      avatar: user.avatar,
      user: req.user.id
    }
    post.comments.unshift(newComment)
    await post.save()
    res.json(post.comments)
  } catch (err) {
    console.error(err.message)
    res.status(500).json({ message: 'Server error' })
  }
})

// Route    post  api/posts/comment/:post_id/:comment_id
// desc     delete a commment from a perticuler post only if that comment belongs to current user
// acess    private
router.delete('/comment/:post_id/:comment_id', auth, async (req, res) => {
  try {
    //get the post
    const post = await Post.findById(req.params.post_id)
    //get the comment
    const comment = post.comments.find((comment) => comment.id === req.params.comment_id)
    // make sure the comment exists
    if (!comment) return res.status(404).json({ message: 'Commment does not exist' })
    //check user
    if (comment.user.toString() !== req.user.id) return req.status(401).json({ message: 'User not autherized' })
    //get the remove index
    const removeIndex = post.comments.map((comment) => comment.id).indexOf(comment.id)
    post.comments.splice(removeIndex, 1)
    await post.save()
    res.json(post.comments)
  } catch (err) {
    console.error(err.message)
    res.status(500).json({ message: 'Server error' })
  }
})
module.exports = router
