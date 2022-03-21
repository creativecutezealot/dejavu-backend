var mongoose = require('mongoose');
const Schema = mongoose.Schema;

var PropbetsSchema = new mongoose.Schema({
    is_freestyle: { type: Boolean, default: false },
    to_win: { type: Number, default: 0 },
    event: { type: String },
    judge: { type: Schema.Types.ObjectId },
    game_id: { type: Schema.Types.ObjectId },
    inning: { type: Number},
    inningHalf: { type: String },
    homeTeamScore: { type: Number },
    awayTeamScore: { type: Number },
    currentHitter: { type: String },
    user_id: { type: Schema.Types.ObjectId },
    receiver_id: { type: Schema.Types.ObjectId },
    player_team_options: { type: Object },
    will_result_in: { type: String },
    with_timeframe: { type: String },
    proposed_odds: { type: String },
    bet_amount: { type: Number, default: 0 },
    max_takers: { type: Number, default: 0 },
    status: { type: Number, default: 0 },
    all_watching_game: { type: Boolean, default: false },
    to_friend: { type: Boolean, default: false },
    to_groups: { type: Boolean, default: false },
    type: { type: Number, default: 0 },
    comment: { type: String },
    started_at: { type: Date },
    ended_at: { type: Date }, 
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});
mongoose.model('Propbets', PropbetsSchema, 'prop_bets');

module.exports = mongoose.model('Propbets');