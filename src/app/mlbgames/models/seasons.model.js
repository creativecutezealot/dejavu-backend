var mongoose = require('mongoose');  
const Schema = mongoose.Schema; 
var SeasonsSchema = new mongoose.Schema({ 
  Season: Number,
  RegularSeasonStartDate: {type: Date ,default: null},
  PostSeasonStartDate: {type: Date ,default: null},
  SeasonType: String,
  ApiSeason: String,
  created_at: { type : Date, default: Date.now }, 
  updated_at: { type : Date, default: Date.now }
});
mongoose.model('Seasons', SeasonsSchema,'game_season');

module.exports = mongoose.model('Seasons');