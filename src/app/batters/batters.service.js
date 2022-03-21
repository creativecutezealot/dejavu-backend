
var mongoose = require('mongoose');
const Batters = require('./batters.model')
class BattersService {
    static async getBatters(game_id) {
        if (game_id) {
            return await Batters.aggregate().match({ game_id: mongoose.Types.ObjectId(game_id) }).lookup({
                from: 'players',
                localField: 'player_id',
                foreignField: '_id',
                as: 'Player'
            }).unwind({
                'path': "$Player"
            }).sort({ order_number: 1 }).then(r => {
                return { message: 'success', data: r };
            }).catch(err => {
                return { message: "There was an error getting data", httpStatus: 500, success: false };
            });
        } else {
            return { message: "There was an error getting data", httpStatus: 500, success: false };
        }
    }
}

module.exports = BattersService;