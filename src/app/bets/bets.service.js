
var mongoose = require('mongoose');
const Bets = require('../game_table/models/bets.model');
class BetsService {

    static async deleteBet(param, user_id) {
        // return { message: 'Bet deleted.', status: user_id };
        return await Bets.deleteMany({
            user: user_id,
            game_table: param.game_table,
            place: param.place
        })
            .then(async (data) => {
                return { message: 'Bet deleted.', status: "success" };
            })
            .catch((err) => {
                return { message: "There was an error deleting data", httpStatus: 500, success: false };
            });
    }

    static async getBets(param, user_id) {
        // return { user: user_id, status: param.game_table };
        return await Bets.find({
            user: user_id,
            game_table: param.game_table
        })
            .then(async (data) => {
                return { message: 'Bet results.', status: "success", data: data };
            })
            .catch((err) => {
                return { message: "There was an error getting data", httpStatus: 500, success: false };
            });
    }
}

module.exports = BetsService;