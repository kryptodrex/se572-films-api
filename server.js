const app = require("./app");

app.listen(3001, () => {
    console.log("Running on port 3001");
    console.log("--------------------");
});

const { DB_URI } = require("./src/config");
const mongoose = require('mongoose');
mongoose.connect(DB_URI);