var mongoose = require('mongoose');
const database = process.env.DATABASE;
const port = process.env.DATABASE_PORT;
const ip = process.env.DATABASE_IP;
const username = process.env.DATABASE_USERNAME ? process.env.DATABASE_USERNAME : "";
const password = process.env.DATABASE_PASSWORD ? process.env.DATABASE_PASSWORD : "";
if (username != "" && password != "") {
    mongoose.connect("mongodb://" + username + ":" + password + "@" + ip + ":" + port + "/" + database + "?authSource=admin", { useNewUrlParser: true, useFindAndModify: false, useUnifiedTopology: true });
} else {
    mongoose.connect("mongodb://" + ip + ":" + port + "/" + database, { useNewUrlParser: true, useFindAndModify: false, useUnifiedTopology: true });
}