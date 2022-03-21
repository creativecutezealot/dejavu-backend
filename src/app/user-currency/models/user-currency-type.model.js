var mongoose = require('mongoose');  

var UserCurrencyTypeSchema = new mongoose.Schema({ 
  name: {type: String },
  created_at: { type : Date, default: Date.now }, 
  updated_at: { type : Date, default: Date.now }
});
mongoose.model('UserCurrencyType', UserCurrencyTypeSchema,'user_currency_type');
module.exports = mongoose.model('UserCurrencyType');