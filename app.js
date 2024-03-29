const express = require('express');
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');

require('dotenv').config();

const basePath = "/api/v1";

const Film = require('./models/film_model');
const User = require('./models/user_model');

const utils = require('./utilities');

app.use(express.json());
app.use(cors());

// GET / - for health-check purposes
app.get("/", (req, res) => {
  res.json({
    status: "200",
    message: "Films service is up and running"
  });
})

// POST /login - for getting a bearer token
app.post(basePath + "/login", async (req, res) => {
  const user = {
    username: req.body.username,
    password: req.body.password
  }

  function signTokenForUser(status) {
    const jwtSecret = utils.getJwtSecret(user.password);
    jwt.sign({ user }, jwtSecret, (err, token) => {
      res.json({
        status: status,
        token
      })
    })
  }

  const isNew = req.query.isNew;

  if (!isNew) {

    try {
      await User.countDocuments({ username: user.username, password: user.password }, function (e, count) {
        if (count > 0) {
          console.log(":: User " + user.username + " has access, issuing token ::");
          signTokenForUser(200);
        } else {
          console.log(":: User " + user.username + " not found ::");
          utils.returnError(res, 403, "User " + user.username + " does not exist or password is incorrect");
        }
      }).clone()
        .catch(e => { 
          console.log(e);
          utils.returnError(res, 400, e.message);
        });
    } catch (e) {
      console.log(e);
      utils.returnError(res, 400, e.message);
    }
  } else {
    try {
      await User.countDocuments({ username: user.username }, function (e, count) {
        if (count > 0) { // if user exists, return error
          console.log(":: User " + user.username + " already exists ::");
          utils.returnError(res, 400, "User " + user.username + " already exists");
        } else { // if user does not exist, create user
          console.log(":: User " + user.username + " does not exist, creating ::");
          const newUser = new User({ // create new user object
            username: user.username,
            password: user.password
          });
          newUser.save() // save user
            .then(() => {
              console.log(":: User " + user.username + " created ::");
              signTokenForUser(201);
            })
            .catch(e => {
              console.log(e);
              utils.returnError(res, 400, e.message);
            });
        }
      }).clone()
        .catch(e => {
          console.log(e);
          utils.returnError(res, 400, e.message);
        });
    } catch (e) {
      console.log(e);
      utils.returnError(res, 400, e.message);
    }
  }
  
})

// GET /films - to get all films in the list as an array
app.get(basePath + "/films", utils.verifyToken, async (req, res) => {

  let addedBy = utils.decodeToken(req.headers['authorization']).user.username;

  let offset;
  let limit;

  if (req.query.offset) {
    offset = parseInt(req.query.offset);
  } else offset = 0;
  if (req.query.limit) {
    limit = parseInt(req.query.limit);
  } else limit = 10;

  try {
    // const films = await Film.find({}); // get all the films that the user added to DB
    const films = await Film.find({addedBy: addedBy}).limit(limit).skip(limit * offset);
    console.log(":: Returning list of films ::");
    res.json({
      total: films.length,
      data: films
    });
  } catch (e) {
    console.log(e);
    utils.returnError(res, 400, e.message);
  }
  
});

// GET /films/:id - to get a film by its id
app.get(basePath + "/films/:id", utils.verifyToken, async (req, res) => {
  const id = req.params.id;
  let addedBy = utils.decodeToken(req.headers['authorization']).user.username;

  if (utils.checkIdLength(id)) { // if id is a valid mongoose id
    try {
      // const films = await Film.find({}); // get all the films that the user added to DB
      var film = await Film.findOne({_id: id, addedBy: addedBy});

      if (film) {
        console.log(":: Returning the film :: ID " + id);
        res.json(film);
      } else {
        console.log(":: Film not found for user :: ID " + id);
        utils.returnError(res, 404, "Film not found for user");
      }
    } catch (e) {
      console.log(e);
      utils.returnError(res, 400, e.message);
    }
  } else { // if id is not valid
    console.log(":: Invalid ID ::");
    utils.returnError(res, 400, "Invalid ID");
  }       
});

// POST /films - To add a film to the list
app.post(basePath + "/films", utils.verifyToken, async (req, res) => {
  let addedBy = utils.decodeToken(req.headers['authorization']).user.username;

  const today = new Date();
  
  try { // create the Film object with request data, validating enum for rating
    var film = new Film({
      name: req.body.name,
      rating: req.body.rating,
      releaseYear: req.body.releaseYear,
      posterUrl: req.body.posterUrl,
      notes: req.body.notes,
      addedBy: addedBy,
      insertedOn: today
    })

    await film.save(); // save the film data to DB

    console.log(":: Film '" + film.name + "' was created :: ID: " + film._id);

    res.status(201);
    res.json({
      status: 201,
      message: "Film was successfully added",
      id: film._id
    });
  } catch(e) { // catch any errors thrown
    console.log(e);
    utils.returnError(res, 400, e.message);
  }
});

// PUT /films/{id} - To update an existing film in the DB
app.put(basePath + "/films/:id", utils.verifyToken, async (req, res) => {
  const id = req.params.id;
  const addedBy = utils.decodeToken(req.headers['authorization']).user.username;

  var updatedData = {
    name: req.body.name,
    rating: req.body.rating,
    releaseYear: req.body.releaseYear,
    posterUrl: req.body.posterUrl,
    notes: req.body.notes,
    updatedOn: new Date()
  }

  if (utils.checkIdLength(id)) { // if id is a valid mongoose id
    if (updatedData.name || updatedData.rating || updatedData.releaseYear || updatedData.posterUrl || updatedData.notes) { // if there is data to update
      try {
        var film = await Film.findOne({_id: id, addedBy: addedBy});
    
        if (film) {
          if (updatedData.name) film.name = updatedData.name;
          if (updatedData.rating) film.rating = updatedData.rating;
          if (updatedData.releaseYear) film.releaseYear = updatedData.releaseYear;
          if (updatedData.posterUrl) film.posterUrl = updatedData.posterUrl;
          if (updatedData.notes) film.notes = updatedData.notes;
          film.updatedOn = updatedData.updatedOn;

          await film.save();
    
          console.log(":: Film with ID " + id + " was updated ::")
          res.json({
            status: 200,
            message: "Film was successfully updated",
            id: film._id
          })
        } else {
          utils.returnError(res, 404, "Film not found for user");
        }
    
      } catch (e) {
        console.log(e);
        utils.returnError(res, 400, e.message);
      }
    } else {
      utils.returnError(res, 400, "Please supply at least one updated field for the film.")
    }
  } else { // if id is not valid
    console.log(":: Invalid ID ::");
    utils.returnError(res, 400, "Invalid ID");
  }
})

// DELETE /films - to clear the entire film list
app.delete(basePath + "/films", utils.verifyToken, async (req, res) => {

  let addedBy = utils.decodeToken(req.headers['authorization']).user.username;

  try {
    // delete the films added by the logged-in user
    await Film.deleteMany({addedBy: addedBy});

    console.log(":: Films were cleared ::");
    res.json({
      status: 200,
      message: "Films were cleared"
    });
  } catch(e) {
    console.log(e);
    utils.returnError(res, 400, "No films exist to clear");
  }
  
})

// DELETE /films/{id} - to remove one film
app.delete(basePath + "/films/:id", utils.verifyToken, async (req, res) => {

  let id = req.params.id;
  let addedBy = utils.decodeToken(req.headers['authorization']).user.username;

  if (utils.checkIdLength(id)) { // if id is a valid mongoose id
    try {
      let film = await Film.findOneAndDelete({_id: id, addedBy: addedBy});
      if (film) {
        console.log(":: Film with ID " + id + " was removed ::");
        res.json({
          status: 200,
          message: "Film was removed"
        });
      } else {
        utils.returnError(res, 404, "Film not found for user");
      } 
    } catch(e) {
      console.log(e);
      utils.returnError(res, 400, e.message);
    }
  } else {
    utils.returnError(res, 400, "Invalid ID");  // if id is not valid
  }
  
})

module.exports = app;