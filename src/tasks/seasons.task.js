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
const Seasons = require('../app/mlbgames/models/seasons.model');

async function fetchSeasons(){
     console.log("Fetching Seasons...");
     FantasyDataClient.MLBv3StatsClient.getCurrentSeasonPromise().then(async (data)=>{
            const json_data = JSON.parse(data);
            return await Seasons.findOne(json_data).then( async (data)=>{
               if(!data){
                   return await Seasons.create(json_data).then((season)=>{
                        
                        console.log("Fetching Seasons Completed");
                        return true;
                    }).catch(err=>{
                        console.log(err);
                    });
               }else{
                 console.log("Fetching Seasons Completed, Season Already Exist");
                
               }
            }).catch(err=>{
                console.log(err);
            });
    }).catch((error)=>{
        console.log(error);
        //process.exit();
    });
}




/*
inProgress = false;
function run(){
    if(inProgress==false){
     inProgress = true;
     fetchSeasons();
     inProgress = false;
     setTimeout(,(1000 * 60 * 4));
    }
   
 }*/
 
async function run(){
    fetchSeasons();
    return await new Promise((resolve)=>setTimeout(()=>{
        run();
        resolve();
    },(1000 * 60 * 60 * 4)))
}

run();

