var mongoose = require('mongoose');  
const Schema = mongoose.Schema; 

var UserCurrencySchema = new mongoose.Schema({ 
  user: {type: Schema.Types.ObjectId, ref: 'User'},
  type: Number, // Transaction Type 1 credit 2 debit,
  currency_type: {type: Schema.Types.ObjectId, ref:"UserCurrencyType"},
  description: String,
  amount: Number,
  created_at: { type : Date, default: Date.now }, 
  updated_at: { type : Date, default: Date.now }
});
mongoose.model('UserCurrency', UserCurrencySchema,'user_currency');
module.exports = mongoose.model('UserCurrency');