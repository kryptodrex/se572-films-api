let DB_URI = "mongodb://10.0.0.38:27017/filmDb"

if (process.env.MONGO_DB_URI) {
    DB_URI = process.env.MONGO_DB_URI
}

module.exports = {
    DB_URI
};