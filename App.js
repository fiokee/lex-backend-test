const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const HttpError = require('./models/httpError');
const usersRoute = require('./routes/users_route');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(bodyParser.json());
app.use('/uploads/images', express.static(path.join(__dirname, 'uploads', 'images')));


//handling cors error
app.use((req, res, next)=>{
  res.setHeader('Access-Control-Allow-Origin', '*'); //handling CORS Error
  res.setHeader('Access-Control-Allow-Headers',
  'Origin, X-Requested-With, Content-Type, Accept, Authorization'); //controls all incoming reqest by header

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE');
  if(req.method === 'OPTIONS'){
    return res.sendStatus(200);
  }
  next();
});

app.use('/api/users', usersRoute);


// Error handling for routes
app.use((error, req, res, next) => {
  if (res.headerSent) {
    return next(error);
  }
  res.status(error.code || 500);
  res.json({ message: error.message || 'An unknown error occurred!' });
});

// Error handling for unidentified routes
app.use((req, res, next) => {
  const error = new HttpError('Could not find the specified route', 404);
  next(error);
});

// Connecting to the database
mongoose
  .connect('mongodb+srv://test_lexi:Lexi_Dev2024@cluster0.afn6l2s.mongodb.net/users?retryWrites=true&w=majority&appName=Cluster0')
  .then(() => {
    app.listen(4000, () => {
      console.log('Database connected and server running on port 4000');
    });
  })
  .catch((err) => {
    console.error('Connection failed', err);
  });
