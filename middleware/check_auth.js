const jwt = require('jsonwebtoken');
const HttpError = require('../models/httpError');

const checkAuth = (req, res, next) => {
  if (req.method === 'OPTIONS') {
    return next();
  }
  try {
    const token = req.headers.authorization && req.headers.authorization.split(' ')[1];
    if(!token){
      return next(new HttpError('Authentication failed, token missing.', 403))
    }
    const decodedToken = jwt.verify(token, 'super_1111');
    req.userData = {userId: decodedToken.userId, email: decodedToken.email};
    next();
    } catch (err) {
    const error = new HttpError('Authentication failed! Invalid token', 403);
    console.error('Authentication error:', err); // Log the error for debugging
    return next(error);
  }
};

module.exports = checkAuth;
