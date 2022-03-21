const path = require('path');
const dotenv = require('dotenv').config({
  path: path.join(__dirname, '../../.env')
});
const db = require('../../config/db');
const Games = require('../app/mlbgames/models/games.model');
const Seasons = require('../app/mlbgames/models/seasons.model');
const Plays = require('../app/mlbgames/models/plays.model');
const GameTable = require('../app/game_table/models/game_table.model');
const BetsTable = require('../app/game_table/models/bets.model');
const GameTablePlay = require('../app/game_table/models/game_table_plays.model');
const moment = require('moment');
const momentTZ = require('moment-timezone');
const timezone = 'America/New_York';
const mongoose = require('mongoose');
const saveGame = (req, res, next) => {
  // console.log(req)
  let game = req.body;
  game.DateTime = momentTZ().tz(timezone);
  game.Day = momentTZ().tz(timezone);
  // game.LastPlay = null;
  Games.findOneAndUpdate({ ['GameID']: game.GameID }, { $set: game }, { upsert: true })
    .then((r) => {
      console.log(r);
      Games.findOne({ GameID: game.GameID })
      .then(async (data) => {
        res.statusCode = 200;
        return res.json({ message: 'success', data: data });
      })
      .catch((e) => {
        res.statusCode = 500;
        return res.json({ message: 'failed', error: e });
      });
    })
    .catch((error) => {
      console.log(error);
      res.statusCode = 200;
      return res.json({ error: error });
    });
};

const getGame = (req, res) => {
  let gameId = req.query.game_id ? req.query.game_id : undefined;
  Games.findOne({ GameID: gameId })
    .then(async (data) => {
      res.statusCode = 200;
      return res.json({ message: 'success', data: data });
    })
    .catch((e) => {
      res.statusCode = 500;
      return res.json({ message: 'failed', error: e });
    });
};

const savePlay = (req, res) => {
  let play = req.body.play;
  let gameId = req.body.gameId;
  if (gameId) {
    play.games = mongoose.Types.ObjectId(gameId);
    play.Updated = momentTZ().tz(timezone);

    Plays.updateOne({ PlayID: play.PlayID }, { $set: play }, { upsert: true })
      .then(() => {
        res.statusCode = 200;
        return res.json({ message: 'success' });
      })
      .catch((err) => {
        console.log(err)
        res.statusCode = 500;
        return res.json({ message: 'failed' });
      });
  } else {
    res.statusCode = 404;
    return res.json({ message: 'GameID not found' });
  }
};

const getPlay = (req, res) => {
  let gameId = req.query.game_id ? req.query.game_id : undefined;
  Plays.findOne({ games: gameId })
    .sort('-Updated')
    .then(async (data) => {
      res.statusCode = 200;
      return res.json({ message: 'success', data: data });
    })
    .catch((e) => {
      res.statusCode = 500;
      return res.json({ message: 'failed', error: e });
    });
}

const startOver = (req, res, next) => {
  BetsTable.deleteMany({ status: 1 }).then((r) => {
    console.log(r);
  });
  BetsTable.deleteMany({ status: 0 }).then((r) => {
    console.log(r);
  });
  GameTablePlay.deleteMany({ button_on: false }).then((r) => {
    console.log(r);
  });
  GameTablePlay.deleteMany({ button_on: true }).then((r) => {
    console.log(r);
  });
  Games.deleteMany({ Status: 'InProgress' }).then((r) => {
    console.log(r);
  });

  res.statusCode = 200;
  return res.json({ message: 'success' });
}

module.exports = {
  saveGame,
  getGame,
  savePlay,
  getPlay,
  startOver
};
