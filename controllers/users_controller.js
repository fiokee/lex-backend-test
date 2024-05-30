const { v4: uuidv4 } = require('uuid');
const HttpError = require('../models/httpError');
const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const path = require('path');



const getUser = async (req, res, next) => {
    const userId = req.userData.userId; // Use the userId from the token
  
    let user;
    try {
      user = await User.findById(userId).select('-password');
      if (!user) {
        return next(new HttpError('User not found', 404));
      }
    } catch (err) {
      return next(new HttpError('Fetching user failed, please try again later', 500));
    }
  
    res.json({ user: user.toObject({ getters: true }) });
  };
  

const signup = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log(errors.array()); // Log validation errors for debugging
        return next(new HttpError('Invalid user input, please check your input data', 422));
    }

    const { username, firstname, lastname, phone, email, password, confirmedPassword } = req.body;

    let existingUser;
    try {
        existingUser = await User.findOne({ email: email });
    } catch (err) {
        return next(new HttpError('Signing up failed, please try again', 500));
    }

    if (existingUser) {
        return next(new HttpError('User already exists, please login instead', 422));
    }

    if (password !== confirmedPassword) {
        return next(new HttpError('Passwords do not match', 422));
    }

    let hashedPassword;
    try {
        hashedPassword = await bcrypt.hash(password, 12);
    } catch (err) {
        return next(new HttpError('Could not create user, please try again', 500));
    }

    const createdUser = new User({
        username,
        firstname,
        lastname,
        phone,
        email,
        password: hashedPassword
    });

    try {
        await createdUser.save();
    } catch (err) {
        return next(new HttpError('Signing up user failed, please try again', 500));
    }

    //generating webtoken jwt for users
    let token;
    try {
        token = jwt.sign({userId: createdUser.id, email: createdUser.email}, 
            'super_1111',
             {expiresIn: '1h'}
            );
    } catch (err) {
        const error = new HttpError('Signing Up user failed, please try again', 500);
        return next(error);
    }
    
    res.status(201).json({message: 'User created successfully',userId: createdUser.id, email: createdUser.email, token: token }); //data to send back to cleint or frontend
};

const login = async (req, res, next) => {
    const { email, password } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email });
  } catch (err) {
    return next(new HttpError('Login failed, please try again', 500));
  }

  if (!existingUser) {
    return next(new HttpError('Invalid credentials, could not login user', 401));
  }

  let isValidPassword = false;
  try {
    isValidPassword = await bcrypt.compare(password, existingUser.password);
  } catch (err) {
    return next(new HttpError('Could not log you in, please check credentials and try again', 500));
  }

  if (!isValidPassword) {
    return next(new HttpError('Invalid credentials, could not login user', 401));
  }

  //generating webtoken jwt for users
  let token;
  try {
    token = jwt.sign({ userId: existingUser.id, email: existingUser.email }, 
      'super_1111', 
      { expiresIn: '1h' }
    );
  } catch (err) {
    const error = new HttpError('Login user failed, please try again', 500);
    return next(error);
  }

  res.status(200).json({ message: 'Login successful', userId: existingUser.id, email: existingUser.email, token: token });
};

//updating user info
const updateUser = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new HttpError('Invalid inputs passed, please check your data.', 422));
  }

  const userId = req.userData.userId;
  const { username, firstname, lastname, phone, email, country, state, city, zip } = req.body;
  const file = req.file;

  let user;
  try {
    user = await User.findById(userId).select('-password');
  } catch (err) {
    return next(new HttpError('Something went wrong, could not update user.', 500));
  }

  if (!user) {
    return next(new HttpError('Could not find user for this id.', 404));
  }

  user.username = username || user.username;
  user.firstname = firstname || user.firstname;
  user.lastname = lastname || user.lastname;
  user.phone = phone || user.phone;
  user.email = email || user.email;
  user.country = country || user.country;
  user.state = state || user.state;
  user.city = city || user.city;
  user.zip = zip || user.zip;

  if (file) {
    user.profilePicture = file.path;
  }

  try {
    await user.save();
  } catch (err) {
    return next(new HttpError('Something went wrong, could not update user.', 500));
  }

  res.status(200).json({ user: user.toObject({ getters: true }) });
};

//changeing user password
const changePassword = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new HttpError('Invalid inputs passed, please check your data.', 422));
    }

    const userId = req.userData.userId;
    const { oldPassword, newPassword, confirmedPassword } = req.body;

    let user;
    try {
        user = await User.findById(userId);
    } catch (err) {
        const error = new HttpError('Something went wrong, could not update password.', 500);
        return next(error);
    }

    if (!user) {
        const error = new HttpError('Could not find user for this id.', 404);
        return next(error);
    }

    // Check if the old password is correct
    let isValidPassword = false;
    try {
        isValidPassword = await bcrypt.compare(oldPassword, user.password);
    } catch (err) {
        const error = new HttpError('Could not verify old password, please try again.', 500);
        return next(error);
    }

    if (!isValidPassword) {
        const error = new HttpError('Invalid old password.', 403);
        return next(error);
    }

    // Hash the new password
    let hashedPassword;
    try {
        hashedPassword = await bcrypt.hash(newPassword, 12);
    } catch (err) {
        const error = new HttpError('Could not update password, please try again.', 500);
        return next(error);
    }

    user.password = hashedPassword;

    try {
        await user.save();
    } catch (err) {
        const error = new HttpError('Something went wrong, could not update password.', 500);
        return next(error);
    }

    res.status(200).json({ message: 'Password updated successfully' });
};

exports.getUser = getUser;
exports.signup = signup;
exports.login = login;
exports.updateUser = updateUser;
exports.changePassword = changePassword;

