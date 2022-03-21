var mongoose = require('mongoose');  
const Schema = mongoose.Schema; 
var MlbConversionSchema = new mongoose.Schema({ 
  from: String, 
  to:String,
  check_desc:Boolean,
  comments: String
});
mongoose.model('MlbConversion', MlbConversionSchema,'mlb_conversion');

module.exports = mongoose.model('MlbConversion');