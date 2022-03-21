const Contests = require('./models/contests.model');
const ContestPlayers = require('./models/contest_players.model');
const GroupsMembers = require('../groups/models/groups-members.model');
const UserBalance = require('../user_balance/models/user_balance.model')
const mongoose = require('mongoose');
const timezone = 'America/Los_Angeles';

class ContestsService {

    static async create(req) {
        req.body.user_id = req.decoded_data.user_id
        let data = req.body;
        return await Contests.find({ user_id: mongoose.Types.ObjectId(req.decoded_data.user_id), name: req.body.name })
            .then(async c => {
                if (c && c.length > 0) {
                    console.log(c)
                    return { message: 'You have already used this name. please use another one.', status: false };
                } else {
                    return await Contests.create(data)
                        .then(async r => {
                            if (r) {
                                this.addContestPlayers(req.decoded_data.user_id, r._id, r.group_id)
                                // console.log(r)
                                return { message: 'contest added.', status: true };
                            } else {
                                return { message: "There was an error adding data", httpStatus: 500, status: false };
                            }
                        })
                        .catch((err) => {
                            return { message: "There was an error adding data", httpStatus: 500, status: false };
                        });
                }
            })

    }

    static async addContestPlayers(userId, contest_id, group_id) {
        await GroupsMembers.find({ group_id: mongoose.Types.ObjectId(group_id) })
            .then(async r => {
                if (r && r.length > 0) {
                    for (var i = 0; i < r.length; i++) {
                        var start_points = await this.getUserBalance(r[i].user_id)
                        console.log(userId)
                        console.log(start_points)
                        ContestPlayers.create({
                            contest_id: contest_id,
                            user_id: r[i].user_id,
                            status: r[i].user_id == userId ? true : false,
                            start_points: start_points
                        })
                            .then(result => {
                                //notify invite
                                console.log('contest group invited')
                            }).catch(err => {
                                console.log(err)
                                console.log({ message: "contest sending invite error" });
                            })
                    }
                }
            })
    }

    static async list(req) {
        var filter = [];
        var user_id = req.decoded_data.user_id;
        var q = req.query.q ? req.query.q : "";
        var limit = req.params.limit ? req.params.limit : 20;
        var page = req.params.page ? req.params.page : 1;
        var total_page = 0;
        var skip = 0;

        if (page) {
            if (page >= 1) {
                page = page - 1;
            }
            skip = page * limit;
        }

        if (q) {

            filter['$or'] = [{ "name": RegExp(["^.*", String(q).trim(), ".*"].join(""), "i") }];

        }

        filter['user_id'] = mongoose.Types.ObjectId(user_id);
        filter['status'] = true;

        filter = Object.assign({}, filter);

        return await ContestPlayers.aggregate().lookup({
            from: 'contests',
            localField: 'contest_id',
            foreignField: '_id',
            as: 'contests'
        })
            .match(filter)
            .sort({ 'created_at': -1 })
            .skip(skip).limit(limit)
            .then(async (result) => {
                var total_result = result.length;
                total_page = Math.ceil(total_result / limit);

                return { total_result: total_result, total_page: total_page, page: page == 0 ? 1 : page, data: result };

            }).catch(err => {
                console.log(err)
                return { message: "There was an error showing data", httpStatus: 500 };
            });

    }

    static async getInvites(req) {
        let userId = req.decoded_data.user_id;
        return await ContestPlayers.aggregate().lookup({
            from: 'contests',
            localField: 'contest_id',
            foreignField: '_id',
            as: 'contests'
        })
            .match({ user_id: mongoose.Types.ObjectId(userId), status: false })
            .sort({ created_at: -1 })
            .then(r => {
                return { status: true, data: r }
            })
            .catch(err => {
                return { message: "There was an error showing data", httpStatus: 500 };
            });
    }

    static async accept(req) {
        return await ContestPlayers.updateOne({ _id: mongoose.Types.ObjectId(req.body.contest_id) }, {
            $set: {
                status: 1,
                updated_at: Date.now()
            }
        })
            .then(r => {
                if (r) {
                    console.log(r)
                    return { status: true }
                } else {
                    return { message: "Something went wrong", httpStatus: 500 };
                }
            })
            .catch(() => {
                return { message: "Something went wrong", httpStatus: 500 };
            })
    }

    static async delete(req) {
        return await ContestPlayers.deleteOne({ _id: mongoose.Types.ObjectId(req.body.contest_id) })
            .then(r => {
                if (r) {
                    console.log(r)
                    return { status: true }
                } else {
                    return { message: "Something went wrong", httpStatus: 500 };
                }
            })
            .catch(() => {
                return { message: "Something went wrong", httpStatus: 500 };
            })
    }

    static async getRanks(req) {
        return await ContestPlayers.aggregate().lookup({
            from: 'contests',
            localField: 'contest_id',
            foreignField: '_id',
            as: 'contests'
        })
            .lookup({
                from: 'users',
                localField: 'user_id',
                foreignField: '_id',
                as: 'users'
            })
            .match({ contest_id: mongoose.Types.ObjectId(req.query.contest_id), status: true })
            .sort({ updated_at: 1 })
            .then(async r => {
                if (r && r.length > 0) {
                    for (var i = 0; i < r.length; i++) {
                        let today = new Date();
                        let endDate = new Date(r[i].contests[0].end_date);
                        let startDate = new Date(r[i].contests[0].start_date);
                        var bal = await this.getUserBalanceEnd(r[i].user_id, endDate);
                        var reups = await this.getReupsFromContest(r[i].user_id, startDate, endDate);
                        r[i].new_points = startDate < today ? bal : 0;
                        r[i].contest_points = startDate < today ? bal - r[i].start_points - reups : 0;
                    }

                    r = await r.sort(function (a, b) {
                        return b.contest_points - a.contest_points;
                    });
                    return { status: true, data: r }
                } else {
                    return { status: true, data: r }
                }
            })
            .catch(err => {
                console.error('getRanks error:', err);
                return { message: "There was an error showing data", httpStatus: 500 };
            });
    }

    static async getUserBalance(user_id) {
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
            return remaining;
        }).catch((err) => {
            return 0;
        });

        return remaining;
    }

    static async getUserBalanceEnd(user_id, end) {
        const remaining = await UserBalance.aggregate().match({
            user: mongoose.Types.ObjectId(user_id),
            created_at: { "$lte": end },
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
            return remaining;
        }).catch((err) => {
            return 0;
        });

        return remaining;
    }

    static async getReupsFromContest(user_id, startDate, endDate) {
        const reups = await UserBalance.aggregate()
            .match({
                user: mongoose.Types.ObjectId(user_id),
                created_at: { "$gte": startDate, "$lt": endDate },
                type: 1,
                description: { $ne: 'Win' }
            }).group({
                _id: {
                    description: "$description"
                },
                reups: {
                    "$sum": "$amount"
                }
            }).exec().then((data) => {
                console.log('getReupsFromContestStart: ', data);
                if (data.length > 0) {
                    return data[0].reups
                } else {
                    return 0;
                }
            }).catch((err) => {
                console.error('getReupsFromContestStart error: ', err);
                return 0;
            });

        return reups;
    }

}

module.exports = ContestsService;