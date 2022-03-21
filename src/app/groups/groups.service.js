const Groups = require('../groups/models/groups.model');
const Users = require('../users/models/users.model');
const GroupsMembers = require('../groups/models/groups-members.model');
const mongoose = require('mongoose');
class GroupsService {

    static async leave(req) {
        var user_id = req.decoded_data.user_id;
        const group_id = req.body.group_id;

        const group_members = await GroupsMembers.findOne({ group_id: group_id, user_id: user_id }).then(result => {
            if (!result) {
                return { status: false };
            }
            return { status: true, data: result };
        }).catch(err => {
            return { status: false };
        });


        if (group_members.status == false) {
            return { message: "You are not part of the group", status: true, httpStatus: 400 };
        }

        return await GroupsMembers.deleteOne({ group_id: group_id, user_id: user_id }).then(result => {
            return { message: "You have successfully leave the group", status: true, httpStatus: 200 };
        }).catch(err => {
            return { message: "Could not process your request", status: false, httpStatus: 500 };
        });
    }

    static async accept(req) {
        const id = req.body.id;


        const group_members = await GroupsMembers.findById(id).then(result => {
            if (!result) {
                return { status: false };
            }
            return { status: true, data: result };
        }).catch(err => {
            return { status: false };
        });

        if (group_members.status == false) {
            return { message: "You are not yet invited", status: true, httpStatus: 400 };
        }
        group_members.data.status = true;
        group_members.data.save();

        // notify
        return { message: "Successfully join to the group", status: true, httpStatus: 200 };
    }

    static async remove(req) {
        const id = req.body.id;


        const group_members = await GroupsMembers.findById(id).then(result => {
            if (!result) {
                return { status: false };
            }
            return { status: true, data: result };
        }).catch(err => {
            return { status: false };
        });


        return await GroupsMembers.findByIdAndRemove(id).then(result => {
            return { message: "Successfully remove to the group", status: true, httpStatus: 200 };
        }).catch(err => {
            return { message: "Could not process your request", status: false, httpStatus: 500 };
        });
    }

    static async invite(req) {
        const user_id = req.body.user_id;
        const group_id = req.body.group_id;

        const group_members = await GroupsMembers.findOne({ group_id: group_id, user_id: user_id }).then(result => {

            if (!result) {
                return { status: false };
            }

            return { status: true, data: result };
        }).catch(err => {
            return { status: false };
        });


        if (group_members.status == true) {
            if (group_members.data.status == true) {
                return { message: "User are already member of the group", status: true, httpStatus: 200 };
            } else {
                return { message: "Already sent intvites", status: true, httpStatus: 200 };
            }
        }

        return await GroupsMembers.create({
            group_id: group_id,
            user_id: user_id,
            status: false
        }).then(result => {
            //notify invite
            return { message: "Successfully invited to the group", status: true, httpStatus: 200 };
        }).catch(err => {
            return { message: "Could not process your request", status: false, httpStatus: 500 };
        })
    }
    static async create(req) {
        var user_id = req.decoded_data.user_id;
        return await Groups.create({ name: req.body.name, status: true, user_id }).then(async result => {

            await GroupsMembers.create({
                group_id: result._id,
                user_id: user_id,
                status: true
            }).then(result => {
                return true;
            })

            return { message: "Successfully created groups", status: true, httpStatus: 200 };
        });
    }
    static async update(req) {
        return await Groups.findByIdAndUpdate(req.body.group_id, { name: req.body.name }).then(result => {
            if (!result) {
                return { message: "Groups Not found", status: false, httpStatus: 404 };
            }

            return { message: "Successfully updated group", status: true, httpStatus: 200 };
        }).catch(err => {
            return { message: "Could not process your request", status: false, httpStatus: 500 };
        });
    }



    static async search(req) {

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

            filter['$or'] = [{ "first_name": RegExp(["^.*", String(q).trim(), ".*"].join(""), "i") },
            { "last_name": RegExp(["^.*", String(q).trim(), ".*"].join(""), "i") }
            ];

        }
        filter['status'] = 1;
        filter['user_id'] = { '$ne': mongoose.Types.ObjectId(user_id) };
        filter = Object.assign({}, filter);

        return await Users.aggregate().lookup({
            from: 'groups_members',
            localField: '_id',
            foreignField: 'user_id',
            as: 'groups_members'
        })
            .match(filter)
            .then(async result => {
                var total_result = result.length;
                return await Users.aggregate()
                    .lookup({
                        from: 'groups_members',
                        localField: '_id',
                        foreignField: 'user_id',
                        as: 'groups_members'
                    })
                    .match(filter)
                    .sort(filter['status'] == true ? "first_name" : "-created_at").skip(skip).limit(limit).then((data) => {
                        total_page = Math.ceil(total_result / limit);

                        return { total_result: total_result, total_page: total_page, page: page == 0 ? 1 : page, data: data };
                    }).catch(err => {
                        return { message: "There was an error showing data", httpStatus: 500 };
                    });

            }).catch(err => {
                return { message: "There was an error showing data", httpStatus: 500 };
            });
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

            filter['$or'] = [{ "groups.name": RegExp(["^.*", String(q).trim(), ".*"].join(""), "i") }];


        }
        filter['user_id'] = mongoose.Types.ObjectId(user_id);
        filter['status'] = true;

        filter = Object.assign({}, filter);

        return await GroupsMembers.aggregate().match({
            'user_id': mongoose.Types.ObjectId(user_id)
        })
            .lookup(
                {
                    from: 'groups',
                    localField: 'group_id',
                    foreignField: '_id',
                    as: 'groups'
                }
            )
            .unwind(
                {
                    path: "$groups",
                    preserveNullAndEmptyArrays: true
                }
            )
            .match(filter)
            .then(async (result) => {

                var total_result = result.length;
                return await GroupsMembers.aggregate().match({
                    'user_id': mongoose.Types.ObjectId(user_id)
                })
                    .lookup({
                        from: 'groups',
                        localField: 'group_id',
                        foreignField: '_id',
                        as: 'groups'
                    })
                    .unwind({
                        path: "$groups",
                        preserveNullAndEmptyArrays: true
                    }
                    )
                    .match(filter).sort('name').skip(skip).limit(limit).then(data => {
                        total_page = Math.ceil(total_result / limit);

                        return { total_result: total_result, total_page: total_page, page: page == 0 ? 1 : page, data: data };
                    });
            }).catch(err => {
                return { message: "There was an error showing data", httpStatus: 500 };
            });
    }



    static async groups_members(req) {

        var filter = [];
        var user_id = req.decoded_data.user_id;
        var q = req.query.q ? req.query.q : "";
        var limit = req.params.limit ? req.params.limit : 20;
        var page = req.params.page ? req.params.page : 1;
        var total_page = 0;
        var skip = 0;

        const group_id = req.params.group_id;

        if (q) {

            filter['$or'] = [
                { "users.first_name": RegExp(["^.*", String(q).trim(), ".*"].join(""), "i") },
                { "users.last_name": RegExp(["^.*", String(q).trim(), ".*"].join(""), "i") }
            ];


        }
        filter['status'] = true;

        filter = Object.assign({}, filter);

        return await GroupsMembers.aggregate()
            .match({ group_id: mongoose.Types.ObjectId(group_id) })
            .lookup(
                {
                    from: 'users',
                    localField: 'user_id',
                    foreignField: '_id',
                    as: 'users'
                })
            .unwind({
                path: '$users',
                preserveNullAndEmptyArrays: true
            })
            .match(filter)
            .then(async (result) => {
                var total_result = result.length;

                return await GroupsMembers.aggregate()
                    .match({ group_id: mongoose.Types.ObjectId(group_id) })
                    .lookup({
                        from: 'users',
                        localField: 'user_id',
                        foreignField: '_id',
                        as: 'users'
                    })
                    .unwind({
                        path: '$users',
                        preserveNullAndEmptyArrays: true
                    })
                    .lookup({
                        from: 'groups',
                        localField: 'group_id',
                        foreignField: '_id',
                        as: 'groups'
                    })
                    .unwind({
                        path: "$groups",
                        preserveNullAndEmptyArrays: true
                    })
                    .match(filter)
                    .sort('users.first_name').skip(skip).limit(limit).then((data) => {

                        total_page = Math.ceil(total_result / limit);

                        return { total_result: total_result, total_page: total_page, page: page == 0 ? 1 : page, data: data };
                    });
            }).catch(err => {
                return { message: "There was an error showing data", httpStatus: 500 };
            });
    }


    static async search_pending(req) {

        var filter = [];
        var user_id = req.decoded_data.user_id;
        var q = req.query.q ? req.query.q : "";
        var limit = req.params.limit ? req.params.limit : 20;
        var page = req.params.page ? req.params.page : 1;
        var total_page = 0;
        var skip = 0;

        const group_id = req.params.group_id;

        if (q) {

            filter['$or'] = [
                { "groups.name": RegExp(["^.*", String(q).trim(), ".*"].join(""), "i") }
            ];


        }
        filter['status'] = false;
        filter['user_id'] = mongoose.Types.ObjectId(user_id);

        filter = Object.assign({}, filter);
        console.log(filter);
        return await GroupsMembers.aggregate()
            .match(filter)
            .lookup({
                from: 'groups',
                localField: 'group_id',
                foreignField: '_id',
                as: 'groups'
            }).unwind({
                path: "$groups",
                preserveNullAndEmptyArrays: true
            })
            .then(async result => {
                var total_result = result.length;
                return await GroupsMembers.aggregate()
                    .match(filter)
                    .lookup({
                        from: 'groups',
                        localField: 'group_id',
                        foreignField: '_id',
                        as: 'groups'
                    }).unwind({
                        path: "$groups",
                        preserveNullAndEmptyArrays: true
                    })
                    .sort("name").skip(skip).limit(limit)
                    .then(data => {
                        total_page = Math.ceil(total_result / limit);

                        return { total_result: total_result, total_page: total_page, page: page == 0 ? 1 : page, data: data };
                    }).catch(err => {
                        return { message: "There was an error showing data", httpStatus: 500 };
                    });
            }).catch(err => {

                return { message: "There was an error showing data", httpStatus: 500 };
            });
    }

    static async listAllGroups(user_id) {
        return await GroupsMembers.aggregate().match({
            'user_id': mongoose.Types.ObjectId(user_id),
            status:true
        })
            .lookup({
                from: 'groups',
                localField: 'group_id',
                foreignField: '_id',
                as: 'groups'
            })
            .unwind({
                path: "$groups",
                preserveNullAndEmptyArrays: true
            }).sort('name').then(data => {
                return { data: data };
            }, err => {
                    return { data: [] };
            });
    }



}
module.exports = GroupsService;