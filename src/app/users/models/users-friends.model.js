var mongoose = require('mongoose');
const Schema = mongoose.Schema;

var UsersFriendsSchema = new mongoose.Schema({
    user_id: { type: Schema.Types.ObjectId },
    user_friend_id: { type: Schema.Types.ObjectId },
    status: { type: Boolean, default: false },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});
mongoose.model('UsersFriends', UsersFriendsSchema,'users_friends');

module.exports = mongoose.model('UsersFriends');