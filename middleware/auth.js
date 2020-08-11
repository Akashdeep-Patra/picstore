const jwt = require('jsonwebtoken')
const config = require('config')

module.exports = (req, res, next) => {
  //get the token from header
  const token = req.header('x-auth-token')

  // check if token is available

  if (!token) {
    return res.status(401).json({ message: 'No token autherization denied' })
  }
  //verify the token

  try {
    const decoded = jwt.verify(token, config.get('jwtSecret'))
    req.user = decoded.user
    next()
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' })
  }
}
