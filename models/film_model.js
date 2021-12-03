
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const FilmSchema = new Schema({
    name: { // add name validation, so it can't be blank
        type: String,
        required: true,
        validate: /\S+/
    },
    rating: { // add rating validation, so it must be one of the enums
        type: String,
        required: true,
        enum: ['*****','****','***','**','*'],
        default: '*****'
    },
    releaseYear: {
        type: Number,
        required: false,
        min: 1800
    },
    posterUrl: {
        type: String,
        required: false,
        validate: /\S+/
    },
    notes: {
        type: String,
        required: false,
        validate: /\S+/
    },
    addedBy: {
        type: String,
        required: true,
        validate: /\S+/
    },
    insertedOn: {
        type: Date,
        required: true
    },
    updatedOn: {
        type: Date,
        required: false
    }
});

module.exports = mongoose.model("Film", FilmSchema);