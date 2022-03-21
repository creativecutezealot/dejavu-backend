var mongoose = require('mongoose');
const Schema = mongoose.Schema;

var PropbetsPlayerSchema = new mongoose.Schema({
    user_id: { type: Schema.Types.ObjectId },
    propbet_id: { type: Schema.Types.ObjectId },
    start_diamonds: { type: Number, default: 0 },
    end_diamonds: { type: Number, default: 0 },
    status: { type: Boolean, default: false },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});
mongoose.model('PropbetsPlayers', PropbetsPlayerSchema, 'prop_bets_players');

module.exports = mongoose.model('PropbetsPlayers');