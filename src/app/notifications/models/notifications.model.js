var mongoose = require('mongoose');
const Schema = mongoose.Schema;

var NotificationsSchema = new mongoose.Schema({
    from_id: { type: Schema.Types.ObjectId },
    to_id: { type: Schema.Types.ObjectId },
    object_id : {type:Schema.Types.ObjectId},
    type: {type:String, default:""},   // friend request,
    message: {type:String, default:""},
    status: { type: Boolean, default: false },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});
mongoose.model('Notifications', NotificationsSchema,'notifications');

module.exports = mongoose.model('Notifications');