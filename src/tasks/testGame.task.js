const path = require('path');
const dotenv = require('dotenv').config({
  path: path.join(__dirname, '../../.env')
});
const db = require('../../config/db');
const fdClientModule = require('fantasydata-node-client');
const sports_data_io_key = {
  MLBv3ScoresClient: process.env.SPORTS_DATA_IO_KEY,
  MLBv3StatsClient: process.env.SPORTS_DATA_IO_KEY,
  MLBv3PlayByPlayClient: process.env.SPORTS_DATA_IO_KEY
};
const FantasyDataClient = new fdClientModule(sports_data_io_key);
const Games = require('../app/mlbgames/models/games.model');
const Seasons = require('../app/mlbgames/models/seasons.model');
const Plays = require('../app/mlbgames/models/plays.model');
const axios = require('axios');
const _ = require('lodash');

const moment = require('moment');
const momentTZ = require('moment-timezone');
const timezone = 'America/New_York';
const mongoose = require('mongoose');
const io = require('socket.io-client');
const socket = io(`http://localhost:${process.env.PORT}`);
const gameData = require('./gameLogs.json');
function fetchGamesTest() {
  console.log('Fetching Games...');
  Seasons.findOne({}, async (err, season) => {
    // const date = momentTZ().tz(timezone).format('YYYY-MMM-DD').toUpperCase();
    // var gameId = Math.floor(Math.random() * 900000) + 100000;
    // await Games.find({ GameID: 99999 }).then(async (games) => {
    //   if (games.length > 0) {
    //     deleteGameDataTest();
    //     console.log('deleted')
    //   }
    // });

    // const gameData = require('../tests/gamesData').gamesData(gameId, date);
    if (_.isEmpty(gameData)) return;

    let game = gameData.games[0].data[0].Game;
    let play = gameData.games[0].data[0].Play;
    console.log(`Saving ${game.GameID} games in database...`);
    console.log(game.GameID);
    game.DateTime = momentTZ().tz(timezone);
    game.Day = momentTZ().tz(timezone);
    game.Outs = 0;
    game.Balls = 0;
    game.Strikes = 0;
    // game.LastPlay = null;
    await Games.updateOne(
      { ['GameID']: game.GameID },
      { $set: game },
      { upsert: true }
    ).then((res) => {
      return true;
    });

    return true;

    // setTimeout(async () => { await fetchGames() }, 600000); // every 10mins
  }).sort('-created_at');
}

function deleteGameDataTest(all = false) {
  const GameTable = require('../app/game_table/models/game_table.model');
  const BetsTable = require('../app/game_table/models/bets.model');
  const GameTablePlay = require('../app/game_table/models/game_table_plays.model');
  const Plays = require('../app/mlbgames/models/plays.model');
  if (all) {
    GameTable.deleteMany({ status: 1 }).then((r) => {
      console.log(r);
    });
    GameTable.deleteMany({ status: 0 }).then((r) => {
      console.log(r);
    });
    Plays.deleteMany({ InningHalf: 'T' }).then((r) => {
      console.log(r);
    });
    Plays.deleteMany({ InningHalf: 'B' }).then((r) => {
      console.log(r);
    });
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
    Games.deleteMany({ IsClosed: false }).then((r) => {
      console.log(r);
    });
    Games.deleteMany({ IsClosed: true }).then((r) => {
      console.log(r);
    });
  }

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
}

async function pullPlayByPlayTest(index = 0) {
  console.log('start checking...');
  // console.log(JSON.stringify(PlayByPlay))
  await Games.find({ GameID: 99999 }).then(async (games) => {
    // if (!_.isArray(games) || _.isEmpty(games)) {
    //   await new Promise((resolve) => setTimeout(resolve, 1e3));
    //   return true;
    // }
    
    if (games.length > 0) {
      let game = games[0];
      let game_id = game._id;
      
      console.log(game_id)
      console.log(`checking Game ${game.GameID}...`);

      let lastPlay = await Plays.findOne({
        games: mongoose.Types.ObjectId(game_id)
      })
        .sort('-PlayID')
        .then((data) => {
          return data;
        })
        .catch((err) => console.log(err));

      // socket.emit('distribute_play', { play: lastPlay, game: game });

      if (game.GameID == 99999) {
        // const PlayByPlay = require('../tests/playbyplay');
        // let games = PlayByPlay.Game;

        if (gameData.games[0].data.length > index) {
          let lastGame =
            index > 0 ? gameData.games[0].data[index - 1].Game : null;
          let lastGamePlay =
            index > 0 ? gameData.games[0].data[index - 1].Play : null;
          let newGame = gameData.games[0].data[index].Game;
          let play = gameData.games[0].data[index].Play;
          let pitches = gameData.games[0].data[index].Play.Pitches;
          console.log(
            `checking PlayID ${gameData.games[0].data[index].Play.PlayID}...`
          );

          if(index > 0) {
            console.log(gameData.games[0].data[index - 1].Game.RunnerOnFirst)
          }

          if (pitches.length > 0) {
            let playOuts = 0,
              balls = 0,
              strikeOuts = 0;
            // games.Outs = games.Outs;
            game.Balls = balls;
            game.Strikes = strikeOuts;
            // newGame.Inning = play.InningNumber;
            // newGame.InningHalf = play.InningHalf;
            game.LastPlay = index > 0 ? lastGamePlay.Description : null;
            
            await Games.findByIdAndUpdate(game_id, game).then((data) => {
              // games = data;
              return true;
            });
            // distributePlayByPlayTest();
            console.log('20s delay...');
            await new Promise((resolve) => setTimeout(resolve, 20e3));

            for (var p = 0; p < pitches.length; p++) {
              if (p < pitches.length - 1) {
                balls = pitches[p].Ball == true ? balls + 1 : balls;
                game.Balls = balls;
                strikeOuts =
                  pitches[p].Strike == true ? strikeOuts + 1 : strikeOuts;
                game.Strikes = strikeOuts;
                game.LastPlay = index > 0 ? lastGamePlay.Description : null;

                await Games.findByIdAndUpdate(game_id, game).then((data) => {
                  // games = data;
                  return true;
                });
                // distributePlayByPlayTest();
                console.log('5s delay...');
                await new Promise((resolve) => setTimeout(resolve, 5e3));
                console.log('PitchID: ' + pitches[p].PitchID);
              } else {
                balls = pitches[p].Ball == true ? balls + 1 : balls;
                newGame.Balls = balls;
                strikeOuts =
                  pitches[p].Strike == true ? strikeOuts + 1 : strikeOuts;
                newGame.Strikes = strikeOuts;
                newGame.Outs = play.Outs + play.NumberOfOutsOnPlay == 3 ? 0 : play.Outs + play.NumberOfOutsOnPlay ;
                newGame.LastPlay = play.Description;
                newGame.DateTime = momentTZ().tz(timezone);
                newGame.Day = momentTZ().tz(timezone);
                await Games.findByIdAndUpdate(game_id, newGame).then((data) => {
                  // games = data;
                  return true;
                });

                play.games = mongoose.Types.ObjectId(game_id);

                await Plays.updateOne(
                  { PlayID: play.PlayID },
                  { $set: play },
                  { upsert: true }
                )
                  .then((res) => {
                    return true;
                  })
                  .catch((err) => {
                    console.log(
                      'Could not get play by play, please try again.'
                    );
                  });

                // distributePlayByPlayTest();

                console.log('PlayByPlay Done... 10s delay...');
              }
            }

            await new Promise((resolve) => setTimeout(resolve, 2e3));
            pullPlayByPlayTest((index += 1));
          }

          
        } else {
          deleteGameDataTest();
          await new Promise((resolve) => setTimeout(resolve, 30e3));
          fetchGamesTest();
          console.log('RESET');
          await new Promise((resolve) => setTimeout(resolve, 5e3));
          pullPlayByPlayTest();
        }
      }
    } else {
      pullPlayByPlayTest();
    }

    // await new Promise((resolve) => setTimeout(resolve, 5e3));
    // await pullPlayByPlayTest(index);
  });
}

async function distributePlayByPlayTest() {
  // await Games.find({ GameID: 99999 }).then(async (data) => {
  //   if (!_.isEmpty(data)) {
  //     for (i = 0; i < data.length; i++) {
  //       let game = data[i];
  //       await Plays.findOne({ games: mongoose.Types.ObjectId(game._id) })
  //         .sort('-PlayID')
  //         .then(async (data) => {
  //           await socket.emit('distribute_play', { play: data, game: game });
  //         });
  //     }
  //   }
  // });

  // setTimeout(() => distributePlayByPlayTest(), 1e3);

  const dStart = momentTZ().tz(timezone).subtract(5, 'hours');

  await Games.find({
    DateTime: { $gte: dStart.format('LLL') },
    Status: { $in: ['InProgress', 'Final'] }
  })
    .sort({ DateTime: -1 })
    .then(async (data) => {
      if (!_.isEmpty(data)) {
        console.log("Games:")
        console.log(data.length)
        for (i = 0; i < data.length; i++) {
          const game = data[i];

          await Plays.findOne({ games: mongoose.Types.ObjectId(game._id) })
            .sort('-created_at')
            .then(async (data) => {
              await socket.emit('distribute_play', { play: data, game: game });
            });
        }
      }
    });

  setTimeout(() => distributePlayByPlayTest(), 1e3);
}

async function run() {
  // deleteGameDataTest(true);
  // console.log('Data Deleted');
  // await new Promise((resolve) => setTimeout(resolve, 2e3));
  // await fetchGamesTest();
  // await new Promise((resolve) => setTimeout(resolve, 2e3));
  // console.log('Done Fetch Game');
  // pullPlayByPlayTest();
  // console.log('Done Fetch Play');
  // await new Promise((resolve) => setTimeout(resolve, 2e3));
  distributePlayByPlayTest();
  console.log('Done Fetch Distribute');
}

run();
