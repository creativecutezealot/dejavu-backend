var mongoose = require('mongoose');
const Schema = mongoose.Schema;

var GroupsMembersSchema = new mongoose.Schema({
    group_id: { type: Schema.Types.ObjectId },
    user_id: { type: Schema.Types.ObjectId },
    status: { type: Boolean, default: false },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});
mongoose.model('GroupsMembers', GroupsMembersSchema,'groups_members');

module.exports = mongoose.model('GroupsMembers');