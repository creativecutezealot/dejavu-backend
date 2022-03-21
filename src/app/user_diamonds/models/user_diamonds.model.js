var mongoose = require('mongoose');
const Schema = mongoose.Schema;
var UserDiamondsSchema = new mongoose.Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  type: Number, // Transaction Type 1 credit 2 debit
  description: String,
  amount: Number,
  propbet_id: { type: Schema.Types.ObjectId, ref: 'Propbets' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});
mongoose.model('UserDiamonds', UserDiamondsSchema, 'user_diamonds');
module.exports = mongoose.model('UserDiamonds');