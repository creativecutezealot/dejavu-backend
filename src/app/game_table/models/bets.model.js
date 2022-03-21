var mongoose = require('mongoose');  
const Schema = mongoose.Schema; 
// var FirstToHomePlayerSchema = new mongoose.Schema({
//   HitterID: Number,
//   FirstName: String,
//   LastName: String,
//   PhotoUrl: String
// });

var BetsSchema = new mongoose.Schema({ 
  user: {type: Schema.Types.ObjectId, ref: 'User'},
  game_table: {type: Schema.Types.ObjectId, ref: 'GameTable'},
  place: String,
  amount: Number,
  status: Number, // Pending
  win: Boolean, 
  innings: Number,
  last_selected_chip:Number,
  win_amount:Number,
  button_on:Boolean,
  plays:{type: Schema.Types.ObjectId, ref: 'Plays'},
  history: Array,
  button_pos:{type:String,default:""},
  isOdds: {type:Boolean,default: false},
  number_of_outs:{type:Number,default:0},
  odds_counter: {type:Number,default:0},
  batterCount: {type:Number,default:0},
  first_to_home_player: String,
  first_to_home_id: Number,
  isPassLine:{type: Boolean, default: false},
  created_at: { type : Date, default: Date.now }, 
  updated_at: { type : Date, default: Date.now }
});
mongoose.model('Bets', BetsSchema,'bets');

module.exports = mongoose.model('Bets');