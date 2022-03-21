var mongoose = require('mongoose');
const Schema = mongoose.Schema;

var PropBetsOptionsSchema = new mongoose.Schema({
  key: { type: String },
  section: { type: String },
  parent_key: { type: String },
  name: { type: String },
  is_separator: { type: Boolean, default: false },
  ordering: { type: Number },
  created_at: { type : Date, default: Date.now }, 
  updated_at: { type : Date, default: Date.now }
});
mongoose.model('PropBetsOptions', PropBetsOptionsSchema, 'prop_bets_options');

module.exports = mongoose.model('PropBetsOptions');