
const path = require('path');
const dotenv = require('dotenv').config({ path: path.join(__dirname, '../../.env') });;
const db = require('../../config/db');
const Games = require('../app/mlbgames/models/games.model');
const PlayByPLay = require('../app/mlbgames/models/plays.model');
async function seed(){

   await Games.deleteMany({}).then((res)=>{
       console.log("games deleted");
   });
   await PlayByPLay.deleteMany({}).then((res)=>{
    console.log("playbyplay deleted");
}   );
  
}
seed();