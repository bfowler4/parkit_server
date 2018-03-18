module.exports = {
  isAuthenticated,
  isVerifiedUser
}

function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ message: `Unauthorized` });
}

function isVerifiedUser(req, res, next) {
  if (parseInt(req.params.user_id) === req.user.id) {
    return next();
  }
  return res.status(403).json({ message: `Forbidden` });
}