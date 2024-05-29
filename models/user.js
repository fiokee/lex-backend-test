const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const Schema = mongoose.Schema;

const userSchema = new Schema({
    username: { type: String, required: true },
    firstname: { type: String, required: true },
    lastname: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, minlength: 6 },
    profilePicture: { type: String, required: false }, // updated field name
    country: { type: String, required: false },
    state: { type: String, required: false },
    city: { type: String, required: false },
    zip: { type: String, required: false }
});

userSchema.plugin(uniqueValidator); // this checks for existing email
module.exports = mongoose.model('User', userSchema);
