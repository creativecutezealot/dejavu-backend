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

const axios = require('axios');
const _ = require('lodash');

const moment = require('moment');
const momentTZ = require('moment-timezone');
const timezone = 'America/New_York';

function fetchGames() {
  console.log('Fetching Games...');

  Seasons.findOne({}, async (err, season) => {
    const date = momentTZ().tz(timezone).format('YYYY-MMM-DD').toUpperCase();

    await axios
      .get(`https://api.sportsdata.io/v3/mlb/scores/json/GamesByDate/${date}`, {
        headers: { 'Ocp-Apim-Subscription-Key': process.env.SPORTS_DATA_IO_KEY }
      })
      .then(async ({ data }) => {
        if (_.isEmpty(data)) return;

        console.log(`Saving ${data.length} games in database...`);

        for (var i = 0; i < data.length; i++) {
          let game = data[i];

          console.log(game.GameID);

          await Games.updateOne(
            { ['GameID']: game.GameID },
            { $set: game },
            { upsert: true }
          ).then((res) => {
            return true;
          });
        }

        return true;
      })
      .catch((err) => {
        console.log('FantasyDataClient error:');
        console.log(err);
      });

    setTimeout(async () => {
      await fetchGames();
    }, 600000); // every 10mins

    // await FantasyDataClient.MLBv3ScoresClient.getSchedulesPromise(season.ApiSeason).then(async (data) => {
    //     const json_data = JSON.parse(data);

    //     for(var i=0;i<json_data.length;i++){
    //         let game = json_data[i];

    //         await Games.updateOne({['GameID']: game.GameID}, {$set: game}, {upsert: true}).then(res => {
    //             return true;
    //         });

    //         // await Games.findOne({'GameID':game.GameID}).then(async (gr)=>{
    //         //     if(!gr){
    //         //         return await Games.create(game).then(data =>{
    //         //             console.log("Successfully Added: "+data.GameID);
    //         //             return true;
    //         //         });
    //         //     }else{
    //         //         return await Games.findByIdAndUpdate(gr._id,{Status:game.Status}).then(data=>{
    //         //             return true;
    //         //         });
    //         //     }
    //         // });
    //     }

    //     console.log("Fetch Games Completed.");
    //     // await fetchGames();
    //     return true;
    // }).catch(async (err) => {
    //     console.log('FantasyDataClient error:')
    //     console.log(err);
    //     // await fetchGames();
    // });

    // setTimeout(async () => { await fetchGames() }, 600000); // every 10mins
    // // await fetchGames()

    // return true;
  }).sort('-created_at');
}

fetchGames();

async function checkAnyGamesInProgress() {
  return await Games.findOne({ Status: 'InProgress' }).then(async (data) => {
    //console.log(data);
    if (!data) {
      return await FantasyDataClient.MLBv3ScoresClient.getAreGamesInProgressPromise().then(
        async (data) => {
          if (data == true || data == 'true') {
            await fetchGames();
          }
          console.log('[' + new Date() + '] ' + data);
          return await checkAnyGamesInProgress();
          // return true;
        }
      );
    }
  });
}

//checkAnyGamesInProgress();
