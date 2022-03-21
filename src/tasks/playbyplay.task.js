const mongoose = require('mongoose');
const moment = require('moment');
const momentTZ = require('moment-timezone');
const path = require('path');
const dotenv = require('dotenv').config({
  path: path.join(__dirname, '../../.env')
});
const _ = require('lodash');

const db = require('../../config/db');
const fdClientModule = require('fantasydata-node-client');
const sports_data_io_key = {
  MLBv3ScoresClient: process.env.SPORTS_DATA_IO_KEY,
  MLBv3StatsClient: process.env.SPORTS_DATA_IO_KEY,
  MLBv3PlayByPlayClient: process.env.SPORTS_DATA_IO_KEY
};
const FantasyDataClient = new fdClientModule(sports_data_io_key);
const Games = require('../app/mlbgames/models/games.model');
const Plays = require('../app/mlbgames/models/plays.model');

const io = require('socket.io-client');
const socket = io(`http://localhost:${process.env.PORT}`);

const axios = require('axios');

const timezone = 'America/New_York';

var total_items = 0;
var total_done = 0;
var in_progress = false;

const fs = require('fs');
async function fetchPlayByPlay() {
  if (in_progress == false) {
    total_done = 0;
    console.log(moment(new Date()).format() + ' Start checking..');
    in_progress = true;
    await Games.find({ Status: 'InProgress' })
      .sort('-GameID')
      .then(async (games) => {
        total_items = games.length;
        for (var i = 0; i < games.length; i++) {
          const game = games[i];
          onPlayByPlaySave(FantasyDataClient, game);
        }
        return true;
      });
  }
  if (total_done == total_items) {
    console.log(moment(new Date()).format() + ' Done checking..');
    total_done = 0;
    in_progress = false;
  }
  setTimeout(async () => {
    await fetchPlayByPlay();
  }, 1000);
}

async function onPlayByPlaySave(FantasyDataClient, game) {
  const game_id = game._id;

  return await FantasyDataClient.MLBv3PlayByPlayClient.getPlayByPlayPromise(
    game.GameID
  )
    .then(async (data) => {
      const PlayByPlay = JSON.parse(data);
      const games = PlayByPlay.Game;
      const plays = PlayByPlay.Plays;
      Games.findByIdAndUpdate(game_id, games).then((data) => {
        return true;
      });
      if (plays) {
        const last_play_new = plays[plays.length - 1];
        const last_play = await Plays.findOne({
          games: mongoose.Types.ObjectId(game_id)
        })
          .sort('-PlayID')
          .then((data) => {
            return data;
          })
          .catch((err) => console.log(err));

        var new_play = false;
        if (!last_play) {
          new_play = true;
        } else {
          if (last_play.PlayID != last_play_new.PlayID) {
            new_play = true;
          }
        }

        if (new_play == true) {
          console.log('New Play ' + game_id + ' = ' + plays.length);

          for (var i = 0; i < plays.length; i++) {
            const play = plays[i];
            play.games = mongoose.Types.ObjectId(game_id);

            await Plays.findOne({ PlayID: play.PlayID }).then(
              async (play_result) => {
                if (!play_result) {
                  await Plays.create(play)
                    .then((data) => {
                      return true;
                    })
                    .catch((err) => {
                      console.log(
                        'Could not get play by play, please try again.'
                      );
                      return false;
                    });
                } else {
                  await Plays.findByIdAndUpdate(play_result._id, play)
                    .then((data) => {
                      return true;
                    })
                    .catch((err) => {
                      console.log(
                        'Could not get play by play, please try again.'
                      );
                      return false;
                    });
                }
              }
            );
          } //end for
        }
      }
      total_done++;
    })
    .catch((err) => {
      console.log('FantasyDataClient error:');
      console.log(err);
      total_done++;
    });
} //end

// fetchPlayByPlay();

async function pullPlayByPlay() {
  // console.log('start checking...');

  const dNow = momentTZ().tz(timezone);
  const dStart = momentTZ().tz(timezone).subtract(5, 'hours');

  // console.log(`Games from ${moment(dStart).format('LLL')}; Current time: ${moment(dNow).format('LLL')}`);

  await Games.find({
    DateTime: { $gte: dStart.format('LLL'), $lte: dNow.format('LLL') },
    Status: { $nin: ['Final', 'Postponed', 'Canceled'] }
  })
    .sort({ DateTime: 1 })
    .then(async (games) => {
      // console.log(`Fetched ${games.length} games...`);

      if (!_.isArray(games) || _.isEmpty(games)) {
        await new Promise((resolve) => setTimeout(resolve, 1e3));
        return true;
      }

      for (var i = 0; i < games.length; i++) {
        const game = games[i];
        const game_id = game._id;

        // console.log(`checking Game ${game.GameID}...`);

        const lastPlay = await Plays.findOne({
          games: mongoose.Types.ObjectId(game_id)
        })
          .sort('-PlayID')
          .then((data) => {
            return data;
          })
          .catch((err) => console.log(err));

        // socket.emit('distribute_play', { play: lastPlay, game: game });

        // await FantasyDataClient.MLBv3PlayByPlayClient.getPlayByPlayPromise(game.GameID)
        // .then(async (data) => {
        axios
          .get(
            `https://api.sportsdata.io/v3/mlb/pbp/json/PlayByPlay/${game.GameID}?key=${process.env.SPORTS_DATA_IO_KEY}`
          )
          .then(async (data) => {
            if (!data) return true;

            // const PlayByPlay = JSON.parse(data);
            let PlayByPlay = data.data;
            let games = PlayByPlay.Game;
            const plays = PlayByPlay.Plays;
            if (games && games.AwayTeam == 'SF') {
              console.log(`Date: ${moment(games.DateTime).format('LLL')}`);
              console.log(`Inning: ${games.Inning} ${games.InningHalf}`);
              console.log(`Teams: ${games.AwayTeam}-${games.HomeTeam}`);
              console.log(`Balls: ${games.Balls}`);
              console.log(`Strikes: ${games.Strikes}`);
              console.log(`Outs: ${games.Outs}`);
              console.log(`Status: ${games.Status}`);
              console.log(`GameID: ${games.GameID}`);
              // console.log(`Status: ${games.Status}`)
            }

            await Games.findByIdAndUpdate(game_id, games).then((data) => {
              games = data;
              return true;
            });

            if (!_.isEmpty(plays)) {
              const latestPlay = plays[plays.length - 1];
              if (games.AwayTeam == 'SF') {
                console.log(`Hitter: ${latestPlay.HitterName}`);
                console.log(`Pitcher: ${latestPlay.PitcherName}`);
                console.log(`Description: ${latestPlay.Description}`);
                console.log(`Description: ${latestPlay.Result}`);
                console.log(`RunnerOnFirst: ${games.RunnerOnFirst}`);
              }

              if (!lastPlay || lastPlay.PlayID != latestPlay.PlayID) {
                // console.log(`New Play for Game(${games.GameID});total=${plays.length}`);

                await Promise.all(
                  plays.map(async (play) => {
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
                  })
                );

                // socket.emit('distribute_play', { play: latestPlay, game: games });
              }
            }
          })
          .catch((err) => {
            console.log('FantasyDataClient error:');
            console.log(err);
          });
        // console.log('Timeout loop')
        await new Promise((resolve) => setTimeout(resolve, 2e3));
      }
    });

  // console.log('Done checking...\n');

  await pullPlayByPlay();
}

async function distributePlayByPlay() {
  const dStart = momentTZ().tz(timezone).subtract(5, 'hours');

  await Games.find({
    DateTime: { $gte: dStart.format('LLL') },
    Status: { $in: ['InProgress', 'Final'] }
  })
    .sort({ DateTime: 1 })
    .then(async (data) => {
      if (!_.isEmpty(data)) {
        for (i = 0; i < data.length; i++) {
          const game = data[i];

          await Plays.findOne({ games: mongoose.Types.ObjectId(game._id) })
            .sort('-PlayID')
            .then(async (data) => {
              await socket.emit('distribute_play', { play: data, game: game });
            });
        }
      }
    });

  setTimeout(() => distributePlayByPlay(), 1e3);
}

async function pullPlayByPlayStoreToJson() {
  let GameID = 60852; //60811
  let jsonPath = __dirname + '/gamePlay.json';
  let playJson = fs.readFileSync(jsonPath);
  //   console.log(JSON.parse(playJson));
  let gameJson = JSON.parse(playJson);
  let hasGame = gameJson.games.findIndex((x) => x.gameId == GameID);
  console.log('checking gameId...');
  if (hasGame == -1) {
    gameJson.games.push({
      gameId: GameID,
      data: []
    });

    let c = JSON.stringify(gameJson);
    fs.writeFileSync(jsonPath, c);
  }

  console.log('fetching play...');
  await axios
    .get(
      `https://api.sportsdata.io/v3/mlb/pbp/json/PlayByPlay/${GameID}?key=${process.env.SPORTS_DATA_IO_KEY}`
    )
    .then(async (data) => {
      if (!data) return true;
      let Game = data.data.Game;
      let Play = data.data.Plays;
      let i = gameJson.games.findIndex((x) => x.gameId == GameID);
      if (i != -1 && Play.length > 0) {
        console.log('checking play if exist...');
        console.log(Play[Play.length - 1].PlayID);
        console.log(
          gameJson.games[i].data.findIndex(
            (x) => x.PlayId == Play[Play.length - 1].PlayID
          )
        );

        let hasPlayRecorded =
          gameJson.games[i].data && gameJson.games[i].data
            ? gameJson.games[i].data.findIndex(
                (x) => x.Play.PlayID == Play[Play.length - 1].PlayID
              )
            : -1;

        let gameLength = gameJson.games[i].data.length;
        let isUpdated = gameJson.games[i].data && gameJson.games[i].data
          && gameLength > 1 ? gameJson.games[i].data[gameLength - 1].Game.Outs == Game.Outs && gameJson.games[i].data[gameLength - 1].Game.Strikes == Game.Strikes && gameJson.games[i].data[gameLength - 1].Game.Balls == Game.Balls
          : false;
          console.log("isUpdated: "+ isUpdated)
          console.log("hasRecorded: "+ hasPlayRecorded)
          if(gameLength > 1) {
          console.log('Outs: '+ gameJson.games[i].data[gameLength - 1].Game.Outs + " - " + Game.Outs)
          console.log('Balls: '+ gameJson.games[i].data[gameLength - 1].Game.Balls + " - " + Game.Balls)
          console.log('Strikes: '+ gameJson.games[i].data[gameLength - 1].Game.Strikes + " - " +Game.Strikes)
          }
        if (hasPlayRecorded == -1 || isUpdated == false) {
          console.log('writing play...');
          gameJson.games[i].data.push({
            Game: data.data.Game,
            Play: Play[Play.length - 1]
          });
          let p = JSON.stringify(gameJson);
          fs.writeFileSync(jsonPath, p);
        } else {
          console.log('play exists.');
        }

      } else {
        console.log('No play yet.');
      }
    })
    .catch((err) => {
      console.log('FantasyDataClient error:');
      console.log(err);
    });

  setTimeout(() => pullPlayByPlayStoreToJson(), 2e3);
}

// pullPlayByPlay();
// distributePlayByPlay();

pullPlayByPlayStoreToJson();
