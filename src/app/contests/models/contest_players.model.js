var mongoose = require('mongoose');  
const Schema = mongoose.Schema; 
var ContestPlayersSchema = new mongoose.Schema({
  user_id: { type: Schema.Types.ObjectId },
  contest_id: { type: Schema.Types.ObjectId },
  start_points: { type: Number, default: 0 },
  end_points: { type: Number, default: 0 },
  status: { type: Boolean, default: false },
  created_at: { type : Date, default: Date.now }, 
  updated_at: { type : Date, default: Date.now }
});
mongoose.model('ContestPlayers', ContestPlayersSchema);

module.exports = mongoose.model('ContestPlayers');