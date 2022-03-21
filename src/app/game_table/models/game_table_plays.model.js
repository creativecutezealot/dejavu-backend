var mongoose = require('mongoose');  
const Schema = mongoose.Schema; 

var CheckWinnerSchema = new mongoose.Schema({
  status:Boolean,
  button_on:Boolean,
  button_pos:String
});

var GameTablePlaysScheme = new mongoose.Schema({ 
  games: {type: Schema.Types.ObjectId, ref: 'Games'},
  PlayID: Number,
  result:String,
  button_on: Boolean,
  button_pos: String,
  check_user_winner: CheckWinnerSchema,
  runner: Array,
  user_lose: Boolean,
  inning:Number,
  inningHalf:String,
  game_status: String,
  play_number:Number,
  created_at: { type : Date, default: Date.now }, 
  updated_at: { type : Date, default: Date.now }
});
mongoose.model('GameTablePlays', GameTablePlaysScheme,'game_table_plays');

module.exports = mongoose.model('GameTablePlays');