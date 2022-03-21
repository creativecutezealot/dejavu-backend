const path = require('path');
const dotenv = require('dotenv').config({ path: path.join(__dirname, '.env') });;

const express = require('express');
const app = express();
const http = require('http').createServer(app);
const port = process.env.PORT;
const version = 'v1';
const db = require('./config/db');
const io = require('socket.io')(http);
const fdClientModule = require('fantasydata-node-client');
const MlbGamesService = require('./src/app/mlbgames/mlbgames.service');
const NotificationsService = require("./src/app/notifications/notifications.service");
const PropBetsService = require('./src/app/prop-bets/prop-bets.service');

const sports_data_io_key = {
    'MLBv3ScoresClient': process.env.SPORTS_DATA_IO_KEY,
    'MLBv3StatsClient': process.env.SPORTS_DATA_IO_KEY,
    'MLBv3PlayByPlayClient': process.env.SPORTS_DATA_IO_KEY
};

const FantasyDataClient = new fdClientModule(sports_data_io_key);
global.__root = __dirname + '/';
app.use(express.static('public'));
app.use(require('body-parser').json());

app.use(function (req, res, next) {
    res.setHeader("Access-Control-Allow-Origin", "*"); // will change this in production
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, mbn-access-token");
    res.setHeader("Access-Control-Allow-Credentials", false);
    next();
});

app.get("/", (req, res) => {
    res.status(200).send("API " + version + ", You need an api key to access");
});
app.get("/" + version, (req, res) => {
    res.status(200).send("API " + version + ", You need an api key to access");
});

//Auth
app.use('/' + version, require('./src/app/auth/routes.config'));

//User balance
app.use('/' + version, require('./src/app/user_balance/routes.config'));

//PropBets Options
app.use('/' + version, require('./src/app/prop-bets-options/routes.config'));

//Users
app.use('/' + version, require('./src/app/users/routes.config'));

//Groups
app.use('/' + version, require('./src/app/groups/routes.config'));

//Batter
app.use('/' + version, require('./src/app/batters/routes.config'));

//Bets
app.use('/' + version, require('./src/app/bets/routes.config'));

//Contests
app.use('/' + version, require('./src/app/contests/routes.config'));

//PropBets
app.use('/' + version, require('./src/app/prop-bets/routes.config'));

app.get("/game-data", (req, res) => {
    res.status(200).send(require("./src/tasks/gamePlay.json"))
});


app.use("/", function (req, res, next) {
    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,Content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', false);

    // Pass to next layer of middleware
    if(req.method === 'OPTIONS') {
        res.sendStatus(204);
    }
    else {
        next();
    }
    
});

app.post("/save-game", (req, res, next) => { require("./src/tasks/save-game").saveGame(req, res, next)});
app.get("/get-game", (req, res, next) => { require("./src/tasks/save-game").getGame(req, res, next)});
app.get("/get-play", (req, res, next) => { require("./src/tasks/save-game").getPlay(req, res, next)});
app.post("/save-play", (req, res, next) => { require("./src/tasks/save-game").savePlay(req, res, next)});
app.post("/start-over", (req, res, next) => { require("./src/tasks/save-game").startOver(req, res, next)});
app.post("/start-over", (req, res, next) => { require("./src/tasks/save-game").startOver(req, res, next)});

//Socket Setup
io.on('connect', (socket) => {
    socket.on('disconnect', () => {
        socket.removeAllListeners();
    });
    //Connect MLB Game Service
    MlbGamesService.connectSocket(io,socket,FantasyDataClient);
    NotificationsService.connectSocket(io,socket);
    PropBetsService.connectSocket(io, socket);
});

//APP

app.use((req, res) => {
    return res.status(404).send("404 Not Found!");
});

http.listen(port, () => { console.log("Server started at port:" + port) })
