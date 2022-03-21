const path = require('path');
const dotenv = require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const db = require('../../config/db');
const fdClientModule = require('fantasydata-node-client');
const sports_data_io_key = {
    'MLBv3ScoresClient':process.env.SPORTS_DATA_IO_KEY,
    'MLBv3StatsClient':process.env.SPORTS_DATA_IO_KEY,
    'MLBv3PlayByPlayClient':process.env.SPORTS_DATA_IO_KEY
};
const FantasyDataClient = new fdClientModule(sports_data_io_key);
const Teams = require("../app/mlbgames/models/teams.model");

function fetchTeams(){
    Teams.deleteMany({}).then((res)=>{});
    FantasyDataClient.MLBv3ScoresClient.getTeamsAllPromise().then(async resp=>{
        const data = JSON.parse(resp);
        Teams.create(data,(err,data)=>{
            if(err){
                console.log(err);
                return false;
            }
            console.log("Done fetching team...");
            process.exit(0);
        });
    }).catch(err=>{
        console.log(err);
    })
}

fetchTeams();