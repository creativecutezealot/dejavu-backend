var mongoose = require('mongoose');  
const Schema = mongoose.Schema; 
var ContestSchema = new mongoose.Schema({
  name: String,
  user_id: { type: Schema.Types.ObjectId },
  group_id: { type: Schema.Types.ObjectId },
  status: { type: Boolean, default: false },
  start_date: {type: Date, default:null},
  end_date: {type: Date, default:null},
  created_at: { type : Date, default: Date.now }, 
  updated_at: { type : Date, default: Date.now }
});
mongoose.model('Contest', ContestSchema);

module.exports = mongoose.model('Contest');