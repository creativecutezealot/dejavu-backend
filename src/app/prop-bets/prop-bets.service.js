const Propbets = require('../prop-bets/models/prop-bets.model');
const PropbetsPlayers = require('../prop-bets/models/prop-bets-players.model');
const VerifyTokenSocket = require('../auth/verify-token-socket');
const mongoose = require('mongoose');
const User = require('../../app/users/models/users.model');
const UserDiamonds = require('../user_diamonds/models/user_diamonds.model');
const GroupsMembers = require('../groups/models/groups-members.model');
const UserService = require('../users/users.service');

const admin = require('../../../config/firebase-config');

class PropBetsService {

    static connectSocket(io, socket) {
        socket.on('submit_prop_bets', (data) => {
            console.log('submit_prop_bets: ', data);
            const verify_token_result = VerifyTokenSocket(data.token);
            if (verify_token_result.success == true) {
                const user_id = verify_token_result.data.user_id;
                this.create(io, user_id, data);
            } else {
                io.emit('game_response_error', {
                    message: 'Your token is not valid',
                    forceLogout: true
                });
            }
        });

        socket.on('update_prop_bets', (data) => {
            console.log('update_prop_bets: ', data);
            const verify_token_result = VerifyTokenSocket(data.token);
            if (verify_token_result.success == true) {
                const user_id = verify_token_result.data.user_id;
                this.update(io, user_id, data);
            } else {
                io.emit('game_response_error', {
                    message: 'Your token is not valid',
                    forceLogout: true
                });
            }
        });

        socket.on('accept_prop_bets', (data) => {
            console.log('accept_prop_bets: ', data);
            const verify_token_result = VerifyTokenSocket(data.token);
            if (verify_token_result.success == true) {
                const user_id = verify_token_result.data.user_id;
                data.user_id = user_id;
                this.accept(io, data);
            } else {
                io.emit('game_response_error', {
                    message: 'Your token is not valid',
                    forceLogout: true
                });
            }
        });

        socket.on('decline_prop_bets', (data) => {
            console.log('decline_prop_bets: ', data);
            const verify_token_result = VerifyTokenSocket(data.token);
            if (verify_token_result.success == true) {
                const user_id = verify_token_result.data.user_id;
                data.user_id = user_id;
                this.decline(io, data);
            } else {
                io.emit('game_response_error', {
                    message: 'Your token is not valid',
                    forceLogout: true
                });
            }
        });
    }

    static async create(io, user_id, data) {
        console.log('submit_prop_bets create: ', user_id);
        data.user_id = user_id;

        return await Propbets.create(data).then(async (result) => {
            console.log('submit_prop_bets result: ', result);
            io.emit('submit_prop_bets_result', result);
            const sender = await UserService.getUser(user_id);
            console.log('sender: ', sender);
            if (result.to_friend) {
                const receiver = await UserService.getUser(result.receiver_id);
                console.log('receiver: ', receiver);
                if (sender.user && receiver.user && receiver.user.fcm_token) {
                    let body = {
                        title: 'Prop Bet Submit',
                        body: `${sender.user.first_name} ${sender.user.last_name} sent prop bet to you!`
                    };
                    this.sendNotification(receiver.user.fcm_token, 'submit', body);
                }
            } else {
                var filter = [];
                filter['status'] = true;

                filter = Object.assign({}, filter);

                GroupsMembers.aggregate()
                    .match({ group_id: mongoose.Types.ObjectId(data.receiver_id) })
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
                        if (result && result.length > 0) {
                            console.log('GroupsMembers: ', result);
                            result.map(data => {
                                if (data.users._id !== sender.user._id ) {
                                    let body = {
                                        title: 'Prop Bet Submit',
                                        body: `${sender.user.first_name} ${sender.user.last_name} sent prop bet to you!`
                                    };
                                    this.sendNotification(data.users.fcm_token, 'submit', body);
                                }
                            });
                        }
                    }).catch(error => {
                        console.log('error: ', error);
                    });
            }

            //check if groups

            //check if friend

        });
    }

    static async accept(io, data) {
        return Propbets.findOneAndUpdate({ _id: mongoose.Types.ObjectId(data._id) }, {
            $set: {
                status: 1,
                started_at: Date.now(),
                updated_at: Date.now()
            }
        }, { returnOriginal: false })
            .then(async (result) => {
                console.log('results: ', result);
                // await this.addPlayer(data);
                const sender = await UserService.getUser(result.user_id);
                const receiver = await UserService.getUser(data.user_id);
                if (receiver.user) {
                    io.emit('update_prop_bets_result', { ...data, receiver: receiver.user });
                }

                if (sender.user && sender.user.fcm_token && receiver.user) {
                    let body = {
                        title: 'Prop Bet Accept',
                        body: `${receiver.user.first_name} ${receiver.user.last_name} has accpeted your bet! ${data.comment}`
                    };
                    this.sendNotification(sender.user.fcm_token, 'accept', body);
                }
            })
            .catch((err) => {
                console.log('Here: ', err);
                if (err) {
                    io.emit('game_response_error', {
                        message: 'Could not place a bet, please try again.'
                    });
                    return false;
                }
            });
    }

    static async decline(io, data) {
        data.status = 2;
        const receiver = await UserService.getUser(data.user_id);
        if (receiver.user) {
            io.emit('update_prop_bets_result', { ...data, receiver: receiver.user });
        }
    }

    static async update(io, user_id, data) {
        Propbets.find({
            $and: [{
                _id: mongoose.Types.ObjectId(data._id)
            },
            {
                status: { $ne: 4 }
            }]
        }).then(d => {
            console.log('Propbets finds: ', d);
            if (d && d.length > 0) {
                Propbets.findByIdAndUpdate(data._id, data, { new: true })
                    .then(async (result) => {
                        console.log('update_prop_bets_result: ', result);
                        if (data.status && data.status === 4 && data.type !== 0) {
                            var amount = 0;
                            if (result.is_freestyle) {
                                if (result.to_friend === true) {
                                    UserDiamonds.insertMany([
                                        { user: result.user_id, type: 1, amount: result.to_win, description: 'Win', propbet_id: result.propbet_id },
                                        { user: result.receiver_id, type: 2, amount: result.bet_amount, description: 'Lose', propbet_id: result.propbet_id }
                                    ]);
                                } else {
                                    GroupsMembers.find({ user_id: { $ne: result.user_id } })
                                        .then(members => {
                                            if (members && members.length > 0) {
                                                var array = [];
                                                array.push({ user: result.user_id, type: 1, amount: result.to_win, description: 'Win', propbet_id: result.propbet_id });
                                                members.map(member => {
                                                    array.push({ user: member.user_id, type: 2, amount: result.bet_amount, description: 'Lose', propbet_id: result.propbet_id });
                                                });
                                                UserDiamonds.insertMany(array);
                                            }
                                        });
                                }
                            } else {
                                if (result.proposed_odds === 'Even') {
                                    amount = result.bet_amount;
                                } else {
                                    if (parseInt(result.proposed_odds) < 0) {
                                        amount = Math.floor((100 / (parseInt(result.proposed_odds) * -1)) * result.bet_amount);
                                    } else {
                                        amount = Math.floor((parseInt(result.proposed_odds) / 100) * result.bet_amount);
                                    }
                                }
                                if (result.to_friend === true) {
                                    UserDiamonds.insertMany([
                                        { user: result.user_id, type: 1, amount: amount, description: 'Win', propbet_id: result.propbet_id },
                                        { user: result.receiver_id, type: 2, amount: amount, description: 'Lose', propbet_id: result.propbet_id }
                                    ]);
                                } else {
                                    GroupsMembers.find({ user_id: { $ne: result.user_id } })
                                        .then(members => {
                                            if (members && members.length > 0) {
                                                var array = [];
                                                array.push({ user: result.user_id, type: 1, amount: amount, description: 'Win', propbet_id: result.propbet_id });
                                                members.map(member => {
                                                    array.push({ user: member.user_id, type: 2, amount: amount, description: 'Lose', propbet_id: result.propbet_id });
                                                });
                                                UserDiamonds.insertMany(array);
                                            }
                                        });
                                }
                            }
                        }
                        io.emit('update_prop_bets_result', result);
                        return true;
                    })
                    .catch((err) => {
                        console.log('Here: ', err);
                        if (err) {
                            io.emit('game_response_error', {
                                message: 'Could not place a bet, please try again.'
                            });
                            return false;
                        }
                    });
            }
        });
    }

    static async getAllBets() {
        return await Propbets.find()
            .sort({ 'created_at': -1 })
            .then(data => {
                return data;
            }).catch(err => {
                return [];
            });
    }

    static async getProposedBets(param, user_id) {
        return await Propbets.aggregate()
            .match({ $and: [{ user_id: mongoose.Types.ObjectId(user_id) }, { status: { $ne: 4 } }] })
            .lookup({
                from: 'users',
                localField: 'user_id',
                foreignField: '_id',
                as: 'sender'
            })
            .unwind(
                {
                    path: '$users',
                    preserveNullAndEmptyArrays: true
                }
            )
            .sort({ 'created_at': -1 })
            .then(async (result) => {
                return result;
            })
            .catch(err => {
                return [];
            });
    }

    static async getAcceptedBets(param, user_id) {
        return await Propbets.aggregate()
            .match({ $and: [{ user_id: { $ne: mongoose.Types.ObjectId(user_id) } }, { status: 1 }] })
            .lookup({
                from: 'users',
                localField: 'user_id',
                foreignField: '_id',
                as: 'sender'
            })
            .unwind(
                {
                    path: '$users',
                    preserveNullAndEmptyArrays: true
                }
            )
            .sort({ 'created_at': -1 })
            .then(async (result) => {
                return result;
            })
            .catch(err => {
                return [];
            });
    }

    static async getAvailableBets(param, user_id) {
        return await Propbets.aggregate()
            .match({ $and: [{ user_id: { $ne: mongoose.Types.ObjectId(user_id) } }, { status: { $lt: 2 } }] })
            .lookup({
                from: 'users',
                localField: 'user_id',
                foreignField: '_id',
                as: 'sender'
            })
            .unwind(
                {
                    path: '$users',
                    preserveNullAndEmptyArrays: true
                }
            )
            .sort({ 'created_at': -1 })
            .then(async (result) => {
                return result;
            })
            .catch(err => {
                return [];
            });
    }

    static async getCompletedBets(param, user_id) {
        return await Propbets.aggregate()
            .match({ $and: [{ $or: [{ user_id: mongoose.Types.ObjectId(user_id) }, { receiver_id: mongoose.Types.ObjectId(user_id) }] }, { status: 4 }] })
            .lookup({
                from: 'users',
                localField: 'user_id',
                foreignField: '_id',
                as: 'sender'
            })
            .unwind(
                {
                    path: '$users',
                    preserveNullAndEmptyArrays: true
                }
            )
            .sort({ 'ended_at': -1 })
            .then(async (result) => {
                console.log('getCompletedBets: ', result);
                return result;
            })
            .catch(err => {
                return [];
            });
    }

    static async addPlayer(data) {
        const player_data = {
            user_id: data.user_id,
            propbet_id: data._id,
            start_diamonds: 1000,
        };
        return await PropbetsPlayers.create(player_data).then(result => {
            console.log('addPlayer result: ', result);
            // io.emit('submit_prop_bets_result', result);
        });
    }

    static async sendNotification(token, type, body) {
        try {
            const message = {
                notification: body,
                token: token,
                data: { type: type }
            };
            console.log('message: ', message);
            const response = await admin.messaging().send(message);
            if (response) {
                console.log('Successfully sent message: ', response);
            }
        } catch (error) {
            console.log('sendNotification Error: ', error);
        }
    }

}

module.exports = PropBetsService;