const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var BatterSchema = new mongoose.Schema({
    game_id: {type: Schema.Types.ObjectId, default:null},
    player_id: {type: Schema.Types.ObjectId, default:null},
    order_number: { type : Number, default: 0 },
    created_at: { type : Date, default: Date.now }, 
    updated_at: { type : Date, default: Date.now }
})

mongoose.model('Batters', BatterSchema, 'batters');

module.exports = mongoose.model('Batters');