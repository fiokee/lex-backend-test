const express = require('express');
const { check } = require('express-validator');
const usersController = require('../controllers/users_controller');
const CheckAuth = require('../middleware/check_auth');
const {FileUpload} = require('../middleware/file-Upload')

const router = express.Router();


router.post('/signup', [
  check('username').not().isEmpty().withMessage('Username is required'),
  check('firstname').not().isEmpty().withMessage('First name is required'),
  check('lastname').not().isEmpty().withMessage('Last name is required'),
  check('phone').isMobilePhone().withMessage('Must be a valid phone number'),
  check('email').normalizeEmail().isEmail().withMessage('Please provide a valid email'),
  check('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
], usersController.signup);

router.post('/login', [
  check('email').normalizeEmail().isEmail().withMessage('Please provide a valid email'),
  check('password').exists().withMessage('Password is required')
], usersController.login);

router.use(CheckAuth);
// Add this route for profile picture upload
router.patch('/profile-picture',FileUpload.single('profilePicture'), usersController.uploadProfilePicture);

router.get('/', usersController.getUser);

router.patch('/update', [
  check('username').optional(),
  check('firstname').optional(),
  check('lastname').optional(),
  check('country').optional(),
  check('city').optional(),
  check('state').optional(),
  check('image').optional(),
  check('zip').optional(),
  check('email').optional().normalizeEmail().isEmail(),
  check('phone').optional().isMobilePhone()
], usersController.updateUser);

router.patch('/change-password', [
  check('oldPassword').not().isEmpty(),
  check('newPassword').isLength({ min: 6 }),
  check('confirmedPassword').custom((value, { req }) => {
    if (value !== req.body.newPassword) {
      throw new Error('Passwords do not match');
    }
    return true;
  }),
], usersController.changePassword);

module.exports = router;