
const path = require('path');
const dotenv = require('dotenv').config({ path: path.join(__dirname, '../../.env') });;
const db = require('../../config/db');
const UserBalance = require('../app/user_balance/models/user_balance.model');
const Bets = require('../app/game_table/models/bets.model');
const GameTable = require('../app/game_table/models/game_table.model');
const GameTablePlays = require('../app/game_table/models/game_table_plays.model');
async function seed(){

   await Bets.deleteMany({}).then((res)=>{
       console.log("bets deleted");
   });
   await GameTable.deleteMany({}).then((res)=>{
    console.log("game table deleted");
   });
   await GameTablePlays.deleteMany({}).then((res)=>{
    console.log("game table plays deleted");
   });   
   await UserBalance.deleteMany({description:{"$ne":"Free Credit"}}).then((result)=>{
    console.log("user balance deleted");
            process.exit(0);   
    });
}
seed();