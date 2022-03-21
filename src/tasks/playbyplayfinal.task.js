const mongoose = require('mongoose');
const moment = require('moment');
const path = require('path');
const dotenv = require('dotenv').config({ path: path.join(__dirname, '../../.env') });;
const db = require('../../config/db');
const fdClientModule = require('fantasydata-node-client');
const sports_data_io_key = {
    'MLBv3ScoresClient':process.env.SPORTS_DATA_IO_KEY,
    'MLBv3StatsClient':process.env.SPORTS_DATA_IO_KEY,
    'MLBv3PlayByPlayClient':process.env.SPORTS_DATA_IO_KEY
};
const FantasyDataClient = new fdClientModule(sports_data_io_key);
const Games = require("../app/mlbgames/models/games.model");
const GameTable = require("../app/game_table/models/game_table.model");
const Bets = require("../app/game_table/models/bets.model");
const Plays = require("../app/mlbgames/models/plays.model");

const MlbGamesService = require('../app/mlbgames/mlbgames.service');


async function fetchPlayByPlay(){
 console.log(moment(new Date()).format()+" Start checking..");
  const result = await Games.find({Status:"Final"}).sort('-GameID').then(async (games)=>{
  //const result = await Games.find({GameID:"56674"}).exec().then(async (games)=>{
    for(var i=0;i<games.length;i++){
       const game = games[i];
       const hasPlays  = await Plays.findOne({games:game._id}).then(data=>{
            if(data){
                return true;
            }   

            return false;
       })
       if(!hasPlays){
        const result = await onPlayByPlaySave(FantasyDataClient,game._id);
       }
       console.log(game.GameID);
    }   
    return true;
});

  console.log(moment(new Date()).format()+" Done checking..");
}

var inProgress = false;

async function onPlayByPlaySave(FantasyDataClient, game_id) {

    console.log("fetching play by play a");
   return await Games.findById(game_id).then( async last_game => {
        console.log("fetching play by play b");
      return await FantasyDataClient.MLBv3PlayByPlayClient.getPlayByPlayPromise(last_game.GameID).then(async (data) => {
            const PlayByPlay = JSON.parse(data);
            const games = PlayByPlay.Game;
            const plays = PlayByPlay.Plays;
            console.log("fetching play by play c");

            const last_update = moment(last_game.Updated).format("YYYY-MM-DDTHH:mm:ss");
            const curr_update = games.Updated;
           //if (last_update != curr_update) {
                console.log("fetching play by play d");
               /* if(games.GameID==56674 && games.Status!="Final"){
                    games.Status = "InProgress";
                }*/


               
    

              return await Games.findByIdAndUpdate(game_id, games, async (err, curr_game) => {
                    for (var i = 0; i < plays.length; i++) {
                        const play = plays[i];
                        play.games = mongoose.Types.ObjectId(game_id);
                        //console.log(play.InningNumber);
                        await Plays.findOne({ PlayID: play.PlayID }, async (err, play_result) => {

                            if (!play_result) {

                                await Plays.create(play, (err, data) => {
                                    if (err) {
                                        console.log("Could not get play by play, please try again." )
                                        return false;
                                    }
                                    
                                    return true;
                                });
                            } else {

                                await Plays.findByIdAndUpdate(play_result._id, play, (err, data) => {
                                    if (err) {
                                        console.log("Could not get play by play, please try again." )
                                        return false;
                                    }
                                    return true;
                                    
                                });
                            }
                        });


                    }//end for

                    return true;
                  

                });

           // }//end play by play curr update

        }).catch((err) => {
            console.log(err);
            
        });
    });


}//end


//fetchPlayByPlay();
/*
setInterval(()=>{
    if(inProgress==false){
        inProgress = true;
         fetchPlayByPlay();
     inProgress = false;
    }
},(1000 * 5));*/

async function run(){
   // if(inProgress==false){
     //   inProgress = true;
     await fetchPlayByPlay();
    // process.exit(0);
     //inProgress = false;
   // }
    /*return await new Promise((resolve)=>setTimeout(()=>{
        run();
        resolve();
    },(1000 * 1)))*/
}

run();
