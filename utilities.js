const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const Film = require('./models/film_model');

var UTIL = (() => {

    // reusable function to return errors
    var returnError = (res, stat, msg) => {
        res.status(stat);
        res.json({
        status: stat,
        message: msg
        })
    }

    var getJwtSecret = (pw) => {
        return crypto.createHash('sha512').update(pw).digest('hex');
    }

    // function to validate the jwt token passed in on certain endpoints
    var verifyToken = (req, res, next) => {
        const bearerHeader = req.headers['authorization'];
        const jwtSecret = getJwtSecret(decodeToken(bearerHeader).user.password);
        if (typeof bearerHeader !== 'undefined') {
            const bearerToken = bearerHeader.split(' ')[1];
            jwt.verify(bearerToken, jwtSecret, (err, authData) => {
            if (err) {
                returnError(res, 403, err.message);
            } else {
                next();
            }
            })
        } else {
            returnError(res, 403, 'Token is invalid')
        }
    }

    // retrieve the logged in user from token
    var decodeToken = (auth) => {
        return jwt.decode(auth.split(' ')[1]);
    }

    // function to check if user is associated with the film
    var checkFilmAddedByUser = async (req) => {
        let id = req.params.id;
        let addedBy = decodeUser(req.headers['authorization']);

        let film = await Film.find({_id: id, addedBy: addedBy});

        if (film.length === 0) return false
        else return true
    }

    // function to check id length
    var checkIdLength = (id) => {
        if (id.length !== 24) return false;
        else return true;
    }


    return {
        getJwtSecret,
        returnError,
        verifyToken,
        decodeToken,
        checkFilmAddedByUser,
        checkIdLength
    }
}
)();

module.exports = UTIL;