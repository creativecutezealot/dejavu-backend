var mongoose = require('mongoose');
const Schema = mongoose.Schema;

var GroupsSchema = new mongoose.Schema({
    user_id: { type: Schema.Types.ObjectId },
    name: { type:String,default:"" },
    status: { type: Boolean, default: false },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});
mongoose.model('Groups', GroupsSchema,'groups');

module.exports = mongoose.model('Groups');