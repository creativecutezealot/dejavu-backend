var mongoose = require('mongoose');
const Schema = mongoose.Schema;
var UserSchema = new mongoose.Schema({
  first_name: String,
  last_name: String,
  email: String,
  display_name: String,
  status: Number, //1 active 0 inactive
  level: { type: Number, default: 1 },
  password: String,
  user_type: Number,
  fcm_token: { type: String, default: "" },
  reset_code: { type: String, default: "" },
  last_login: { type: Date, default: Date.now },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});
mongoose.model('User', UserSchema);

module.exports = mongoose.model('User');