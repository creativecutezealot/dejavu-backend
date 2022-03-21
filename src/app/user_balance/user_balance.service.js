const UserBalance = require('./models/user_balance.model');
const mongoose = require('mongoose');
class UserBalanceService {
    static async getBalance(user_id) {
        const remaining = await UserBalance.aggregate().match({
            user: mongoose.Types.ObjectId(user_id),
        }).group({
            _id: {
                type: "$type"
            },
            total: {
                "$sum": "$amount"
            }
        }).exec().then((data) => {
            var total_credit = 0;
            var total_debit = 0;
            data.forEach(item => {
                if (item._id.type == 1) {
                    total_credit = item.total;
                }
                if (item._id.type == 2) {
                    total_debit = item.total;
                }
            });
            const remaining = total_credit - total_debit;
            return {
                remaining: remaining
            };
        }).catch((err) => {
            return {
                remaining: 0,
                message: "There was an error getting balance, please try again"
            };
        });
        return remaining;
    } //end
}//end

module.exports = UserBalanceService;