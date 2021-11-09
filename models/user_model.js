
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    username: { // add username validation, so it can't be blank
        type: String,
        required: true,
        validate: /\S+/
    },
    password: {
        type: String,
        required: true,
        validate: /\S+/
    }
});

module.exports = mongoose.model("User", UserSchema);