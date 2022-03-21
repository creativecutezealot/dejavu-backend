var mongoose = require('mongoose');  
const Schema = mongoose.Schema; 

var GameTableSchema = new mongoose.Schema({ 
  user: {type: Schema.Types.ObjectId, ref: 'User'},
  games: {type:Schema.Types.ObjectId, ref:'Games'},
  status: Number, //0 in progress 2 completed 3 cancelled
  max_pass_line_bets:{type:Number,default:0},
  total_last_passline:{type:Number,default:0},
  total_win:{type:Number,default:0},
  total_lose:{type:Number,default:0},
  created_at: { type : Date, default: Date.now }, 
  updated_at: { type : Date, default: Date.now }
});
mongoose.model('GameTable', GameTableSchema,'game_table');

module.exports = mongoose.model('GameTable');