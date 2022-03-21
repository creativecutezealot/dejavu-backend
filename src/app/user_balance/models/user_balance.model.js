var mongoose = require('mongoose');
const Schema = mongoose.Schema;
var UserBalanceSchema = new mongoose.Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  type: Number, // Transaction Type 1 credit 2 debit
  description: String,
  amount: Number,
  result: String,
  PlayID: { type: Schema.Types.ObjectId, ref: 'Plays' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});
mongoose.model('UserBalance', UserBalanceSchema, 'user_balance');
module.exports = mongoose.model('UserBalance');