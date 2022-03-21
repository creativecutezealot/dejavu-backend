const User = require('./models/users.model');
const UsersFriends = require('./models/users-friends.model');
const NotificationsService = require('../notifications/notifications.service');
const UserBalanace = require('../user_balance/models/user_balance.model');
const UserDimonds = require('../user_diamonds/models/user_diamonds.model');
const mongoose = require('mongoose');

class UsersService {

    static async getUser(id) {
        console.log("getUser: ", id);
        return await User.findById(id).then(data => {
            return { success: true, user: data };
        }).catch(err => {
            return { success: false, message: "Could not show the user" };
        });
    }

    static async sendUserRank(socket, user_id) {

        User.aggregate().
            lookup({
                from: 'user_balance',
                localField: '_id',
                foreignField: 'user',
                as: 'user_balance'
            }).unwind({
                path: '$user_balance'
            }).project({
                user_balance: {
                    "$cond": {
                        if: { "$eq": [2, "$user_balance.type"] },
                        then: { user: "$user_balance.user", amount: { "$multiply": ['$user_balance.amount', -1] } },
                        else: { user: "$user_balance.user", amount: "$user_balance.amount" }
                    }
                }
            }).group({
                _id: "$user_balance.user",
                total: {
                    "$sum": "$user_balance.amount"
                }
            }).lookup({
                from: 'users',
                localField: '_id',
                foreignField: '_id',
                as: 'user'
            }).unwind({
                path: '$user'
            }).sort('-total').then(data => {

                const total_users = data.length;

                var rank = 0;
                for (var i = 0; i < total_users; i++) {
                    const user = data[i];

                    if (user._id == user_id) {
                        rank = i + 1;

                        socket.emit('user_rank', { success: true, total_users: total_users, rank: rank });

                    }
                }
            });
    }//end


    static async getTopUsers() {
        return await User.aggregate().
            lookup({
                from: 'user_balance',
                localField: '_id',
                foreignField: 'user',
                as: 'user_balance'
            }).unwind({
                path: '$user_balance'
            }).project({
                user_balance: {
                    "$cond": {
                        if: { "$eq": [2, "$user_balance.type"] },
                        then: { user: "$user_balance.user", amount: { "$multiply": ['$user_balance.amount', -1] } },
                        else: { user: "$user_balance.user", amount: "$user_balance.amount" }
                    }
                }
            }).group({
                _id: "$user_balance.user",
                total: {
                    "$sum": "$user_balance.amount"
                }
            }).lookup({
                from: 'users',
                localField: '_id',
                foreignField: '_id',
                as: 'user'
            }).unwind({
                path: '$user'
            }).sort('-total').then(data => {
                return { success: true, data: data };
            }).catch(err => {
                return { success: false, message: "Could not show top users" };
            })
    }//end

    static async getUserRank(user_id) {
        return await User.aggregate().
            lookup({
                from: 'user_balance',
                localField: '_id',
                foreignField: 'user',
                as: 'user_balance'
            }).unwind({
                path: '$user_balance'
            }).project({
                user_balance: {
                    "$cond": {
                        if: { "$eq": [2, "$user_balance.type"] },
                        then: { user: "$user_balance.user", amount: { "$multiply": ['$user_balance.amount', -1] } },
                        else: { user: "$user_balance.user", amount: "$user_balance.amount" }
                    }
                }
            }).group({
                _id: "$user_balance.user",
                total: {
                    "$sum": "$user_balance.amount"
                }
            }).lookup({
                from: 'users',
                localField: '_id',
                foreignField: '_id',
                as: 'user'
            }).unwind({
                path: '$user'
            }).sort('-total').then(data => {

                const total_users = data.length;

                var rank = 0;
                for (var i = 0; i < total_users; i++) {
                    const user = data[i];

                    if (user._id == user_id) {
                        rank = i + 1;
                        return { success: true, total_users: total_users, rank: rank, httpStatus: 200 };
                    }
                }

            }).catch(err => {
                return { success: false, httpStatus: 200, message: "Could not show top users" };
            });

    }//end

    static async searchUsers(req) {
        var filter = [];
        var q = req.query.q ? req.query.q : "";
        var limit = req.params.limit ? req.params.limit : 20;
        var page = req.params.page ? req.params.page : 1;
        var total_page = 0;
        var skip = 0;
        var user_id = req.decoded_data.user_id;
        if (page) {
            if (page >= 1) {
                page = page - 1;
            }
            skip = page * limit;
        }



        if (q != "") {

            filter['$or'] = [
                { "first_name": RegExp(["^.*", String(q).trim(), ".*"].join(""), "i") },
                { "last_name": RegExp(["^.*", String(q).trim(), ".*"].join(""), "i") }
            ];

        } else {
            return { total_result: 0, total_page: 0, page: page == 0 ? 1 : page, data: [] };
        }
        filter['_id'] = { "$ne": mongoose.Types.ObjectId(user_id) };
        filter['status'] = 1;

        filter = Object.assign({}, filter);
        return await User.countDocuments(filter).then(async (total_result) => {

            return await User.aggregate().match(filter).lookup({
                from: 'users_friends',
                localField: '_id',
                foreignField: 'user_friend_id',
                as: 'users_friends'
            })
                .unwind({
                    path: "$users_friends",
                    preserveNullAndEmptyArrays: true
                })
                .sort('first_name').skip(skip).limit(limit).then((data) => {
                    total_page = Math.ceil(total_result / limit);
                    var data = data.map((item, index, arr) => {
                        if (item.users_friends == undefined) {
                            return item;
                        }
                        if (item.users_friends.user_id != user_id) {
                            console.log("not equal");
                            item.users_friends = undefined;
                            return item;
                        }

                        return item;
                    })
                    return { total_result: total_result, total_page: total_page, page: page == 0 ? 1 : page, data: data };
                });
        }).catch(err => {
            console.log(err);
            return { message: "There was an error showing data", httpStatus: 500 };
        });

    }

    static async sendFriendRequest(req) {
        var user_id = req.decoded_data.user_id;
        var user_friend_id = req.body.user_friend_id;

        var check_if_exist = await UsersFriends.find({
            '$or': [
                { user_id: user_id, user_friend_id: user_friend_id },
                { user_id: user_friend_id, user_friend_id: user_id }
            ]
        }).then(data => {

            if (data.length > 0) {
                return true;
            }
            return false;
        });
        if (check_if_exist) {
            return { message: "Already sent request", status: true, data: null, httpStatus: 200 };
        }

        return await UsersFriends.create({
            'user_id': mongoose.Types.ObjectId(user_id),
            'user_friend_id': mongoose.Types.ObjectId(user_friend_id),
            'status': false
        }).then(result => {

            NotificationsService.sendNotififcation({
                'from_id': mongoose.Types.ObjectId(user_id),
                'to_id': mongoose.Types.ObjectId(user_friend_id),
                'object_id': mongoose.Types.ObjectId(result._id),
                'type': "new_friend_request",
                'message': "You have new friend request"
            });


            return { message: "Successfully sent request", status: true, data: result, httpStatus: 200 };
        }).catch(err => {
            return { message: "There was an error showing data", httpStatus: 500 };
        });
    }

    static async listFriends(req) {
        var filter = [];
        var user_filter = [];
        var q = req.query.q ? req.query.q : "";
        var status = req.query.status ? req.query.status : true;
        var limit = req.params.limit ? req.params.limit : 20;
        var page = req.params.page ? req.params.page : 1;
        var total_page = 0;
        var skip = 0;
        var user_id = req.decoded_data.user_id;
        if (page) {
            if (page >= 1) {
                page = page - 1;
            }
            skip = page * limit;
        }

        if (q) {

            user_filter['$or'] = [{ "first_name": RegExp(["^.*", String(q).trim(), ".*"].join(""), "i") },
            { "last_name": RegExp(["^.*", String(q).trim(), ".*"].join(""), "i") }
            ];

        }
        //filter['_id'] = { "$ne": mongoose.Types.ObjectId(user_id) };
        filter['status'] = status == "true" ? true : false;

        //filter['user_id'] =  mongoose.Types.ObjectId(user_id);
        if (status == "true") {
            filter['$or'] = [
                { user_id: mongoose.Types.ObjectId(user_id) }

            ];
        } else {
            filter['user_friend_id'] = mongoose.Types.ObjectId(user_id);
        }
        filter = Object.assign({}, filter);
        user_filter = Object.assign({}, user_filter);


        return await UsersFriends.aggregate()
            .match(filter)
            .lookup({
                from: 'users',
                localField: filter['status'] == true ? "user_friend_id" : "user_id",
                foreignField: '_id',
                as: 'users'
            })
            .unwind({
                path: "$users",
                preserveNullAndEmptyArrays: true
            })
            .match({
                "$or": [
                    { "users.first_name": RegExp(["^.*", String(q).trim(), ".*"].join(""), "i") },
                    { "users.last_name": RegExp(["^.*", String(q).trim(), ".*"].join(""), "i") },
                ]
            })
            .then(async (all_result) => {
                var total_result = 0;
                if (all_result) {
                    total_result = all_result.length;
                }
                return await UsersFriends.aggregate()
                    .match(filter)
                    .lookup({
                        from: 'users',
                        localField: filter['status'] == true ? "user_friend_id" : "user_id",
                        foreignField: '_id',
                        as: 'users'
                    })
                    .unwind({
                        path: "$users",
                        preserveNullAndEmptyArrays: true
                    })
                    .match({
                        "$or": [
                            { "users.first_name": RegExp(["^.*", String(q).trim(), ".*"].join(""), "i") },
                            { "users.last_name": RegExp(["^.*", String(q).trim(), ".*"].join(""), "i") },
                        ]
                    })
                    .sort(filter['status'] == true ? "first_name" : "-created_at").skip(skip).limit(limit).then((data) => {
                        total_page = Math.ceil(total_result / limit);

                        return { total_result: total_result, total_page: total_page, page: page == 0 ? 1 : page, data: data };
                    });
            }).catch(err => {

                return { message: "There was an error showing data", httpStatus: 500 };
            });

    }

    static async unfriend(req) {

        var id = req.body.id;

        var user_friends = await UsersFriends.findById(id).then(data => {

            if (data) {
                return { status: true, data: data };
            }
            return { status: false };
        });
        if (user_friends.status == false) {
            return { message: "You are not connected anymore", status: true, httpStatus: 200 };
        }

        return await UsersFriends.deleteOne({
            "_id": mongoose.Types.ObjectId(id)
        }).then(async result => {

            await UsersFriends.deleteOne({
                user_id: user_friends.data.user_friend_id,
                user_friend_id: user_friends.data.user_id,
            }).then(result => {
                return true;
            });

            return { message: "You have successfully unfriend the user", status: true, httpStatus: 200 };
        }).catch(err => {

            return { message: "There was an error showing data", httpStatus: 500 };
        });

    }//end


    static async acceptFriend(req) {

        var id = req.body.id;

        var user_friends = await UsersFriends.findById(id).then(data => {

            if (data) {
                return { status: true, data: data };
            }
            return { status: false };
        });
        if (user_friends.status == false) {
            return { message: "Request Not Found", status: true, httpStatus: 200 };
        }

        return await UsersFriends.findByIdAndUpdate(mongoose.Types.ObjectId(id), {
            status: true
        }).then(async result => {

            var user = await User.findById(user_friends.data.user_friend_id).then(result => {
                return result;
            });
            NotificationsService.sendNotififcation({
                from_id: user_friends.data.user_friend_id,
                to_id: user_friends.data.user_id,
                object_id: user_friends.data._id,
                type: "accept_friend_request",
                message: user.first_name + " " + user.last_name + " accepted your friend request."
            });
            await UsersFriends.create({
                user_id: user_friends.data.user_friend_id,
                user_friend_id: user_friends.data.user_id,
                status: true
            }).then(result => {
                return true;
            });

            return { message: "Succesully accepted Friend", status: true, httpStatus: 200 };
        }).catch(err => {

            return { message: "There was an error showing data", httpStatus: 500 };
        });

    }//end


    static async listAllFriends(user_id) {
        return await UsersFriends.aggregate()
            .match({
                user_id: mongoose.Types.ObjectId(user_id),
                status: true
            })
            .lookup({
                from: 'users',
                localField: "user_friend_id",
                foreignField: '_id',
                as: 'users'
            })
            .unwind({
                path: "$users",
                preserveNullAndEmptyArrays: true
            })
            .match({
                user_id: mongoose.Types.ObjectId(user_id),
                status: true
            })
            .sort("first_name").then((data) => {
                return { data: data };
            }).catch(err => {
                console.log(err);
                return { data: [] };
            });
    }

    static async removeAccount(uid) {
        return await User.deleteOne({ _id: mongoose.Types.ObjectId(uid) }).then(result => {
            console.log(result)
            return { message: "Succesully deleted", status: true, httpStatus: 200 };
        });
    }

    static async addChip(uid) {
        return await UserBalanace.create({
            user: uid,
            type: 1,
            amount: 1000,
            description: "Add Credit",
            created_at: new Date(),
            updated_at: new Date()
        }).then((data) => {
            console.log('addChip: ', data);
            return { status: true, message: "You have successfully added chip" };
        }).catch(err => {
            return { status: false, message: 'Server Error: User balance', httpStatus: 500 }
        });
    }

    static async addDiamond(uid) {
        return await UserDimonds.create({
            user: uid,
            type: 1,
            amount: 1000,
            description: "Add Credit",
            created_at: new Date(),
            updated_at: new Date()
        }).then((data) => {
            console.log('addDiamond: ', data);
            return { status: true, message: "You have successfully added diamond" };
        }).catch(err => {
            return { status: false, message: 'Server Error: User diamond', httpStatus: 500 }
        });
    }

}

module.exports = UsersService;