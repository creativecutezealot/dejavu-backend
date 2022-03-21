const mongoose = require('mongoose');
const moment = require('moment');
const momentTZ = require('moment-timezone');
const Games = require('./models/games.model');
const GameTable = require('../game_table/models/game_table.model');
const Bets = require('../game_table/models/bets.model');
const Plays = require('./models/plays.model');
const GameTablePlays = require('../game_table/models/game_table_plays.model');
const MlbConversion = require('./models/mlbconversion.model');
const UserBalance = require('../user_balance/models/user_balance.model');
const UsersService = require('../users/users.service');
const UserBalanceService = require('../user_balance/user_balance.service');
const VerifyTokenSocket = require('../../app/auth/verify-token-socket');
const Players = require('../mlbgames/models/players.model');
const NodeCache = require('node-cache');
const e = require('express');
const { find } = require('./models/games.model');
const Propbets = require('../prop-bets/models/prop-bets.model');
const UserDiamondsService = require('../user_diamonds/user_diamonds.service');
const PropBetsService = require('../prop-bets/prop-bets.service');
const BattersService = require('../batters/batters.service');
const Batters = require('../batters/batters.model');

const nodecache = new NodeCache({
  stdTTL: 100,
  checkperiod: 120,
  useClones: false
});

class MlbGamesService {
  static connectSocket(io, socket, FantasyDataClient) {
    socket.on('get_game_data', (data) => {
      const verify_token_result = VerifyTokenSocket(data.token);
      if (verify_token_result.success == true) {
        this.fetchGames(['InProgress', 'Scheduled'], socket, data.page, 20);
      } else {
        socket.emit('game_response_error', {
          message: 'Your token is not valid',
          forceLogout: true
        });
      }
    });

    socket.on('create_game_table', (data) => {
      console.log('socket: create_game_table');
      const verify_token_result = VerifyTokenSocket(data.token);

      if (verify_token_result.success == true) {
        const user_id = verify_token_result.data.user_id;
        this.createGameTable(user_id, socket, data.games);
      } else {
        socket.emit('game_response_error', {
          message: 'Your token is not valid',
          forceLogout: true
        });
      }
    });

    socket.on('load_game_table', (data) => {
      console.log('socket: load_game_table');
      const verify_token_result = VerifyTokenSocket(data.token);
      if (verify_token_result.success == true) {
        const user_id = verify_token_result.data.user_id;
        this.loadGameTable(socket, user_id, data.games);
      }
    });

    socket.on('place_bet', (data) => {
      const verify_token_result = VerifyTokenSocket(data.token);
      if (verify_token_result.success == true) {
        const user_id = verify_token_result.data.user_id;
        if (parseInt(data.amount) == 0) {
          console.log(data)
          this.onDeleteBets(
            socket,
            user_id,
            data.game_table,
            data.place,
            data.balls,
            data.strikes,
            data.deleteNow
          );
        } else {
          this.onPlaceBets(
            socket,
            user_id,
            data.game_table,
            data.play_id,
            data.place,
            data.amount,
            data.last_selected_chip,
            data.isOdds,
            this.moveComePlace(data.button_pos),
            0
          );
        }
      } else {
        socket.emit('game_response_error', {
          message: 'Your token is not valid',
          forceLogout: true
        });
      }
    });

    socket.on('get_bet', (data) => {
      const verify_token_result = VerifyTokenSocket(data.token);
      if (verify_token_result.success == true) {
        const user_id = verify_token_result.data.user_id;
        this.getBets(socket, user_id, data.game_table);
      } else {
        socket.emit('game_response_error', {
          message: 'Your token is not valid',
          forceLogout: true
        });
      }
    });

    socket.on('get_diamonds', (data) => {
      const verify_token_result = VerifyTokenSocket(data.token);
      if (verify_token_result.success == true) {
        const user_id = verify_token_result.data.user_id;
        this.getDiamonds(socket, user_id);
      } else {
        socket.emit('game_response_error', {
          message: 'Your token is not valid',
          forceLogout: true
        });
      }
    });

    socket.on('on_set_user_lose', (data) => {
      const verify_token_result = VerifyTokenSocket(data.token);

      if (verify_token_result.success == true) {
        const user_id = verify_token_result.data.user_id;
        this.set_user_lose(
          socket,
          data.game_table_id,
          user_id,
          data.result,
          data.play_id
        );
      }
    });

    socket.on('get_play_by_play', (data) => {
      const verify_token_result = VerifyTokenSocket(data.token);

      if (verify_token_result.success == true) {
        const game_id = data.game_id;
        const games = data.games;
        const game_table_id = data.game_table_id;
        if (process.env.SIMULATOR == 0) {
          if (data.load_init == true) {
            this.loadLastPlayInit(
              FantasyDataClient,
              io,
              socket,
              game_id,
              games,
              game_table_id
            );
          } else {
            this.runcheckPlayByPlay(
              FantasyDataClient,
              io,
              socket,
              game_id,
              games,
              game_table_id
            );
          }
        }
      } else {
        socket.emit('game_response_error', {
          message: 'Your token is not valid',
          forceLogout: true
        });
      }
    });

    socket.on('get_user_rank', (data) => {
      const verify_token_result = VerifyTokenSocket(data.token);
      if (verify_token_result.success == true) {
        const user_id = verify_token_result.data.user_id;
        UsersService.sendUserRank(socket, user_id);
      } else {
        socket.emit('game_response_error', {
          message: 'Your token is not valid',
          forceLogout: true
        });
      }
    });

    socket.on('get_last_play_list', (data) => {
      const verify_token_result = VerifyTokenSocket(data.token);
      if (verify_token_result.success == true) {
        const user_id = verify_token_result.data.user_id;

        this.get_last_play_list(io, user_id, data.games, data.play_number);
      } else {
        socket.emit('game_response_error', {
          message: 'Your token is not valid',
          forceLogout: true
        });
      }
    });

    socket.on('get_game_history', (data) => {
      const verify_token_result = VerifyTokenSocket(data.token);
      if (verify_token_result.success == true) {
        const user_id = verify_token_result.data.user_id;

        this.get_game_history(socket, user_id, data.page);
      } else {
        socket.emit('game_response_error', {
          message: 'Your token is not valid',
          forceLogout: true
        });
      }
    });

    //Simulator Init

    socket.on('send_data_to_user', (data) => {
      io.emit('game_response', { type: data.type, user: data.user });
    });

    socket.on('activate_simulator_game_in_progress', (data) => {
      if (data.game_id == -1) {
        io.emit('game_response', {
          type: 'list_game_in_progess_simulator',
          total_result: 1,
          total_page: 1,
          page: 1,
          data: []
        });
      } else {
        Games.aggregate()
          .match({
            _id: mongoose.Types.ObjectId(data.game_id)
          })
          .lookup({
            from: 'teams',
            localField: 'AwayTeam',
            foreignField: 'Key',
            as: 'AwayTeam'
          })
          .lookup({
            from: 'teams',
            localField: 'HomeTeam',
            foreignField: 'Key',
            as: 'HomeTeam'
          })
          .then((resp) => {
            if (resp.length > 0) {
              resp[0].Status = 'InProgress';
            }
            io.emit('game_response', {
              type: 'list_game_in_progess_simulator',
              play_number: data.play_number,
              total_result: 1,
              total_page: 1,
              page: 1,
              data: resp
            });
          });
      }
    });

    socket.on('get_simulator_game_data', () => {
      this.fetchGames(['InProgress'], socket, 1, 20);
    });

    socket.on('set_simulator_roll_lastplay_v2', (data) => {
      this.simulatecheckPlayByPlayv2(io, socket, data);
    });

    socket.on('set_simulator_roll_lastplay_v3', (data) => {
      this.simulatecheckPlayByPlayv2(io, socket, data);
    });

    socket.on('load_simulator_game_table', (data) => {
      const verify_token_result = VerifyTokenSocket(data.token);
      if (verify_token_result.success == true) {
        this.loadCurrentGameState(io, data.play_number, data.game_id);
      }
    });

    socket.on('load_runner', (data) => {
      const verify_token_result = VerifyTokenSocket(data.token);
      if (verify_token_result.success == true) {
        this.load_runner(socket, data.Runner1ID, data.game_id);
      }
    });

    socket.on('distribute_play', (data) => {
      if (!data.play || !data.game) return;
      // if (!data.game) return;
      this.distributePlayByPlay(data && data.play ? data.play : null, data.game, io, socket);
    });
  } //end

  static load_runner(socket, Runner1ID, GameID) {
    Players.findOne({ PlayerID: Runner1ID }).then((data) => {
      socket.emit('game_response', {
        type: 'load_runner1',
        game_id: GameID,
        data: data
      });
    });
  }

  static async get_game_history(socket, user_id, page) {
    var limit = 2;
    var total_page = 0;
    var skip = 0;
    var filter = {
      user: mongoose.Types.ObjectId(user_id)
    };

    if (page) {
      skip = (page - 1) * limit;
    }
    GameTable.countDocuments(filter, async (err, total) => {
      GameTable.aggregate()
        .match(filter)
        .lookup({
          from: 'games',
          localField: 'games',
          foreignField: '_id',
          as: 'games'
        })
        .unwind({
          path: '$games'
        })
        .project({
          total_win: 1,
          total_lose: 1,
          _id: 1,
          total_bets: 1,
          'games.Status': 1,
          'games.HomeTeam': 1,
          'games.AwayTeam': 1,
          'games.AwayTeamRuns': 1,
          'games.HomeTeamRuns': 1,
          created_at: 1
        })
        .sort('-created_at')
        .skip(skip)
        .limit(limit)
        .then(async (data) => {
          total_page = Math.ceil(total / limit);
          if (data.length > 0) {
            for (var i = 0; i < data.length; i++) {
              data[i].total_bets = await Bets.find({
                user: user_id,
                game_table: data[i]._id
              })
                .then(async (b) => {
                  var gameTotal = 0;
                  for (var x = 0; x < b.length; x++) {
                    gameTotal += b[x].amount

                    if (x == b.length - 1) {
                      return gameTotal;
                    }
                  }
                })
                .catch((err) => {
                });
            }
          }

          socket.emit('game_response', {
            type: 'list_game_history',
            total_result: total,
            total_page: total_page,
            page: page == 0 ? 1 : page,
            data: data
          });
        })
        .catch((err) => {
          //error
        });
    });
  }

  static fetchGames(status, socket, p, l) {
    var limit = l ? l : 5;
    var page = p ? p : 1;
    var total_page = 0;
    var skip = 0;
    var filter = {};

    // filter by status
    filter.Status = {
      $in: status
    };

    // filter by date
    filter.DateTime = {
      $gte: new Date(
        momentTZ().tz('America/New_York').subtract(1, 'days').startOf('day')
      )
    };

    if (page) {
      skip = (page - 1) * limit;
    }

    Games.countDocuments(filter, (err, total) => {
      Games.aggregate()
        .match(filter)
        .lookup({
          from: 'teams',
          localField: 'AwayTeam',
          foreignField: 'Key',
          as: 'AwayTeam'
        })
        .lookup({
          from: 'teams',
          localField: 'HomeTeam',
          foreignField: 'Key',
          as: 'HomeTeam'
        })
        .sort('DateTime')
        .skip(skip)
        .limit(limit)
        .then((data) => {
          // data.sort(function compare(a, b) {
          //     var dateA = new Date(a.DateTime);
          //     var dateB = new Date(b.DateTime);
          //     return dateA - dateB;
          // });

          total_page = Math.ceil(total / limit);

          // console.log('socket emit: game_response list_game_in_progess'); console.trace(); // TODO: Remove
          socket.emit('game_response', {
            type: 'list_game_in_progess',
            total_result: total,
            total_page: total_page,
            page: page == 0 ? 1 : page,
            data: data
          });
        });
    });
  }

  static createGameTable(user_id, socket, games) {
    GameTable.findOne(
      {
        user: user_id,
        games: mongoose.Types.ObjectId(games)
      },
      (err, data) => {
        if (!data) {
          GameTable.create(
            {
              user: user_id,
              games: mongoose.Types.ObjectId(games),
              status: 0
            },
            (err, data) => {
              // console.trace(); console.log('game_response create_game'); // TODO: Remove
              socket.emit('game_response', {
                type: 'create_game',
                data: data
              });
            }
          );
        } else {
          // console.trace(); console.log('game_response create_game'); // TODO: Remove
          socket.emit('game_response', {
            type: 'create_game',
            data: data
          });
        }
      }
    );
  }

  static async loadGameTable(socket, user_id, games) {
    return await GameTable.findOne({
      user: user_id,
      games: mongoose.Types.ObjectId(games)
    }).then(async (data) => {
      return await Bets.find({
        user: user_id,
        game_table: data.id
      }).then((b) => {
        var total_bets = 0;
        if (b.length > 0) {
          for (var x = 0; x < b.length; x++) {
            total_bets += b[x].amount

            if (x == b.length - 1) {
              // console.trace(); console.log('game_response upate_game'); // TODO: Remove
              socket.emit('game_response', {
                type: 'update_game',
                data: {
                  games: data.games,
                  max_pass_line_bets: data.max_pass_line_bets,
                  status: data.status,
                  total_last_passline: data.total_last_passline,
                  total_lose: data.total_lose,
                  total_win: data.total_win,
                  user: data.user,
                  _id: data._id,
                  total_bets: total_bets
                }
              });
              return true;
            }
          }
        } else {
          var d = data
          d.total_bets = total_bets
          // console.trace(); console.log('game_response update_game'); // TODO: Remove
          socket.emit('game_response', {
            type: 'update_game',
            data: {
              games: data.games,
              max_pass_line_bets: data.max_pass_line_bets,
              status: data.status,
              total_last_passline: data.total_last_passline,
              total_lose: data.total_lose,
              total_win: data.total_win,
              user: data.user,
              _id: data._id,
              total_bets: total_bets
            }
          });
          return true;
        }

      });
    });
  }

  static async getBets(socket, user_id, game_table) {
    console.log("get bets")
    var user_balance = await UserBalanceService.getBalance(user_id);
    const current_total_bets = await this.getTotalCurrentBets(
      user_id,
      game_table,
      true
    );
    const user_remaining_balance = user_balance.remaining - current_total_bets;
    console.log(user_remaining_balance, user_balance.remaining, current_total_bets)

    return await Bets.find({
      user: user_id,
      game_table: game_table,
      status: 0
    }).then((data) => {
      //check if 2 out rules notify user
      var is2outRule = false;
      var hasPassline = false;
      // console.log("Bet placed:")
      // console.log(data)
      // for (var i = 0; i < data.length; i++) {
      //     if (["ground_out", "fly_out", "k", "infield_fly"].indexOf(data[i].button_pos) != -1 && data[i].place == "passline") {
      //         hasPassline = true;
      //     }
      //     if (hasPassline && ["ground_out", "fly_out", "k", "infield_fly"].indexOf(data[i].place) != -1) {
      //         is2outRule = true;
      //     }
      // }

      // if (
      //   data.findIndex(
      //     (x) =>
      //       ['ground_out', 'fly_out', 'k', 'infield_fly'].indexOf(
      //         x.button_pos
      //       ) != -1 &&
      //       x.place == 'passline' &&
      //       x.isOdds == false
      //   ) != -1
      // ) {
      //   if (
      //     data.findIndex(
      //       (x) =>
      //         ['ground_out', 'fly_out', 'k', 'infield_fly'].indexOf(x.place) !=
      //         -1
      //     ) != -1
      //   ) {
      //     is2outRule = true;
      //   }
      // }

      // console.trace(); console.log('game_response'); // TODO: Remove
      socket.emit('game_response', {
        type: 'bets',
        data: data,
        user_balance: user_balance.remaining,
        user_remaining_balance: user_remaining_balance,
      });



      // if (is2outRule) {
      //   socket.emit('game_response', {
      //     type: 'notify_2_out_rule',
      //     message:
      //       'There are now 2 Outs and your Pass Line and Come Line bets cannot both win. Please choose which bet you would like to keep active.',
      //     bets: data,
      //     game_table: game_table
      //   });
      // }
      // return true;
    });
  }

  static async getDiamonds(socket, user_id) {
    console.log("get diamonds")
    var user_diamonds = await UserDiamondsService.getDiamonds(user_id);
    socket.emit('game_response', {
      type: 'diamonds',
      user_remaining_diamonds: user_diamonds.remaining
    });
  }

  static async onDeleteBets(
    socket,
    user_id,
    game_table,
    place,
    balls,
    strikes,
    deleteNow = false
  ) {

    // if(deleteNow) {
    //   return await Bets.deleteOne({
    //     user: user_id,
    //     game_table: game_table,
    //     place: place
    //   })
    //     .then(async (data) => {
    //       console.log("data")
    //       // console.log(data)
    //       // return await this.getBets(socket, user_id, game_table);
    //     })
    //     .catch((err) => {
    //       socket.emit('game_response', {
    //         type: 'error_notification',
    //         message: 'Could not place a bet, please try again.'
    //       });
    //     });
    // }

    const game_table_obj = await GameTable.findById(game_table).then((data) => {
      return data;
    });
    if (game_table_obj.games != null) {
      const game_table_play = await this.get_last_game_table_play(
        game_table_obj.games,
        99999
      );

      //const last_play = await Plays.findOne({ PlayID: game_table_play.PlayID }).then(data => { return data; });

      const result = game_table_play.button_pos;

      //    const bets = await Bets.find({ user: mongoose.Types.ObjectId(user_id) })
      const bets = await Bets.find({
        user: user_id,
        game_table: game_table,
        status: 0
      });



      // var twoOutRule = false;
      // var total_outs = 0;
      // var hasPassline = false;
      // for (var i = 0; i < bets.length; i++) {
      //     if (["ground_out", "fly_out", "k", "infield_fly"].indexOf(bets[i].button_pos) != -1 && bets[i].place == "passline") {
      //         hasPassline = true;
      //         total_outs++;
      //     }
      //     if (hasPassline && ["ground_out", "fly_out", "k", "infield_fly"].indexOf(bets[i].place) != -1) {
      //         total_outs++;
      //     }

      // }

      // if (total_outs >= 2) {
      //     twoOutRule = true;
      // }

      // let is2outRule = false;
      // if (
      //   bets.findIndex(
      //     (x) =>
      //       ['ground_out', 'fly_out', 'k', 'infield_fly'].indexOf(
      //         x.button_pos
      //       ) != -1 && x.place == 'passline'
      //   ) != -1
      // ) {
      //   if (
      //     bets.findIndex(
      //       (x) =>
      //         ['ground_out', 'fly_out', 'k', 'infield_fly'].indexOf(x.place) !=
      //         -1
      //     ) != -1
      //   ) {
      //     is2outRule = true;
      //   }
      // }

      // if (balls > 0 && strikes > 0 && is2outRule == false) {
      if (balls > 0 && strikes > 0) {
        socket.emit('game_response', {
          type: 'error_notification',
          message: 'You are not allowed to remove active bets'
        });
        return false;
      }

      // if (
      //   game_table_play.button_on == true &&
      //   place == 'passline' &&
      //   is2outRule == false
      // ) {
      if (
        game_table_play.button_on == true &&
        place == 'passline'
      ) {
        socket.emit('game_response', {
          type: 'error_notification',
          message: 'You are not allowed to remove active bets'
        });
        return false;
      } //end
      // if (
      //   game_table_play.button_on == true &&
      //   place != 'come' &&
      //   place != 'place_8_ways' &&
      //   is2outRule == false
      // ) {
      if (
        game_table_play.button_on == true &&
        place != 'come' &&
        place != 'place_8_ways'
      ) {
        socket.emit('game_response', {
          type: 'error_notification',
          message: 'You are not allowed to remove active bets'
        });
        return false;
      } ///end
      /* remove 2 out rules
            if (["hit", "bb"].indexOf(place) != -1) {
                socket.emit('game_response', {
                    type: "error_notification",
                    message: "You are not allowed to remove active bets"
                });
                return false;
            }///end

            if (total_outs < 2 && twoOutRule == false) {
                socket.emit('game_response', {
                    type: "error_notification",
                    message: "You are not allowed to remove active bets"
                });
                return false;
            }*/
    } //end

    return await Bets.findOneAndDelete({
      user: user_id,
      game_table: game_table,
      place: place
    })
      .then(async (data) => {
        console.log('Delete bets: ', data);
        return await this.getBets(socket, user_id, game_table);
      })
      .catch((err) => {
        socket.emit('game_response', {
          type: 'error_notification',
          message: 'Could not place a bet, please try again.'
        });
      });
  }

  static async onMoveComeBet(
    io,
    socket,
    user_id,
    game_table,
    newPlayId,
    play_id,
    place,
    number_of_outs
  ) {
    const filter = {
      status: 0,
      user: user_id,
      game_table: game_table,
      place: 'come',
      plays: mongoose.Types.ObjectId(play_id)
    }; //end

    if (place == '') {
      return false;
    }

    return await Bets.findOne(filter).then(async (data) => {
      if (data) {
        let h = data.history && data.history.length > 0 ? data.history : [];
        h.push({
          result: place,
          playId: newPlayId,
          status: data.status,
          win: data.win
        })

        await Bets.updateOne({ _id: mongoose.Types.ObjectId(data._id) }, {
          $set: {
            number_of_outs: number_of_outs,
            place: place
          }
        })
        // await this.onPlaceBets(
        //   socket,
        //   user_id,
        //   game_table,
        //   play_id,
        //   place,
        //   data.amount,
        //   data.last_selected_chip,
        //   false,
        //   'none',
        //   number_of_outs
        // );
        // await Bets.deleteOne(filter).then((data) => { });
        io.emit('game_response', {
          type: 'reload_boards',
          game_table_id: game_table
        });
      }
      return true;
    });
  }

  static async getTotalCurrentBets(user_id, game_table, hasCome) {
    var filter;
    if (hasCome == true) {
      filter = {
        user: mongoose.Types.ObjectId(user_id),
        game_table: mongoose.Types.ObjectId(game_table),
        status: 0
      };
    } else {
      filter = {
        user: mongoose.Types.ObjectId(user_id),
        game_table: mongoose.Types.ObjectId(game_table),
        status: 0,
        place: { $ne: 'come' }
      };
    }
    return await Bets.aggregate()
      .match(filter)
      .group({
        _id: null,
        total: {
          $sum: '$amount'
        }
      })
      .then((result) => {
        if (result) {
          return result[0].total;
        }
        return 0;
      })
      .catch((err) => {
        return 0;
      });
  }

  static async getTotalCurrentDiamonds(user_id, game_table, hasCome) {
    let filter = {
      user_id: mongoose.Types.ObjectId(user_id),
      status: 4
    };
    return await Propbets.aggregate()
      .match(filter)
      .group({
        _id: null,
        total: {
          $sum: '$bet_amount'
        }
      })
      .then((result) => {
        if (result) {
          return result[0].total;
        }
        return 0;
      })
      .catch((err) => {
        return 0;
      });
  }

  static async onPlaceBets(
    socket,
    user_id,
    game_table,
    play_id,
    place,
    amount,
    last_selected_chip,
    isOdds,
    button_pos,
    number_of_outs
  ) {
    var bets_data;
    var odds_counter = 1;

    if (isOdds == true) {
      bets_data = await Bets.findOne({
        status: 0,
        user: user_id,
        game_table: game_table,
        place: place,
        isOdds: false
      }).then((data) => {
        return data;
      });
    }

    if (bets_data) {
      const odds_data = await Bets.findOne({
        status: 0,
        user: user_id,
        game_table: game_table,
        place: place,
        isOdds: true
      }).then((data) => {
        return data;
      });

      if (odds_data) {
        odds_counter = odds_data.odds_counter;
        if (odds_counter < 3) {
          odds_counter++;
        }
        // else {
        //   socket.emit('game_response', {
        //     type: 'error_notification',
        //     message: 'Maximum 3X odds have been placed.'
        //   });
        //   return false;
        // }

        if (bets_data.amount * 3 < odds_data.amount + amount) {
          socket.emit('game_response', {
            type: 'error_notification',
            message: 'Maximum 3X odds have been placed.'
          });
          return false;
        }
      }
    } //end

    if (place == 'first_to_home') {
      return await Bets.find({
        status: 0,
        user: user_id,
        game_table: game_table,
        place: place
      }).then(async (bets) => {
        const play = await Plays.findOne({ PlayID: play_id }).then((data) => {
          return data;
        });
        const balance = await UserBalanceService.getBalance(user_id);
        const current_total_bets =
          (await this.getTotalCurrentBets(user_id, game_table, false)) + amount;
        if (balance.remaining - current_total_bets < 0) {
          socket.emit('game_response', {
            type: 'error_notification',
            message: 'Could not place bets you have insufficient balance',
            tag: 'insufficient_balance'
          });
          return false;
        }
        const getPlay = await GameTablePlays.findOne({
          PlayID: play_id
        }).then((data) => {
          return data;
        });

        console.log('first_to_home: ', getPlay.runner.length);

        if (getPlay && getPlay.runner.length > 0) {
          let highestOrderNum = 0,
            index = getPlay.runner.length - 1;
          // for (let i = 0; i < getPlay.runner.length; i++) {
          //   if (highestOrderNum < getPlay.runner[i].order) {
          //     highestOrderNum = getPlay.runner[i].order;
          //     index = i;
          //   }
          // }

          var gameTable = await GameTable.findById(game_table).then((data) => {
            return data;
          });

          var game = gameTable
            ? await Games.findById(gameTable.games).then((data) => {
              return data;
            })
            : null;

          // console.log("GAMETABLE")
          // console.log(gameTable)
          // console.log(game)

          let hasBet = bets.findIndex(
            (x) =>
              String(x.first_to_home_player) ==
              String(getPlay.runner[index].hitterName)
          );

          if (hasBet != -1) {
            console.log('hasBet: ', hasBet, last_selected_chip, isOdds, number_of_outs, odds_counter);
            if (bets) {
              console.log('bets: ', bets);
              const new_amount = bets[hasBet].amount + amount;
              console.log('new_amount: ', bets[hasBet].amount, amount, new_amount);
              if (new_amount > 100) {
                socket.emit('game_response', {
                  type: 'error_notification',
                  message: 'You have reached the maximum bet limit.'
                });
                return;
              }
              return Bets.findByIdAndUpdate(bets[hasBet]._id, {
                amount: new_amount,
                last_selected_chip: last_selected_chip,
                isOdds: isOdds,
                number_of_outs: number_of_outs,
                odds_counter: odds_counter
              })
                .then(async (data) => {
                  console.log('results: ', data);
                  await this.getBets(socket, user_id, game_table);

                  return true;
                })
                .catch((err) => {
                  console.log('Here: ', err);
                  if (err) {
                    socket.emit('game_response_error', {
                      message: 'Could not place a bet, please try again.'
                    });
                    return false;
                  }
                });
            }
          } else if (
            (game && game.RunnerOnFirst) ||
            (game.RunnerOnFirst && game.RunnerOnSecond)
          ) {
            console.log('hasnotBet: ', hasBet);
            var bets_data = {
              user: user_id,
              game_table: game_table,
              plays: play._id,
              place: place,
              amount: amount,
              status: 0,
              win: false,
              last_selected_chip: last_selected_chip,
              isOdds: isOdds,
              button_pos: 'none',
              odds_counter: odds_counter,
              number_of_outs: number_of_outs,
              first_to_home_player: '',
              created_at: new Date(),
              updated_at: new Date()
            };
            bets_data.first_to_home_player = getPlay.runner[index].hitterName;
            return Bets.create(bets_data)
              .then(async (data) => {
                if (data) {
                  await this.getBets(socket, user_id, game_table);
                  return true;
                }
              })
              .catch((err) => {
                if (err) {
                  socket.emit('game_response_error', {
                    message: 'Could not place a bet, please try again.'
                  });
                  return false;
                }
              });
          }
        }

        // if (bets) {
        //   const getPlay = await GameTablePlays.findOne({
        //     PlayID: play_id
        //   }).then((data) => {
        //     return data;
        //   });

        //   console.log(getPlay.runner)

        //   if (getPlay && getPlay.runner.length > 0) {
        //     let highestOrderNum = 0,
        //       index = 0;
        //     for (let i = 0; i < getPlay.runner.length; i++) {
        //       if (highestOrderNum < getPlay.runner[i].order) {
        //         highestOrderNum = getPlay.runner[i].order;
        //         index = i;
        //       }
        //     }

        //     if (
        //       getPlay.runner[index].player_first_name +
        //         ' ' +
        //         getPlay.runner[index].player_last_name !=
        //       bets.first_to_home_player
        //     ) {
        //       var bets_data = {
        //         user: user_id,
        //         game_table: game_table,
        //         plays: play._id,
        //         place: place,
        //         amount: amount,
        //         status: 0,
        //         win: false,
        //         last_selected_chip: last_selected_chip,
        //         isOdds: isOdds,
        //         button_pos: 'none',
        //         odds_counter: odds_counter,
        //         number_of_outs: number_of_outs,
        //         first_to_home_player: '',
        //         created_at: new Date(),
        //         updated_at: new Date()
        //       };
        //       bets_data.first_to_home_player =
        //         getPlay.runner[index].player_first_name +
        //         ' ' +
        //         getPlay.runner[index].player_last_name;
        //       return Bets.create(bets_data)
        //         .then(async (data) => {
        //           if (data) {
        //             await this.getBets(socket, user_id, game_table);
        //             console.log('added first bet')
        //             return true;
        //           }
        //         })
        //         .catch((err) => {
        //           if (err) {
        //             socket.emit('game_response_error', {
        //               message: 'Could not place a bet, please try again.'
        //             });
        //             return false;
        //           }
        //         });
        //     }
        //   }
        // } else {
        //     const getPlay = await GameTablePlays.findOne({
        //         PlayID: play_id
        //       }).then((data) => {
        //         return data;
        //       });

        //     if (getPlay && getPlay.runner.length > 0) {
        //         let highestOrderNum = 0,
        //           index = 0;
        //         for (let i = 0; i < getPlay.runner.length; i++) {
        //           if (highestOrderNum < getPlay.runner[i].order) {
        //             highestOrderNum = getPlay.runner[i].order;
        //             index = i;
        //           }
        //         }
        //         console.log(getPlay.runner[index])
        //         console.log(bets.first_to_home_player)
        //         if (
        //           getPlay.runner[index].player_first_name +
        //             ' ' +
        //             getPlay.runner[index].player_last_name ==
        //           bets.first_to_home_player
        //         ) {
        //             return Bets.findByIdAndUpdate(bets._id, {
        //                 amount: new_amount,
        //                 last_selected_chip: last_selected_chip,
        //                 isOdds: false,
        //                 number_of_outs: number_of_outs,
        //                 odds_counter: odds_counter
        //               })
        //                 .then(async (data) => {
        //                   await this.getBets(socket, user_id, game_table);

        //                   return true;
        //                 })
        //                 .catch((err) => {
        //                   if (err) {
        //                     socket.emit('game_response_error', {
        //                       message: 'Could not place a bet, please try again.'
        //                     });
        //                     return false;
        //                   }
        //                 });
        //         }
        //     }
        // }
      });
    } else {
      return await Bets.findOne({
        status: 0,
        user: user_id,
        game_table: game_table,
        place: place,
        isOdds: isOdds
      })
        .then(async (bets) => {
          const play = await Plays.findOne({ PlayID: play_id }).then((data) => {
            return data;
          });
          const balance = await UserBalanceService.getBalance(user_id);
          const current_total_bets =
            (await this.getTotalCurrentBets(user_id, game_table, false)) +
            amount;
          if (balance.remaining - current_total_bets < 0) {
            socket.emit('game_response', {
              type: 'error_notification',
              message: 'Could not place bets you have insufficient balance',
              tag: 'insufficient_balance'
            });
            return false;
          }

          if (!bets) {
            const _button_pos = button_pos ? button_pos : 'none';
            var bets_data = {
              user: user_id,
              game_table: game_table,
              plays: play._id,
              place: place,
              amount: amount,
              status: 0,
              win: false,
              last_selected_chip: last_selected_chip,
              isOdds: isOdds,
              button_pos: _button_pos,
              odds_counter: odds_counter,
              number_of_outs: number_of_outs,
              first_to_home_player: '',
              created_at: new Date(),
              updated_at: new Date()
            };

            return Bets.create(bets_data)
              .then(async (data) => {
                if (data) {
                  await this.getBets(socket, user_id, game_table);
                  return true;
                }
              })
              .catch((err) => {
                if (err) {
                  socket.emit('game_response_error', {
                    message: 'Could not place a bet, please try again.'
                  });
                  return false;
                }
              });
          } else {
            const new_amount = bets.amount + amount;

            return Bets.findByIdAndUpdate(bets._id, {
              amount: new_amount,
              last_selected_chip: last_selected_chip,
              isOdds: isOdds,
              number_of_outs: number_of_outs,
              odds_counter: odds_counter
            })
              .then(async (data) => {
                await this.getBets(socket, user_id, game_table);

                return true;
              })
              .catch((err) => {
                if (err) {
                  socket.emit('game_response_error', {
                    message: 'Could not place a bet, please try again.'
                  });
                  return false;
                }
              });
          }
        })
        .catch((err) => {
          if (err) {
            socket.emit('game_response_error', {
              message: 'Could not place a bet, please try again.'
            });
            return false;
          }
        });
      // }
    } //end
  }
  /*
    Game - 1
    inning top 3
    top 4 
    */

  static async checkPlayByPlay(
    FantasyDataClient,
    io,
    socket,
    game_id,
    games,
    game_table_id,
    load_once
  ) {
    // const gCacheKey = `game-${game_id}`;
    // const gCache = nodecache.get(gCacheKey);

    // if(gCache != undefined){
    //     console.log('retreived from cache...');
    //     return gCache;
    // }

    return await Plays.findOne({ games: mongoose.Types.ObjectId(games) })
      .sort('-PlayID')
      .then(async (data) => {
        if (data) {
          data.Result = await this.simulateResultData(
            data.Result,
            data.Description
          );
          var last_game_table_plays = await this.get_last_game_table_play(
            games,
            data.PlayNumber
          );

          var button_on = false;
          var button_pos = '';
          if (last_game_table_plays) {
            if (
              data.InningNumber == last_game_table_plays.inning &&
              data.InningHalf == last_game_table_plays.inningHalf
            ) {
              button_on = last_game_table_plays.button_on;
              button_pos = last_game_table_plays.button_pos;
            } else {
              button_on = false;
              button_pos = '';
            }
          }
          var game_table_plays;
          var isNewPlay = false;
          if (last_game_table_plays == null) {
            game_table_plays = await this.save_game_table_play(
              io,
              socket,
              data,
              games,
              data.Result,
              button_on,
              button_pos,
              game
            );
            isNewPlay = true;
          } else if (data.PlayID != last_game_table_plays.PlayID) {
            game_table_plays = await this.save_game_table_play(
              io,
              socket,
              data,
              games,
              data.Result,
              button_on,
              button_pos,
              game
            );
            isNewPlay = true;
          } else {
            game_table_plays = last_game_table_plays;
          }

          var game = await Games.findById(games).then((data) => {
            return data;
          });

          const gr = {
            type: 'play_by_play',
            game_table_id: game_table_id,
            games: game,
            plays: data,
            number_of_pitches: 0,
            game_table_plays: game_table_plays,
            isFinal: false
          };

          //set User Lose
          if (game.Status == 'Final') {
            gr.isFinal = true;

            await GameTable.find({
              games: mongoose.Types.ObjectId(games)
            }).then(async (game_table_arr) => {
              for (var i = 0; i < game_table_arr.length; i++) {
                const game_table = game_table_arr[i];
                if (isNewPlay == true) {
                  await this.set_user_lose(
                    socket,
                    game_table._id,
                    game_table.user,
                    data.Result,
                    data.PlayID
                  );
                }
              }
              return true;
            });
          } //end

          if (data.Outs + data.NumberOfOutsOnPlay >= 3) {
            await GameTable.find({
              games: mongoose.Types.ObjectId(games)
            }).then(async (game_table_arr) => {
              for (var i = 0; i < game_table_arr.length; i++) {
                const game_table = game_table_arr[i];
                if (isNewPlay == true) {
                  await this.set_user_lose(
                    socket,
                    game_table._id,
                    game_table.user,
                    data.Result,
                    data.PlayID
                  );
                }
              }
              return true;
            });
          }

          // nodecache.set(gCacheKey, gr, 20);
          socket.emit('game_response', gr);
          // socket.broadcast.emit('game_response', gr);
        }
      });
  }

  static async getBatters(game_id) {
    if (game_id) {
      return Batters.aggregate().match({ game_id: mongoose.Types.ObjectId(game_id) }).lookup({
        from: 'players',
        localField: 'player_id',
        foreignField: '_id',
        as: 'Player'
      }).unwind({
        'path': "$Player"
      }).sort({ order_number: 1 }).then(r => {
        if (r) {
          return r;
        } else {
          return [];
        }
      }).catch(err => {
        return [];
      });
    } else {
      return [];
    }

  }

  static async distributePlayByPlay(play, game, io, socket) {
    if (!play || !game) return;
    // if (!game) return;

    const games = game._id;
    // if (play) {
    const data = play;
    data.noConvertedResult = play.Result;
    data.Result = await this.simulateResultData(data.Result, data.Description);
    var last_game_table_plays = await this.get_last_game_table_play(
      games,
      data.PlayNumber
    );

    var button_on = false;
    var button_pos = '';
    if (last_game_table_plays) {
      if (
        data.InningNumber == last_game_table_plays.inning &&
        data.InningHalf == last_game_table_plays.inningHalf
      ) {
        button_on = last_game_table_plays.button_on;
        button_pos = last_game_table_plays.button_pos;
      } else {
        button_on = false;
        button_pos = '';
      }
    }

    var game_table_plays;
    var isNewPlay = false;

    // console.log(data.isUndo)
    // if (data.isUndo) {
    //   game_table_plays = await this.undoBetsBoard(io,
    //     socket,
    //     data,
    //     games,
    //     data.Result,
    //     button_on,
    //     button_pos,
    //     game)

    //   // var batters = await this.getBatters(games);

    //   if(game_table_plays) {


    //     const gr = {
    //       type: 'play_by_play',
    //       // game_table_id: game_table_id,
    //       games: game,
    //       plays: data,
    //       number_of_pitches: 0,
    //       game_table_plays: game_table_plays,
    //       isFinal: false,
    //       isUndo: true
    //     };

    //     socket.broadcast.emit('game_response', gr);
    //   }
    // } else {
    if (last_game_table_plays == null) {
      game_table_plays = await this.save_game_table_play(
        io,
        socket,
        data,
        games,
        data.Result,
        button_on,
        button_pos,
        game
      );
      isNewPlay = true;
    } else if (data.PlayID != last_game_table_plays.PlayID) {
      game_table_plays = await this.save_game_table_play(
        io,
        socket,
        data,
        games,
        data.Result,
        button_on,
        button_pos,
        game
      );
      isNewPlay = true;
    } else {
      // console.log('game_table+plays equal to last_game_table_places')
      game_table_plays = last_game_table_plays;
    }

    // var game = await Games.findById(games).then(data=>{
    //     return data;
    // });

    const gr = {
      type: 'play_by_play',
      // game_table_id: game_table_id,
      games: game,
      plays: data,
      number_of_pitches: 0,
      game_table_plays: game_table_plays,
      isFinal: false
    };

    //set User Lose
    if (game.Status == 'Final') {
      gr.isFinal = true;

      await GameTable.find({ games: mongoose.Types.ObjectId(games) }).then(
        async (game_table_arr) => {
          for (var i = 0; i < game_table_arr.length; i++) {
            const game_table = game_table_arr[i];
            if (isNewPlay == true) {
              await this.set_user_lose(
                socket,
                game_table._id,
                game_table.user,
                data.Result,
                data.PlayID
              );
            }
          }
          return true;
        }
      );
    } //end

    if (
      data.Outs + data.NumberOfOutsOnPlay >= 3 ||
      (game.Balls == null && game.Strikes == null && game.Outs == null)
    ) {
      // if(game.AwayTeam == 'PIT') {
      // console.log('NULL GAME')
      // console.log(game)
      // console.log(data)
      // }
      await GameTable.find({ games: mongoose.Types.ObjectId(games) }).then(
        async (game_table_arr) => {
          for (var i = 0; i < game_table_arr.length; i++) {
            const game_table = game_table_arr[i];

            if (isNewPlay == true) {
              //   if(game.AwayTeam == 'PIT') {
              // console.log('NEW PLAY')
              //   }
              await this.set_user_lose(
                socket,
                game_table._id,
                game_table.user,
                data.Result,
                data.PlayID
              );
            }
          }
          return true;
        }
      );
    }

    await Propbets.find({ game_id: mongoose.Types.ObjectId(game.GameID) }).then(
      async (prop_bets) => {
        gr.prop_bets = prop_bets;
      }
    );

    // console.log('game_response: ', gr);

    if (gr.prop_bets && gr.prop_bets.length > 0) {
      const prop_bets = gr.prop_bets.filter(bet => bet.status !== 4);
      for (var i = 0; i < prop_bets.length; i++) {
        const prop_bet = prop_bets[i];
        if (prop_bet.player_team_options) {
          switch (prop_bet.player_team_options.key) {
            case "next_batter":
              const nextBatterName = await this.getNextBatterName(prop_bet.player_team_options.value, gr.games.GameID);
              console.log('nextBatterName: ', nextBatterName, gr.games.CurrentHitter);
              if (gr.games.CurrentHitter === nextBatterName) {
                console.log('next_batter1: ', nextBatterName, gr.games.CurrentHitter);
                this.resultCheck(io, gr, prop_bet);
              } else {
              }
              break;
            case "choose_batter":
              const nextBattersName = await this.getNextBattersName(prop_bet.player_team_options.value, gr.games.GameID);
              if (nextBattersName !== null && nextBattersName.includes(gr.games.CurrentHitter)) {
                this.resultCheck(io, gr, prop_bet);
              } else {
              }
              break;
            case "any_batter_this_half_inning":
              this.resultCheck(io, gr, prop_bet);
              break;
            case "team_up_bat":
              this.resultCheck(io, gr, prop_bet);
              break;
            case "team_in_field":
              this.resultCheck(io, gr, prop_bet);
              break;
          }
        }
      }
    }

    //socket.emit('game_response', gr);
    socket.broadcast.emit('game_response', gr);
    // console.log('The Play have been distributed...');
    // } 

    // else {
    //   return await GameTablePlays.create({
    //     PlayID: 0,
    //     games: mongoose.Types.ObjectId(games),
    //     result: "",
    //     button_on: 0,
    //     button_pos: "",
    //     inning: 1,
    //     inningHalf: "T",
    //     play_number: 0,
    //     check_user_winner: { status: false },
    //     runner: [],
    //     user_lose: false,
    //     created_at: new Date(),
    //     updated_at: new Date()
    //   })
    //     .then((play_table) => {
    //       return play_table;
    //     })
    //     .catch((e) => {
    //       console.log(e);
    //     });
    // }F
    // }
  }

  static async updatePropBet(io, data) {
    PropBetsService.update(io, '', data);
  }

  static async getNextBatterName(start_batter, game_id) {
    const batters = await this.getBatters(game_id);
    console.log('getNextBatterName: ', batters);
    if (batters && batters.length > 0) {
      let index = batters.findIndex(batter => batter.Player.DraftKingsName === start_batter);
      if (index >= 0 && index < batters.length - 1) {
        let nextBatter = batters[index + 1];
        return nextBatter.Player.DraftKingsName;
      } else if (index === batters.length - 1) {
        let filtered = batters.filter((batter, i, array) => array[index - 1] && batter.Player.Team === array[index - 1].Player.Team);
        return filtered[0].Player.DraftKingsName;
      }
    } else {
      return null;
    }
  }

  static async getNextBattersName(start_batter, game_id) {
    const batters = await this.getBatters(game_id);
    if (batters && batters.length > 0) {
      let index = batters.findIndex(batter => batter.Player.DraftKingsName === start_batter);
      if (index >= 0 && index < batters.length - 1) {
        let nextBatters = batters.slice(index + 1);
        return nextBatters.map(batter => batter.Player.DraftKingsName);
      } else if (index === batters.length - 1) {
        let filtered = batters.filter((batter, i, array) => array[index - 1] && batter.Player.Team === array[index - 1].Player.Team);
        return filtered.map(batter => batter.Player.DraftKingsName);;
      }

    } else {
      return null;
    }
  }

  static async resultCheck(io, resp, prop_bet) {
    var isCheckable = false;
    switch (prop_bet.will_result_in) {
      case "Get a Hit":
        if (resp.plays.noConvertedResult === "Single" || resp.plays.noConvertedResult === "Double" || resp.plays.noConvertedResult === "Triple" || resp.plays.noConvertedResult === "Home Run") {
          isCheckable = true;
        } else {

        }
        break;
      case "Reach Base":
        if (resp.plays.noConvertedResult === "Single" || resp.plays.noConvertedResult === "Double" || resp.plays.noConvertedResult === "Triple" || resp.plays.noConvertedResult === "Home Run" || resp.plays.noConvertedResult === "Walk") {
          isCheckable = true;
        } else {

        }
        break;
      case "Hit a Single":
        if (resp.plays.noConvertedResult === "Single") {
          isCheckable = true;
        } else {

        }
        break;
      case "Hit a Double":
        if (resp.plays.noConvertedResult === "Double") {
          isCheckable = true;
        } else {

        }
        break;
      case "Hit a Triple":
        if (resp.plays.noConvertedResult === "Triple") {
          isCheckable = true;
        } else {

        }
        break;
      case "Hit a Home Run":
        if (resp.plays.noConvertedResult === "Home Run") {
          isCheckable = true;
        } else {

        }
        break;
      case "Strike Out":
        if (resp.plays.noConvertedResult === "Sitrikeout Swinging" || resp.plays.noConvertedResult === "Sitrikeout Looking" || resp.plays.noConvertedResult === "Sitrikeout Bunting" || resp.plays.noConvertedResult === "Advanced On Strikeout") {
          isCheckable = true;
        } else {

        }
        break;
      case "Get a Walk":
        if (resp.plays.noConvertedResult === "Walk") {
          isCheckable = true;
        } else {

        }
        break;
      case "Steal A Base":
        break;
      case "Get Picked Off":
        break;
      case "Get Caught Stealing":
        break;
      case "Get an At Bat":
        break;
      case "Be Hit By a Pitch":
        if (resp.plays.noConvertedResult === "Hit By Pitch") {
          isCheckable = true;
        } else {

        }
        break;
      case "Hit into a Double Play":
        if (resp.plays.noConvertedResult === "Double Play") {
          isCheckable = true;
        } else {

        }
        break;
      case "Reach Base on an Error":
        if (resp.plays.noConvertedResult === "Reached on an Error") {
          isCheckable = true;
        } else {

        }
        break;
      case "Foul Out":
        if (resp.plays.noConvertedResult === "Foul Out") {
          isCheckable = true;
        } else {

        }
        break;
      case "Ground Out":
        if (resp.plays.noConvertedResult === "Ground Out") {
          isCheckable = true;
        } else {

        }
        break;
      case "Get Intentionally Walked":
        if (resp.plays.noConvertedResult === "Intentional Walk") {
          isCheckable = true;
        } else {

        }
        break;
      case "Strikeout Bunting":
        if (resp.plays.noConvertedResult === "Strikeout Bunting") {
          isCheckable = true;
        } else {

        }
        break;
      case "Strikeout Looking":
        if (resp.plays.noConvertedResult === "Strikeout Looking") {
          isCheckable = true;
        } else {

        }
        break;
      case "Strikeout Swinging":
        if (resp.plays.noConvertedResult === "Strikeout Swinging") {
          isCheckable = true;
        } else {

        }
        break;
      case "Hit into a Triple Play":
        if (resp.plays.noConvertedResult === "Triple Play") {
          isCheckable = true;
        } else {

        }
        break;
      case "Win The Game":
        if (prop_bet.player_team_options.value === resp.games.HomeTeam && resp.games.InningHalf === "B") {
          if ((resp.games.HomeTeamRuns - resp.games.AwayTeamRuns) > 0) {
            isCheckable = true;
          } else {
            if (resp.games.Status === 'Final') {
              const data = {
                _id: prop_bet._id,
                status: 4,
                type: 2,
                ended_at: new Date()
              };
              this.updatePropBet(io, data);
            }
          }
        } else if (prop_bet.player_team_options.value === resp.games.AwayTeam && resp.games.InningHalf === "T") {
          if ((resp.games.AwayTeamRuns - resp.games.HomeTeamRuns) > 0) {
            isCheckable = true;
          } else {
            if (resp.games.Status === 'Final') {
              const data = {
                _id: prop_bet._id,
                status: 4,
                type: 2,
                ended_at: new Date()
              };
              this.updatePropBet(io, data);
            }
          }
        }
        break;
      case "Win by > 1 Run":
        if (prop_bet.player_team_options.value === resp.games.HomeTeam && resp.games.InningHalf === "B") {
          if ((resp.games.HomeTeamRuns - resp.games.AwayTeamRuns) >= 1) {
            isCheckable = true;
          } else {
            if (resp.games.Status === 'Final') {
              const data = {
                _id: prop_bet._id,
                status: 4,
                type: 2,
                ended_at: new Date()
              };
              this.updatePropBet(io, data);
            }
          }
        } else if (prop_bet.player_team_options.value === resp.games.AwayTeam && resp.games.InningHalf === "T") {
          if ((resp.games.AwayTeamRuns - resp.games.HomeTeamRuns) >= 1) {
            isCheckable = true;
          } else {
            if (resp.games.Status === 'Final') {
              const data = {
                _id: prop_bet._id,
                status: 4,
                type: 2,
                ended_at: new Date()
              };
              this.updatePropBet(io, data);
            }
          }
        }
        break;
      case "Win by > 2 Runs":
        if (prop_bet.player_team_options.value === resp.games.HomeTeam && resp.games.InningHalf === "B") {
          if ((resp.games.HomeTeamRuns - resp.games.AwayTeamRuns) >= 2) {
            isCheckable = true;
          } else {
            if (resp.games.Status === 'Final') {
              const data = {
                _id: prop_bet._id,
                status: 4,
                type: 2,
                ended_at: new Date()
              };
              this.updatePropBet(io, data);
            }
          }
        } else if (prop_bet.player_team_options.value === resp.games.AwayTeam && resp.games.InningHalf === "T") {
          if ((resp.games.AwayTeamRuns - resp.games.HomeTeamRuns) >= 2) {
            isCheckable = true;
          } else {
            if (resp.games.Status === 'Final') {
              const data = {
                _id: prop_bet._id,
                status: 4,
                type: 2,
                ended_at: new Date()
              };
              this.updatePropBet(io, data);
            }
          }
        }
        break;
      case "Win by > 3 runs":
        if (prop_bet.player_team_options.value === resp.games.HomeTeam && resp.games.InningHalf === "B") {
          if ((resp.games.HomeTeamRuns - resp.games.AwayTeamRuns) >= 3) {
            isCheckable = true;
          } else {
            if (resp.games.Status === 'Final') {
              const data = {
                _id: prop_bet._id,
                status: 4,
                type: 2,
                ended_at: new Date()
              };
              this.updatePropBet(io, data);
            }
          }
        } else if (prop_bet.player_team_options.value === resp.games.AwayTeam && resp.games.InningHalf === "T") {
          if ((resp.games.AwayTeamRuns - resp.games.HomeTeamRuns) >= 3) {
            isCheckable = true;
          } else {
            if (resp.games.Status === 'Final') {
              const data = {
                _id: prop_bet._id,
                status: 4,
                type: 2,
                ended_at: new Date()
              };
              this.updatePropBet(io, data);
            }
          }
        }
        break;
      case "Combine with the other team to score at least 5 runs":
        if (prop_bet.player_team_options.value === resp.games.HomeTeam && resp.games.InningHalf === "B") {
          if ((resp.games.HomeTeamRuns + resp.games.AwayTeamRuns) >= 5) {
            isCheckable = true;
          } else {
            if (resp.games.Status === 'Final') {
              const data = {
                _id: prop_bet._id,
                status: 4,
                type: 2,
                ended_at: new Date()
              };
              this.updatePropBet(io, data);
            }
          }
        } else if (prop_bet.player_team_options.value === resp.games.AwayTeam && resp.games.InningHalf === "T") {
          if ((resp.games.HomeTeamRuns + resp.games.AwayTeamRuns) >= 5) {
            isCheckable = true;
          } else {
            if (resp.games.Status === 'Final') {
              const data = {
                _id: prop_bet._id,
                status: 4,
                type: 2,
                ended_at: new Date()
              };
              this.updatePropBet(io, data);
            }
          }
        }
        break;
      case "Combine with the other team to score at least 6 runs":
        if (prop_bet.player_team_options.value === resp.games.HomeTeam && resp.games.InningHalf === "B") {
          if ((resp.games.HomeTeamRuns + resp.games.AwayTeamRuns) >= 6) {
            isCheckable = true;
          } else {
            if (resp.games.Status === 'Final') {
              const data = {
                _id: prop_bet._id,
                status: 4,
                type: 2,
                ended_at: new Date()
              };
              this.updatePropBet(io, data);
            }
          }
        } else if (prop_bet.player_team_options.value === resp.games.AwayTeam && resp.games.InningHalf === "T") {
          if ((resp.games.HomeTeamRuns + resp.games.AwayTeamRuns) >= 6) {
            isCheckable = true;
          } else {
            if (resp.games.Status === 'Final') {
              const data = {
                _id: prop_bet._id,
                status: 4,
                type: 2,
                ended_at: new Date()
              };
              this.updatePropBet(io, data);
            }
          }
        }
        break;
      case "Combine with the other team to score at least 7 runs":
        if (prop_bet.player_team_options.value === resp.games.HomeTeam && resp.games.InningHalf === "B") {
          if ((resp.games.HomeTeamRuns + resp.games.AwayTeamRuns) >= 7) {
            isCheckable = true;
          } else {
            if (resp.games.Status === 'Final') {
              const data = {
                _id: prop_bet._id,
                status: 4,
                type: 2,
                ended_at: new Date()
              };
              this.updatePropBet(io, data);
            }
          }
        } else if (bet.player_team_options.value === resp.games.AwayTeam && resp.games.InningHalf === "T") {
          if ((resp.games.HomeTeamRuns + resp.games.AwayTeamRuns) >= 7) {
            isCheckable = true;
          } else {
            if (resp.games.Status === 'Final') {
              const data = {
                _id: prop_bet._id,
                status: 4,
                type: 2,
                ended_at: new Date()
              };
              this.updatePropBet(io, data);
            }
          }
        }
        break;
      case "Combine with the other team to score at least 8 runs":
        if (prop_bet.player_team_options.value === resp.games.HomeTeam && resp.games.InningHalf === "B") {
          if ((resp.games.HomeTeamRuns + resp.games.AwayTeamRuns) >= 8) {
            isCheckable = true;
          } else {
            if (resp.games.Status === 'Final') {
              const data = {
                _id: prop_bet._id,
                status: 4,
                type: 2,
                ended_at: new Date()
              };
              this.updatePropBet(io, data);
            }
          }
        } else if (bet.player_team_options.value === resp.games.AwayTeam && resp.games.InningHalf === "T") {
          if ((resp.games.HomeTeamRuns + resp.games.AwayTeamRuns) >= 8) {
            isCheckable = true;
          } else {
            if (resp.games.Status === 'Final') {
              const data = {
                _id: prop_bet._id,
                status: 4,
                type: 2,
                ended_at: new Date()
              };
              this.updatePropBet(io, data);
            }
          }
        }
        break;
      case "Combine with the other team to score at least 9 runs":
        if (prop_bet.player_team_options.value === resp.games.HomeTeam && resp.games.InningHalf === "B") {
          if ((resp.games.HomeTeamRuns + resp.games.AwayTeamRuns) >= 9) {
            isCheckable = true;
          } else {
            if (resp.games.Status === 'Final') {
              const data = {
                _id: prop_bet._id,
                status: 4,
                type: 2,
                ended_at: new Date()
              };
              this.updatePropBet(io, data);
            }
          }
        } else if (prop_bet.player_team_options.value === resp.games.AwayTeam && resp.games.InningHalf === "T") {
          if ((resp.games.HomeTeamRuns + resp.games.AwayTeamRuns) >= 9) {
            isCheckable = true;
          } else {
            if (resp.games.Status === 'Final') {
              const data = {
                _id: prop_bet._id,
                status: 4,
                type: 2,
                ended_at: new Date()
              };
              this.updatePropBet(io, data);
            }
          }
        }
        break;
      case "Combine with the other team to score at least 10 runs":
        if (prop_bet.player_team_options.value === resp.games.HomeTeam && resp.games.InningHalf === "B") {
          if ((resp.games.HomeTeamRuns + resp.games.AwayTeamRuns) >= 10) {
            isCheckable = true;
          } else {
            if (resp.games.Status === 'Final') {
              const data = {
                _id: prop_bet._id,
                status: 4,
                type: 2,
                ended_at: new Date()
              };
              this.updatePropBet(io, data);
            }
          }
        } else if (prop_bet.player_team_options.value === resp.games.AwayTeam && resp.games.InningHalf === "T") {
          if ((resp.games.HomeTeamRuns + resp.games.AwayTeamRuns) >= 10) {
            isCheckable = true;
          } else {
            if (resp.games.Status === 'Final') {
              const data = {
                _id: prop_bet._id,
                status: 4,
                type: 2,
                ended_at: new Date()
              };
              this.updatePropBet(io, data);
            }
          }
        }
        break;
      case "Score 1 Run":
        if (prop_bet.player_team_options.value === resp.games.HomeTeam && resp.games.InningHalf === "B") {
          if (resp.games.Inning > prop_bet.inning) {
            if ((resp.games.HomeTeamRuns - prop_bet.homeTeamScore) >= 1) {
              isCheckable = true;
            } else {
              if (resp.games.Status === 'Final') {
                const data = {
                  _id: prop_bet._id,
                  status: 4,
                  type: 2,
                  ended_at: new Date()
                };
                this.updatePropBet(io, data);
              }
            }
          }
        } else if (prop_bet.player_team_options.value === resp.games.AwayTeam && resp.games.InningHalf === "T") {
          if (resp.games.Inning > prop_bet.inning) {
            if ((resp.games.AwayTeamRuns - prop_bet.awayTeamScore) >= 1) {
              isCheckable = true;
            } else {
              if (resp.games.Status === 'Final') {
                const data = {
                  _id: prop_bet._id,
                  status: 4,
                  type: 2,
                  ended_at: new Date()
                };
                this.updatePropBet(io, data);
              }
            }
          }
        }
        break;
      case "Score 2 Runs":
        if (prop_bet.player_team_options.value === resp.games.HomeTeam && resp.games.InningHalf === "B") {
          if (resp.games.Inning > prop_bet.inning) {
            if ((resp.games.HomeTeamRuns - prop_bet.homeTeamScore) >= 2) {
              isCheckable = true;
            } else {
              if (resp.games.Status === 'Final') {
                const data = {
                  _id: prop_bet._id,
                  status: 4,
                  type: 2,
                  ended_at: new Date()
                };
                this.updatePropBet(io, data);
              }
            }
          }
        } else if (prop_bet.player_team_options.value === resp.games.AwayTeam && resp.games.InningHalf === "T") {
          if (resp.games.Inning > prop_bet.inning) {
            if ((resp.games.AwayTeamRuns - prop_bet.awayTeamScore) >= 2) {
              isCheckable = true;
            } else {
              if (resp.games.Status === 'Final') {
                const data = {
                  _id: prop_bet._id,
                  status: 4,
                  type: 2,
                  ended_at: new Date()
                };
                this.updatePropBet(io, data);
              }
            }
          }
        }
        break;
      case "Score 3 Runs":
        if (prop_bet.player_team_options.value === resp.games.HomeTeam && resp.games.InningHalf === "B") {
          if (resp.games.Inning > prop_bet.inning) {
            if ((resp.games.HomeTeamRuns - prop_bet.homeTeamScore) >= 3) {
              isCheckable = true;
            } else {
              if (resp.games.Status === 'Final') {
                const data = {
                  _id: prop_bet._id,
                  status: 4,
                  type: 2,
                  ended_at: new Date()
                };
                this.updatePropBet(io, data);
              }
            }
          }
        } else if (bet.player_team_options.value === resp.games.AwayTeam && resp.games.InningHalf === "T") {
          if (resp.games.Inning > prop_bet.inning) {
            if ((resp.games.AwayTeamRuns - prop_bet.awayTeamScore) >= 3) {
              isCheckable = true;
            } else {
              if (resp.games.Status === 'Final') {
                const data = {
                  _id: prop_bet._id,
                  status: 4,
                  type: 2,
                  ended_at: new Date()
                };
                this.updatePropBet(io, data);
              }
            }
          }
        }
        break;
      case "Score 4 Runs":
        if (prop_bet.player_team_options.value === resp.games.HomeTeam && resp.games.InningHalf === "B") {
          if (resp.games.Inning > prop_bet.inning) {
            if ((resp.games.HomeTeamRuns - prop_bet.homeTeamScore) >= 4) {
              isCheckable = true;
            } else {
              if (resp.games.Status === 'Final') {
                const data = {
                  _id: prop_bet._id,
                  status: 4,
                  type: 2,
                  ended_at: new Date()
                };
                this.updatePropBet(io, data);
              }
            }
          }
        } else if (prop_bet.player_team_options.value === resp.games.AwayTeam && resp.games.InningHalf === "T") {
          if (resp.games.Inning > prop_bet.inning) {
            if ((resp.games.AwayTeamRuns - prop_bet.awayTeamScore) >= 4) {
              isCheckable = true;
            } else {
              if (resp.games.Status === 'Final') {
                const data = {
                  _id: prop_bet._id,
                  status: 4,
                  type: 2,
                  ended_at: new Date()
                };
                this.updatePropBet(io, data);
              }
            }
          }
        }
        break;
      case "Score 5 Runs":
        if (prop_bet.player_team_options.value === resp.games.HomeTeam && resp.games.InningHalf === "B") {
          if (resp.games.Inning > prop_bet.inning) {
            if ((resp.games.HomeTeamRuns - prop_bet.homeTeamScore) >= 5) {
              isCheckable = true;
            } else {
              if (resp.games.Status === 'Final') {
                const data = {
                  _id: prop_bet._id,
                  status: 4,
                  type: 2,
                  ended_at: new Date()
                };
                this.updatePropBet(io, data);
              }
            }
          }
        } else if (prop_bet.player_team_options.value === resp.games.AwayTeam && resp.games.InningHalf === "T") {
          if (resp.games.Inning > prop_bet.inning) {
            if ((resp.games.AwayTeamRuns - prop_bet.awayTeamScore) >= 2) {
              isCheckable = true;
            } else {
              if (resp.games.Status === 'Final') {
                const data = {
                  _id: prop_bet._id,
                  status: 4,
                  type: 2,
                  ended_at: new Date()
                };
                this.updatePropBet(io, data);
              }
            }
          }
        }
        break;
    }
    if (isCheckable) {
      this.timeFrameCheck(io, resp, prop_bet);
    }
  }

  static async timeFrameCheck(io, resp, prop_bet) {
    var data;
    if (prop_bet.player_team_options.key === "next_batter" || prop_bet.player_team_options.key === "choose_batter") {
      switch (prop_bet.with_timeframe) {
        case "The Next At Bat":
          if (resp.games.Inning !== prop_bet.inning || resp.games.InningHalf !== prop_bet.inningHalf) {
            data = resp.games.Status = {
              _id: prop_bet._id,
              status: 4,
              type: 2,
              ended_at: new Date()
            };
          } else {
            console.log("The Next At Bat: ");
            data = resp.games.Status === "InProgress" ? {
              _id: prop_bet._id,
              status: 4,
              type: 1,
              ended_at: new Date()
            } : {
              _id: prop_bet._id,
              status: 4,
              type: 2,
              ended_at: new Date()
            };
          }
          break;
        case "The Upcoming Inning":
          console.log("The Upcoming Inning: ");
          if (resp.games.Inning === prop_bet.inning) {
            if (prop_bet.inningHalf === "T" && resp.games.InningHalf === "B") {
              data = resp.games.Status === "InProgress" ? {
                _id: prop_bet._id,
                status: 4,
                type: 1,
                ended_at: new Date()
              } : {
                _id: prop_bet._id,
                status: 4,
                type: 2,
                ended_at: new Date()
              };
            } else {
              data = {
                _id: prop_bet._id,
                status: 4,
                type: 2,
                ended_at: new Date()
              };
            }
          } else if (resp.games.Inning > prop_bet.inning) {
            if (prop_bet.inningHalf === "B") {
              data = resp.games.Status === "InProgress" ? {
                _id: prop_bet._id,
                status: 4,
                type: 1,
                ended_at: new Date()
              } : {
                _id: prop_bet._id,
                status: 4,
                type: 2,
                ended_at: new Date()
              };
            } else {
              data = {
                _id: prop_bet._id,
                status: 4,
                type: 2,
                ended_at: new Date()
              };
            }
          }
          break;
        case "This Game":
          console.log("This Game: ");
          data = resp.games.Status === "InProgress" ? {
            _id: prop_bet._id,
            status: 4,
            type: 1,
            ended_at: new Date()
          } : {
            _id: prop_bet._id,
            status: 4,
            type: 2,
            ended_at: new Date()
          };
          break;
      }
    } else if (prop_bet.player_team_options.key === "any_batter_this_half_inning") {
      if (prop_bet.with_timeframe === "The Upcoming Inning") {
        if (resp.games.Inning > prop_bet.inning) {
          data = resp.games.Status === "InProgress" ? {
            _id: prop_bet._id,
            status: 4,
            type: 1,
            ended_at: new Date()
          } : {
            _id: prop_bet._id,
            status: 4,
            type: 2,
            ended_at: new Date()
          };
        } else {
          data = {
            _id: prop_bet._id,
            status: 4,
            type: 2,
            ended_at: new Date()
          };
        }
      }
    } else {
      if (prop_bet.will_result_in.includes("Win") || prop_bet.will_result_in.includes("Combine")) {
        if (prop_bet.with_timeframe === "This Game" && resp.games.Status === "Final") {
          console.log("This Game TimeFrame: ");
          data = {
            _id: prop_bet._id,
            status: 4,
            type: 1,
            ended_at: new Date()
          };
        }
      } else {
        if (prop_bet.with_timeframe === "This Inning") {
          data = resp.games.Status === "InProgress" ? {
            _id: prop_bet._id,
            status: 4,
            type: 1,
            ended_at: new Date()
          } : {
            _id: prop_bet._id,
            status: 4,
            type: 2,
            ended_at: new Date()
          };
        }
      }
    }
    this.updatePropBet(io, data);
  }

  static async undoBetsBoard(io,
    socket,
    playToUndo,
    games,
    result,
    button_on,
    button_pos,
    game) {
    return GameTablePlays.find({ games: mongoose.Types.ObjectId(games) })
      .sort({ created_at: -1 })
      .then(async data => {
        // console.log(data)
        if (data.length > 0) {
          let i = data.findIndex(e => e.PlayID == playToUndo.undoPlayID);
          console.log(playToUndo.undoPlayID)

          if (i != -1) {
            for (var x = 0; x < i; x++) {
              await GameTablePlays.deleteOne({ PlayID: data[x].PlayID }).then((data) => { });
              await Plays.findOne({ PlayID: data[x].PlayID })
                .then(async (p) => {
                  await Plays.deleteOne({ PlayID: data[x].PlayID }).then(() => {
                  });

                  this.resetBet(p._id)
                })

            }
            // console.log(data[i])

            await Plays.deleteOne({ PlayID: playToUndo.PlayID }).then(() => {
            });

            Plays.findOne({ PlayID: playToUndo.undoPlayID })
              .then(async (p) => {
                this.resetBet(p._id, true)
              })

            return data[i];

            // return await GameTablePlays.create({
            //   PlayID: playToUndo.PlayID,
            //   games: mongoose.Types.ObjectId(game_id),
            //   result: play_mlb_conversion_to,
            //   button_on: button_on,
            //   button_pos: button_pos,
            //   inning: play.InningNumber,
            //   inningHalf: play.InningHalf,
            //   play_number: play.PlayNumber,
            //   check_user_winner: check_user_winner,
            //   runner: runner,
            //   user_lose: user_lose,
            //   created_at: new Date(),
            //   updated_at: new Date()
            // })
            //   .then((play_table) => {
            //     return play_table;
            //   })
            //   .catch((e) => {
            //     console.log(e);
            //   });
          } else {
            return null;
          }
        }

        return null;

      })
  }

  static async resetBet(_id, isPlayToUndo = false) {
    if (isPlayToUndo) {

      Bets.find({ plays: mongoose.Types.ObjectId(_id) })
        .then(d => {
          console.log(d)
          if (d && d.length > 0) {
            for (var i = 0; i < d.length; i++) {
              console.log(i + " : " + d[i].place)
              if (d[i].place == 'passline' && d[i].isOdds == false) {
                Bets.updateOne({ _id: mongoose.Types.ObjectId(d[i]._id) }, {
                  $set: {
                    status: 0,
                    win: false,
                    button_pos: "none",
                    batterCount: 0
                  }
                })
                  .then(d => {
                    console.log(d)
                  })
              } else if (d[i].place == 'passline' && d[i].isOdds) {
                Bets.updateOne({ _id: mongoose.Types.ObjectId(d[i]._id) }, {
                  $set: {
                    status: 0,
                    win: false,
                    batterCount: 0
                  }
                })
                  .then(d => {
                    console.log(d)
                  })
              } else if (['place_8_ways', 'first_to_home'].includes(d[i].place)) {
                Bets.updateOne({ _id: mongoose.Types.ObjectId(d[i]._id) }, {
                  $set: {
                    status: 0,
                    win: false
                  }
                })
                  .then(d => {
                    console.log(d)
                  })
              } else {
                Bets.updateOne({ _id: mongoose.Types.ObjectId(d[i]._id) }, {
                  $set: {
                    status: 0,
                    win: false,
                    place: d[i].isOdds ? d[i].place : 'come'
                  }
                })
                  .then(d => {
                    console.log(d)
                  })
              }
            }
          }
        })

      Bets.find({ "history.playId": _id.toString() })
        .then(b => {
          if (b && b.length > 0) {
            for (var i = 0; i < b.length; i++) {
              let t = b[i].history.findIndex(x => x.playId == _id.toString())
              console.log('MATCH: ' + t)
              if (t != -1) {
                console.log(_id)
                Bets.updateOne({ _id: mongoose.Types.ObjectId(b[i]._id) }, {
                  $set: {
                    status: b[i].history[t].status,
                    win: b[i].history[t].win,
                    place: b[i].history[t].result,
                    batterCount: b[i].history[t].batterCount
                  }
                })
                  .then(d => {
                    console.log(d)
                  })
              }
            }
          }
        })

      UserBalance.deleteMany({ PlayID: mongoose.Types.ObjectId(_id) })
        .then(d => {
          console.log(d)
        })

    } else {
      Bets.deleteMany({ plays: mongoose.Types.ObjectId(_id) })
        .then(d => {
          console.log(d)
        })
      UserBalance.deleteMany({ PlayID: mongoose.Types.ObjectId(_id) })
        .then(d => {
          console.log(d)
        })

    }
    // UserBalance.find({PlayID: mongoose.Types.ObjectId(d._id)})
    // .then(u => {
    //   if(u && u.length > 0) {
    //     for(var i = 0; i < u.length; i++) {
    //       if(u[i].description == "Win") {
    //         GameTable.findByIdAndUpdate(game_table_id, {
    //           total_win: total + value
    //         }).then((result) => {
    //           return true;
    //         });
    //       }
    //     }
    //   }
    // })
    // }
  }

  static async loadCurrentGameState(io, play_number, game_id) {
    var game = await Games.findById(game_id).then((data) => {
      return data;
    });
    var game_table_plays = await GameTablePlays.findOne({
      play_number: play_number,
      games: mongoose.Types.ObjectId(game_id)
    }).then((data) => {
      return data;
    });

    if (game_table_plays != null) {
      var plays = await Plays.findOne({ PlayID: game_table_plays.PlayID }).then(
        (data) => {
          return data;
        }
      );
      game.CurrentHitter = plays.HitterName ? plays.HitterName : '';
      game.Status = 'InProgress';
      game.Inning = plays.InningNumber;
      game.InningHalf = plays.InningHalf;

      game.RunnerOnFirst = plays.Runner1ID != null ? true : false;
      game.RunnerOnSecond = plays.Runner2ID != null ? true : false;
      game.RunnerOnThird = plays.Runner3ID != null ? true : false;

      game.Outs = plays.Outs + plays.NumberOfOutsOnPlay;

      game.LastPlay = await this.simulateResultData(
        plays.Result,
        plays.Description
      );
      plays.Result = await this.simulateResultData(
        plays.Result,
        plays.Description
      );

      io.emit('game_response', {
        type: 'play_by_play',
        games: game,
        plays: plays,
        game_table_plays: game_table_plays
      });
    }
  } //end

  static simulatecheckPlayByPlayv2(io, socket, simulator_data) {
    Games.findById(simulator_data.game_id)
      .populate('LastPlays')
      .then(async (game) => {
        const game_id = game._id;
        game.CurrentHitter = simulator_data.play.HitterName;
        game.Status = simulator_data.game_status;
        game.Inning = simulator_data.current_inning;
        game.InningHalf = simulator_data.play.InningHalf;

        game.Strikes = simulator_data.play.Strikes;
        game.Balls = simulator_data.play.Balls;

        if (simulator_data.is_final) {
          game.Status = 'Final';
        }
        //game.Outs = simulator_data.outs;
        game.RunnerOnFirst =
          simulator_data.play.Runner1ID != null ? true : false;
        game.RunnerOnSecond =
          simulator_data.play.Runner2ID != null ? true : false;
        game.RunnerOnThird =
          simulator_data.play.Runner3ID != null ? true : false;
        let data = simulator_data.play;

        game.Outs = data.Outs + data.NumberOfOutsOnPlay;
        game.LastPlay = await this.simulateResultData(
          data.Result,
          data.Description
        );
        data.Result = await this.simulateResultData(
          data.Result,
          data.Description
        );

        if (data.PlayNumber == 1) {
          await GameTablePlays.deleteMany({ games: game._id }).then(() => {
            return true;
          });
        }

        var last_game_table_plays = await this.get_last_game_table_play(
          game._id,
          data.PlayNumber
        );
        var button_on = false;
        var button_pos = '';
        if (last_game_table_plays) {
          if (
            data.InningNumber == last_game_table_plays.inning &&
            data.InningHalf == last_game_table_plays.inningHalf
          ) {
            button_on = last_game_table_plays.button_on;
            button_pos = last_game_table_plays.button_pos;
          } else {
            button_on = false;
            button_pos = '';
          }
        }
        var game_table_plays = await this.save_game_table_play(
          io,
          socket,
          data,
          game_id,
          data.Result,
          button_on,
          button_pos,
          game
        );
        /// console.log(game_table_plays);
        //set User Lose
        if (game.Status == 'Final') {
          await GameTable.find({
            games: mongoose.Types.ObjectId(game_id)
          }).then(async (game_table_arr) => {
            for (var i = 0; i < game_table_arr.length; i++) {
              const game_table = game_table_arr[i];
              await this.set_user_lose(
                socket,
                game_table._id,
                game_table.user,
                data.Result,
                data.PlayID
              );
            }
            return true;
          });
        } //end

        if (data.Outs + data.NumberOfOutsOnPlay >= 3) {
          await GameTable.find({
            games: mongoose.Types.ObjectId(game_id)
          }).then((game_table_arr) => {
            for (var i = 0; i < game_table_arr.length; i++) {
              const game_table = game_table_arr[i];
              this.set_user_lose(
                socket,
                game_table._id,
                game_table.user,
                data.Result,
                data.PlayID
              );
            }
            return true;
          });
        }

        io.emit('game_response', {
          type: 'play_by_play',
          games: game,
          plays: data,
          game_table_plays: game_table_plays
        });
      });
  }

  static async simulateResultData(str, description) {
    return await MlbConversion.find({
      from: str
    }).then((data) => {
      if (!data) {
        return '';
      }
      for (var i = 0; i < data.length; i++) {
        const item = data[i];

        if (
          String(item.from).toLowerCase().trim() ==
          String(str).toLowerCase().trim()
        ) {
          if (item.check_desc == false) {
            return item.to;
          }
          if (item.check_desc == true) {
            var comps = false;
            if (['Pop Out', 'Popped Into Double Play'].indexOf(str) != -1) {
              comps = this.checkComments(
                description,
                item.comments,
                'popped out to'
              );
            } else if (['Lineout'].indexOf(str) != -1) {
              comps = this.checkComments(
                description,
                item.comments,
                'lined out to'
              );
            } else if (['Fly Out'].indexOf(str) != -1) {
              comps = this.checkComments(
                description,
                item.comments,
                'flied out to'
              );
            } else if (
              [
                'Fly Into Double Play',
                'Fouled Into Double Play',
                'Line Into Double Play',
                'Popped Into Double Play'
              ].indexOf(str) != -1
            ) {
              comps = this.checkComments(
                description,
                item.comments,
                'Custom Check'
              );
            } else if (['Foul Out'].indexOf(str) != -1) {
              comps = this.checkComments(
                description,
                item.comments,
                'fouled out to'
              );
            } else if (['Triple Play'].indexOf(str) != -1) {
              comps = this.checkComments(
                description,
                item.comments,
                'Triple Play'
              );
            }

            if (comps) {
              return item.to;
            }
          }
        }
      }

      return ''; //
    });
  }

  static checkComments(description, comments, split) {
    if (split == 'Triple Play') {
      if (
        String(description).toLowerCase().indexOf('grounded') != -1 &&
        String(comments).toLowerCase().indexOf('grounded') != -1
      ) {
        return true;
      }
      if (
        String(description).toLowerCase().indexOf('lined') != -1 &&
        String(comments).toLowerCase().indexOf('lined') != -1
      ) {
        return true;
      }

      return false;
    }

    if (split == 'Custom Check') {
      if (String(description).toLowerCase().search(comments) != -1) {
        return true;
      }
      return false;
    }
    var desc_array = String(description).split(split);
    var desc_final = String(desc_array[1]).replace('.', '').trim();
    var item_desc_array = String(comments).toLowerCase().split(split);
    var item_desc_final = String(item_desc_array[1]).replace('.', '').trim();

    if (desc_final == item_desc_final) {
      return true;
    }

    return false;
  }

  static async loadLastPlayInit(
    FantasyDataClient,
    io,
    socket,
    game_id,
    games,
    game_table_id
  ) {
    await this.checkPlayByPlay(
      FantasyDataClient,
      io,
      socket,
      game_id,
      games,
      game_table_id,
      true
    );
  }

  static async runcheckPlayByPlay(
    FantasyDataClient,
    io,
    socket,
    game_id,
    games,
    game_table_id
  ) {
    try {
      await this.checkPlayByPlay(
        FantasyDataClient,
        io,
        socket,
        game_id,
        games,
        game_table_id
      );
      // return await new Promise((resolve) => setTimeout(() => {
      /*setTimeout(async ()=>{
                //  await this.runcheckPlayByPlay(FantasyDataClient, io, socket, game_id, games, game_table_id);
                },1000);*/
      //     resolve();
      // }, 1000))
    } catch (e) { }

    /* return await new Promise(async resolve => {
            
            return await this.runcheckPlayByPlay(FantasyDataClient, io, socket, game_id, games, game_table_id);
        });*/
  }

  static async updateGameTotalWinLose(user, game_table_id, field, value) {
    const game_table = await GameTable.findOne({
      _id: mongoose.Types.ObjectId(game_table_id)
    }).then((data) => {
      return data;
    });

    var total = 0;
    if (field == 'total_win') {
      total = game_table.total_win + parseFloat(value);
      return await GameTable.findByIdAndUpdate(game_table_id, {
        total_win: total
      }).then((result) => {
        return true;
      });
    } else {
      total = game_table.total_lose;
      return await GameTable.findByIdAndUpdate(game_table_id, {
        total_lose: total + parseFloat(value)
      }).then((result) => {
        return true;
      });
    }
  }

  static async updateGameTotalWinLoseByGame(user, games, field, value) {
    const game_table = await GameTable.findOne({
      games: mongoose.Types.ObjectId(games),
      user: mongoose.Types.ObjectId(user)
    }).then((data) => {
      return data;
    });

    var total = 0;
    if (field == 'total_win') {
      total = game_table.total_win + parseFloat(value);
      return await GameTable.findByIdAndUpdate(game_table._id, {
        total_win: total
      }).then((result) => {
        return true;
      });
    } else {
      total = game_table.total_lose + parseFloat(value);
      return await GameTable.findByIdAndUpdate(game_table._id, {
        total_lose: total
      }).then((result) => {
        return true;
      });
    }
    return game_table;
  }

  static async updatePlayUserBalance(
    io,
    socket,
    bet,
    win,
    place,
    button_pos,
    amount,
    result,
    play_id,
    game_table_id,
    user_id,
    batterCount = null,
    betting_line = null
  ) {
    var total_amount = 0;
    var type = win == 1 ? 1 : 2;
    var passline_button = String(button_pos).replace('b_', '');
    var description = type == 1 ? 'Win' : 'Lose';
    var odds_1_1 = ['first_to_home', 'place_8_ways'];
    var odds_2_1 = ['bb'];
    var odds_3_1 = ['infield_fly'];
    var odds_6_5 = ['hit', 'k'];
    var odds_7_5 = ['fly_out', 'ground_out'];
    var isPassLine = place == 'passline' ? true : false;

    // if(batterCount == 1) {
    //   odds_7_5.push('k')
    // }

    // if(batterCount == 2) {
    //   odds_6_5.push('k')
    // }

    place = passline_button;

    total_amount = 0;
    if (bet.isOdds == true) {
      var amount = bet.amount;
      if (odds_1_1.indexOf(String(place).toLowerCase()) != -1) {
        // 1:1
        total_amount = amount;
        console.log("odd_bet 1:1")
        console.log(bet.amount)
        console.log(total_amount)
      }
      if (odds_2_1.indexOf(String(place).toLowerCase()) != -1) {
        // 2:1
        total_amount = amount * 2;
        console.log("odd_bet 2:1")
        console.log(bet.amount)
        console.log(total_amount)
      }
      if (odds_3_1.indexOf(String(place).toLowerCase()) != -1) {
        // 3:1
        total_amount = Math.floor(amount * (3 / 1));
        console.log("odd_bet 3:1")
        console.log(bet.amount)
        console.log(total_amount)
      }
      if (odds_6_5.indexOf(String(place).toLowerCase()) != -1) {
        // 6:5
        total_amount = Math.floor(amount * (6 / 5));
        console.log("odd_bet 6:5")
        console.log(bet.amount)
        console.log(total_amount)

      }
      if (odds_7_5.indexOf(String(place).toLowerCase()) != -1) {
        // 7:5
        total_amount = Math.floor(amount * (7 / 5));
        console.log("odd_bet 7:5")
        console.log(bet.amount)
        console.log(total_amount)
      }




    } else {
      console.log("not_odd_bet")
      total_amount = betting_line == null || betting_line == 0 ? bet.amount : await this.bettingLineFormula(bet.amount, betting_line); //bet.amount
      console.log(bet.amount)
      console.log(betting_line)
      console.log(total_amount)
    }

    console.log("bet win")
    await this.updateGameTotalWinLose(
      user_id,
      game_table_id,
      'total_win',
      total_amount
    );

    return await UserBalance.create({
      user: mongoose.Types.ObjectId(user_id),
      type: 1,
      description: description,
      amount: total_amount,
      result: result,
      PlayID: mongoose.Types.ObjectId(play_id),
      created_at: new Date(),
      updated_at: new Date()
    }).then(async (data) => {
      return await Bets.findByIdAndUpdate(bet._id, {
        status: 1,
        isPassLine: isPassLine,
        // place: place,
        win: true,
        win_amount: total_amount
      }).then(async (data) => {
        var amt = parseFloat(total_amount) + parseFloat(data.amount);
        io.emit('game_response', {
          type: 'reload_boards',
          win_amount: parseFloat(amt).toFixed(2),
          game_table_id: game_table_id,
          remove_pos: isPassLine ? 'passline' : String(place).toLowerCase(),
          is_odds: bet.isOdds
        });
        return true;
      });
    });
  } //end

  static async bettingLineFormula(amt, line) {

    if (line < 0) {
      line = Math.abs(line)
      amt = amt / (line / 100);
    } else {
      amt = amt * (line / 100);
    }

    return amt;

  }

  static async set_user_lose(socket, game_table_id, user_id, result, play_id) {
    return await Bets.find({
      game_table: mongoose.Types.ObjectId(game_table_id),
      status: 0
    }).then(async (data) => {
      for (var i = 0; i < data.length; i++) {
        const item = data[i];

        await this.updateGameTotalWinLose(
          user_id,
          game_table_id,
          'total_lose',
          item.amount
        );
        await UserBalance.create({
          user: mongoose.Types.ObjectId(user_id),
          type: 2,
          description: 'Lose',
          amount: item.amount,
          result: result,
          PlayID: mongoose.Types.ObjectId(play_id),
          created_at: new Date(),
          updated_at: new Date()
        }).then((user_balance) => {
          return true;
        });
      }

      await Bets.updateMany(
        {
          game_table: mongoose.Types.ObjectId(game_table_id),
          status: 0
        },
        {
          status: 1,
          win: false
        }
      ).then((data) => {
        socket.emit('game_response', {
          type: 'reload_boards'
        });
      });
    });
  } //end

  static async get_last_game_table_play(game_id, play_number) {
    return await GameTablePlays.findOne({
      games: mongoose.Types.ObjectId(game_id)
      // inningHalf: { "$ne": "CH" },
      // play_number: { "$lte": play_number }
    })
      .sort({ 'created_at': -1 })
      .then((data) => {
        return data;
      })
      .catch((err) => {
        //Error log
        console.log(err);
      });
  }

  static async save_game_table_play(
    io,
    socket,
    play,
    game_id,
    play_mlb_conversion_to,
    button_on,
    button_pos,
    game
  ) {
    var user_lose = false;
    var check_user_winner = {
      status: false
    };
    var runner = [];

    console.log("save game table play");
    console.log({
      game_id: game_id,
      play_mlb_conversion_to: play_mlb_conversion_to,
      noConvertedResult: play.noConvertedResult
    })

    if (play_mlb_conversion_to != '' || play.noConvertedResult.toLowerCase() == "reached on an error") {
      if (button_on == false && button_pos == '') {
        if (play_mlb_conversion_to != '') {
          button_on = true;
          button_pos = play_mlb_conversion_to;
        }

        await Bets.aggregate()
          .lookup({
            from: 'game_table',
            localField: 'game_table',
            foreignField: '_id',
            as: 'game_table'
          })
          .unwind({
            path: '$game_table',
            preserveNullAndEmptyArrays: false
          })
          .match({
            'game_table.games': mongoose.Types.ObjectId(game_id),
            place: 'passline',
            status: 0,
            button_pos: 'none'
          })
          .then(async (data) => {
            for (var i = 0; i < data.length; i++) {
              const item = data[i];
              if (play.noConvertedResult.toLowerCase() == "reached on an error") {
                let game_table = await this.updateGameTotalWinLoseByGame(
                  item.user,
                  game_id,
                  'total_lose',
                  item.amount
                );
                let user_balance_result = await UserBalance.create({
                  user: mongoose.Types.ObjectId(item.user),
                  type: 2,
                  description: 'Lose',
                  amount: item.amount,
                  result: play.noConvertedResult,
                  PlayID: mongoose.Types.ObjectId(play._id),
                  created_at: new Date(),
                  updated_at: new Date()
                }).then((user_balance) => {
                  return true;
                });
                await Bets.findByIdAndUpdate(item._id, {
                  status: 1,
                  win: false
                }).then((result) => {
                  io.emit('game_response', {
                    type: 'reload_boards',
                    remove_pos: item.button_pos,
                    game_table_id: item.game_table._id,
                    placeLose: true
                  });
                });
              } else {
                await Bets.findByIdAndUpdate(item._id, {
                  button_pos: this.moveComePlace(button_pos)
                }).then((result) => {
                  return true;
                });

              }
            }
          });
      } else {
        //For Passline Win
        if (button_on == true && button_pos == play_mlb_conversion_to) {
          check_user_winner = {
            status: true,
            button_pos: button_pos,
            button_on: button_on
          };
          const _button_pos = this.moveComePlace(play_mlb_conversion_to);
          await Bets.aggregate()
            .lookup({
              from: 'game_table',
              localField: 'game_table',
              foreignField: '_id',
              as: 'game_table'
            })
            .unwind({
              path: '$game_table',
              preserveNullAndEmptyArrays: false
            })
            .match({
              'game_table.games': mongoose.Types.ObjectId(game_id),
              place: 'passline',
              status: 0,
              button_pos: _button_pos
            })
            .then(async (data) => {
              for (var i = 0; i < data.length; i++) {
                const item = data[i];
                var isWin = await this.checkPassLineWin(item, play.noConvertedResult)
                if (isWin == 'win') {
                  await this.updatePlayUserBalance(
                    io,
                    socket,
                    item,
                    1,
                    String(item.place).toLocaleLowerCase(),
                    _button_pos,
                    item.amount,
                    _button_pos,
                    data[i].plays,
                    item.game_table._id,
                    item.user,
                    item.batterCount + 1,
                    game.BettingLine
                  );
                } else if (isWin == "return") {
                  return await Bets.findOneAndDelete({
                    _id: item._id
                  })
                    .then(async (data) => {
                      return true
                    })
                    .catch((err) => {

                    });
                } else {
                  console.log('PASSLINE LOSE 1')
                  const game_table = await this.updateGameTotalWinLoseByGame(
                    item.user,
                    game_id,
                    'total_lose',
                    item.amount
                  );
                  const user_balance_result = await UserBalance.create({
                    user: mongoose.Types.ObjectId(item.user),
                    type: 2,
                    description: 'Lose',
                    amount: item.amount,
                    result: play.noConvertedResult,
                    PlayID: mongoose.Types.ObjectId(play._id),
                    created_at: new Date(),
                    updated_at: new Date()
                  }).then((user_balance) => {
                    return true;
                  });
                  await Bets.findByIdAndUpdate(item._id, {
                    status: 1,
                    win: false
                  }).then((result) => {
                    console.log('PASSLINE LOSE')
                    io.emit('game_response', {
                      type: 'reload_boards',
                      remove_pos: item.button_pos,
                      game_table_id: item.game_table._id,
                      placeLose: true
                    });
                  });
                }
              }
            });
          button_pos = '';
          button_on = false;
        } //end
      }
    }

    // if(play.Outs + play.NumberOfOutsOnPlay >= 3) {
    //   button_pos = '';
    //   button_on = false;
    //   // user_lose = true;
    //   runner = [];
    //   await Bets.aggregate()
    //   .lookup({
    //     from: 'game_table',
    //     localField: 'game_table',
    //     foreignField: '_id',
    //     as: 'game_table'
    //   })
    //   .unwind({
    //     path: '$game_table',
    //     preserveNullAndEmptyArrays: false
    //   })
    //   .match({
    //     'game_table.games': mongoose.Types.ObjectId(game_id),
    //     place: 'passline',
    //     status: 0
    //   })
    //   .then(async (data) => {
    //     for (var i = 0; i < data.length; i++) {
    //       const item = data[i];
    //       this.userLose(io, socket, item, 'passline', play, game_id);
    //     }
    //   });
    // }

    // Check place come bets if win /

    //console.log(play_mlb_conversion_to);
    await Bets.aggregate()
      .lookup({
        from: 'game_table',
        localField: 'game_table',
        foreignField: '_id',
        as: 'game_table'
      })
      .unwind({
        path: '$game_table',
        preserveNullAndEmptyArrays: false
      })
      .match({
        'game_table.games': mongoose.Types.ObjectId(game_id),
        place: this.moveComePlace(play_mlb_conversion_to),
        status: 0
      })
      .then(async (data) => {
        for (var i = 0; i < data.length; i++) {
          const item = data[i];
          // if(play.Outs + play.NumberOfOutsOnPlay >= 3) {
          //   this.userLose(io, socket, item, this.moveComePlace(play_mlb_conversion_to), play, game_id);
          // } else {
          await this.updatePlayUserBalance(
            io,
            socket,
            item,
            1,
            this.moveComePlace(play_mlb_conversion_to),
            this.moveComePlace(play_mlb_conversion_to),
            item.amount,
            play_mlb_conversion_to,
            data[i].plays,
            item.game_table._id,
            item.user,
            item.batterCount + 1,
            game.BettingLine
          );

          // }
        }
      });

    // Check first to home if win/lose

    await Bets.aggregate()
      .lookup({
        from: 'game_table',
        localField: 'game_table',
        foreignField: '_id',
        as: 'game_table'
      })
      .unwind({
        path: '$game_table',
        preserveNullAndEmptyArrays: false
      })
      .match({
        'game_table.games': mongoose.Types.ObjectId(game_id),
        place: 'first_to_home',
        status: 0
      })
      .then(async (data) => {
        let numOuts = play.Outs + play.NumberOfOutsOnPlay;
        let splitResult = play.Description.split(',');
        if (numOuts >= 3) {
          for (var i = 0; i < data.length; i++) {
            let item = data[i];
            this.userLose(io, socket, item, 'first_to_home', play, game_id);
          }
        } else {
          for (var i = 0; i < data.length; i++) {
            let item = data[i];

            for (let x = 0; x < splitResult.length; x++) {
              if (
                String(String(splitResult[x]).toLowerCase()).includes(
                  String(item.first_to_home_player).toLowerCase()
                ) &&
                String(String(splitResult[x]).toLowerCase()).includes('scored')
              ) {
                await this.updatePlayUserBalance(
                  io,
                  socket,
                  item,
                  1,
                  'first_to_home',
                  'first_to_home',
                  item.amount,
                  play_mlb_conversion_to,
                  data[i].plays,
                  item.game_table._id,
                  item.user
                );
              } else if (
                String(String(splitResult[x]).toLowerCase()).includes(
                  String(item.first_to_home_player).toLowerCase()
                ) &&
                String(String(splitResult[x]).toLowerCase()).includes('out')
              ) {
                this.userLose(io, socket, item, 'first_to_home', play, game_id);
              }
            }
          }
        }
      });

    // Check if 8 ways win

    await Bets.aggregate()
      .lookup({
        from: 'game_table',
        localField: 'game_table',
        foreignField: '_id',
        as: 'game_table'
      })
      .unwind({
        path: '$game_table',
        preserveNullAndEmptyArrays: false
      })
      .match({
        'game_table.games': mongoose.Types.ObjectId(game_id),
        place: 'place_8_ways',
        status: 0
      })
      .then(async (data) => {
        for (var i = 0; i < data.length; i++) {
          const item = data[i];
          //console.log(item);

          const lastPlay = await Plays.findOne({ PlayID: play.PlayID }).then(
            (result) => {
              return result;
            }
          );

          if (lastPlay) {
            console.log('checkIf8Ways: ', this.checkIf8Ways(lastPlay.Result))
            if (this.checkIf8Ways(lastPlay.Result) == true) {
              await this.updatePlayUserBalance(
                io,
                socket,
                item,
                1,
                'place_8_ways',
                'place_8_ways',
                item.amount,
                play_mlb_conversion_to,
                data[i].plays,
                item.game_table._id,
                item.user
              );
            } else if (lastPlay.Result == "Intentional Walk") {
              return await Bets.deleteOne({
                _id: mongoose.Types.ObjectId(item._id)
              })
                .then(async (data) => {
                  io.emit('game_response', {
                    type: 'reload_boards',
                    remove_pos: 'place_8_ways',
                    game_table_id: item.game_table._id
                  });
                })
                .catch((err) => {
                  // return { message: "There was an error deleting data", httpStatus: 500, success: false };
                });
            } else {
              const game_table = await this.updateGameTotalWinLoseByGame(
                item.user,
                game_id,
                'total_lose',
                item.amount
              );
              const user_balance_result = await UserBalance.create({
                user: mongoose.Types.ObjectId(item.user),
                type: 2,
                description: 'Lose',
                amount: item.amount,
                result: lastPlay.Result,
                PlayID: mongoose.Types.ObjectId(data[i].plays),
                created_at: new Date(),
                updated_at: new Date()
              }).then((user_balance) => {
                return true;
              });
              await Bets.findByIdAndUpdate(item._id, {
                status: 1,
                win: false
              }).then((result) => {
                io.emit('game_response', {
                  type: 'reload_boards',
                  remove_pos: 'place_8_ways',
                  game_table_id: item.game_table._id,
                  placeLose: true,
                  lose_amount: item.amount,
                  is_odds: item.isOdds
                });
                return true;
              });
            }
          } //end
        }
      });

    //check come bets
    await Bets.aggregate()
      .lookup({
        from: 'game_table',
        localField: 'game_table',
        foreignField: '_id',
        as: 'game_table'
      })
      .unwind({
        path: '$game_table',
        preserveNullAndEmptyArrays: false
      })
      .match({
        'game_table.games': mongoose.Types.ObjectId(game_id),
        place: 'come',
        status: 0
      })
      .then(async (data) => {
        const number_of_outs = play.NumberOfOutsOnPlay + play.Outs;
        for (var i = 0; i < data.length; i++) {
          const item = data[i];

          if (play.noConvertedResult.toLowerCase() == "reached on an error" || number_of_outs >= 3) {
            const game_table = await this.updateGameTotalWinLoseByGame(
              item.user,
              game_id,
              'total_lose',
              item.amount
            );
            const user_balance_result = await UserBalance.create({
              user: mongoose.Types.ObjectId(item.user),
              type: 2,
              description: 'Lose',
              amount: item.amount,
              result: play.noConvertedResult,
              PlayID: mongoose.Types.ObjectId(data[i].plays),
              created_at: new Date(),
              updated_at: new Date()
            }).then((user_balance) => {
              return true;
            });
            await Bets.findByIdAndUpdate(item._id, {
              status: 1,
              win: false
            }).then((result) => {
              io.emit('game_response', {
                type: 'reload_boards',
                remove_pos: 'come',
                game_table_id: item.game_table._id,
                placeLose: true,
                lose_amount: item.amount,
                is_odds: item.isOdds
              });
              return true;
            });
            // return await Bets.deleteOne({
            //   _id: mongoose.Types.ObjectId(item._id)
            // })
            //   .then(async (data) => {
            //     console.log(typeof item.user)
            //     console.log(item.user)
            //     io.emit('game_response', {
            //       type: 'reload_boards',
            //       remove_pos: 'come',
            //       game_table_id: item.game_table._id
            //     });
            //   })
            //   .catch((err) => {

            //     console.log(typeof item.user)
            //     console.log(item.user)
            //       // return { message: "There was an error deleting data", httpStatus: 500, success: false };

            //   });
          } else {
            await this.onMoveComeBet(
              io,
              socket,
              item.user,
              item.game_table._id,
              play._id,
              data[i].plays,
              this.moveComePlace(play_mlb_conversion_to),
              number_of_outs
            );
          }
        }
        return true;
      });


    //store history of play
    await Bets.aggregate()
      .lookup({
        from: 'game_table',
        localField: 'game_table',
        foreignField: '_id',
        as: 'game_table'
      })
      .unwind({
        path: '$game_table',
        preserveNullAndEmptyArrays: false
      })
      .match({
        'game_table.games': mongoose.Types.ObjectId(game_id)
      })
      .then(async (data) => {
        for (var i = 0; i < data.length; i++) {
          const item = data[i];
          let h = item.history && item.history.length > 0 ? item.history : [];
          var batterCount = item.batterCount > 0 ? item.batterCount + 1 : 1
          var historyResult = await this.getHistoryResult(item, play, play_mlb_conversion_to)
          h.push({
            result: historyResult,
            playId: play._id,
            status: item.status,
            win: item.win,
            play_name: play.noConvertedResult,
            batterCount: batterCount
          })

          await Bets.updateOne({ _id: mongoose.Types.ObjectId(item._id) }, {
            $set: {
              history: h,
              batterCount: batterCount
            }
          })
        }
      });


    //check if odd bet from passline is lose
    // await Bets.aggregate()
    // .lookup({
    //   from: 'game_table',
    //   localField: 'game_table',
    //   foreignField: '_id',
    //   as: 'game_table'
    // })
    // .unwind({
    //   path: '$game_table',
    //   preserveNullAndEmptyArrays: false
    // })
    // .match({
    //   'game_table.games': mongoose.Types.ObjectId(game_id),
    //   place: 'passline',
    //   isOdds: true,
    //   status: 0
    // })
    // .then(async (data) => {
    //   let max2Batters = await this.getPlayByMaxBat(2)
    //   let max1Batter = await this.getPlayByMaxBat(1)
    //   for (var i = 0; i < data.length; i++) {
    //     const item = data[i];
    //     if(((max2Batters.includes(item.button_pos) && item.batterCount >= 2) || (max1Batter.includes(item.button_pos) && item.batterCount >= 1))) {
    //       const game_table = await this.updateGameTotalWinLoseByGame(
    //         item.user,
    //         game_id,
    //         'total_lose',
    //         item.amount
    //       );
    //       const user_balance_result = await UserBalance.create({
    //         user: mongoose.Types.ObjectId(item.user),
    //         type: 2,
    //         description: 'Lose',
    //         amount: item.amount,
    //         result: play.noConvertedResult,
    //         PlayID: mongoose.Types.ObjectId(play._id),
    //         created_at: new Date(),
    //         updated_at: new Date()
    //       }).then((user_balance) => {
    //         return true;
    //       });
    //       let findHistory = item.history && item.history.length > 0 ? item.history.findIndex(x => x.playId == play._id) : [];
    //       if(findHistory != -1) {
    //         item.history[findHistory]["status"] = 1;
    //         item.history[findHistory]["win"] = false;
    //       }
    //       await Bets.findByIdAndUpdate(item._id, {
    //         status: 1,
    //         win: false,
    //         history: item.history
    //       }).then((result) => {
    //         io.emit('game_response', {
    //           type: 'reload_boards',
    //           remove_pos: item.button_pos,
    //           game_table_id: item.game_table._id,
    //           placeLose: true
    //         });
    //       });
    //     }
    //   }
    // });

    var check_plays = await GameTablePlays.findOne({
      PlayID: play.PlayID
    }).then((data) => {
      return data;
    });

    if (check_plays) {
      // console.log(check_plays);
      if (play.Outs + play.NumberOfOutsOnPlay >= 3) {
        await GameTablePlays.findOneAndUpdate(
          { PlayID: play.PlayID },
          {
            button_on: button_on,
            button_pos: button_pos
          }
        ).then((data) => {
          return true;
        });
      }

      return check_plays;
    }

    // console.log('Game:');
    // console.log('Team: ' + game.AwayTeam + ' - 'gow + game.HomeTeam);
    // console.log('First: ' + game.RunnerOnFirst);
    // console.log('Second: ' + game.RunnerOnSecond);
    // console.log('Third: ' + game.RunnerOnThird);
    // console.log('HitterId: ' + play.HitterID);
    // console.log('Description: ' + play.Description);
    // console.log('Result: ' + play.Result);
    // console.log('RunnerOnFirst: ' + game.RunnerOnFirst);
    // console.log('isValid: ' + this.isValidForFirstToHome(play.Result));

    let lastGameTablePlay = await GameTablePlays.findOne(
      { games: mongoose.Types.ObjectId(game_id) },
      {},
      { sort: { created_at: -1 } }
    ).then((data) => {
      return data;
    });

    if (lastGameTablePlay) {
      runner =
        play.InningNumber == lastGameTablePlay.inning &&
          play.InningHalf == lastGameTablePlay.inningHalf
          ? lastGameTablePlay.runner
          : [];

      if (this.isValidForFirstToHome(play.noConvertedResult)) {
        if (runner.length == 0) {
          runner.push({
            HitterId: play.HitterID,
            isScored: false,
            status: 0,
            runnerOnFirst: true,
            hitterName: play.HitterName
          });

          // player_first_name:
          //   playerInfo && playerInfo.FirstName ? playerInfo.FirstName : '',
          // player_last_name:
          //   playerInfo && playerInfo.LastName ? playerInfo.LastName : '',
          // photoUrl:
          //     playerInfo && playerInfo.PhotoUrl ? playerInfo.PhotoUrl : ''
        } else if (
          lastGameTablePlay.runner.length > 0 &&
          lastGameTablePlay.runner.findIndex(
            (x) => x.hitterName == play.HitterName
          ) == -1
        ) {
          for (let i = 0; i < runner.length; i++) {
            runner[i].runnerOnFirst = false;
          }

          runner.push({
            HitterId: play.HitterID,
            isScored: false,
            status: 0,
            runnerOnFirst: true,
            hitterName: play.HitterName
          });
        }
      } else if (runner.length > 0) {
        for (let i = 0; i < runner.length; i++) {
          let splitResult = play.Description.split(',');
          for (let x = 0; x < splitResult.length; x++) {
            if (
              String(String(splitResult[x]).toLowerCase()).includes(
                String(runner.hitterName).toLowerCase()
              ) &&
              String(String(splitResult[x]).toLowerCase()).includes('scored')
            ) {
              runner[i].isScored = true;
              runner[i].status = 1;
              runner[i].runnerOnFirst = false;
            } else if (
              String(String(splitResult[x]).toLowerCase()).includes(
                String(runner.hitterName).toLowerCase()
              ) &&
              String(String(splitResult[x]).toLowerCase()).includes('out')
            ) {
              runner[i].isScored = false;
              runner[i].status = 1;
              runner[i].runnerOnFirst = false;
            } else if (
              (String(String(splitResult[x]).toLowerCase()).includes(
                String(runner.hitterName).toLowerCase()
              ) &&
                String(String(splitResult[x]).toLowerCase()).includes(
                  'second'
                )) ||
              (String(String(splitResult[x]).toLowerCase()).includes(
                String(runner.hitterName).toLowerCase()
              ) &&
                String(String(splitResult[x]).toLowerCase()).includes('third'))
            ) {
              runner[i].runnerOnFirst = false;
            }
          }
        }
      }

      // console.log('Checking runner status')
      // console.log(game)
    }
    if (
      play.Outs + play.NumberOfOutsOnPlay >= 3 ||
      (game.Balls == null && game.Strikes == null && game.Outs == null)
    ) {
      // console.log(play)
      button_pos = '';
      button_on = false;
      // user_lose = true;
      runner = [];
      console.log("INNNING OUT")
      await Bets.aggregate()
        .lookup({
          from: 'game_table',
          localField: 'game_table',
          foreignField: '_id',
          as: 'game_table'
        })
        .unwind({
          path: '$game_table',
          preserveNullAndEmptyArrays: false
        })
        .match({
          'game_table.games': mongoose.Types.ObjectId(game_id),
          place: 'passline',
          status: 0
        })
        .then(async (data) => {
          for (var i = 0; i < data.length; i++) {
            const item = data[i];
            this.userLose(io, socket, item, 'passline', play, game_id);
          }
        });
      await Bets.aggregate()
        .lookup({
          from: 'game_table',
          localField: 'game_table',
          foreignField: '_id',
          as: 'game_table'
        })
        .unwind({
          path: '$game_table',
          preserveNullAndEmptyArrays: false
        })
        .match({
          'game_table.games': mongoose.Types.ObjectId(game_id),
          place: 'ground_out',
          isOdds: false,
          status: 0
        })
        .then(async (data) => {
          for (var i = 0; i < data.length; i++) {
            const item = data[i];
            this.userLose(io, socket, item, 'ground_out', play, game_id);
          }
        });
      await Bets.aggregate()
        .lookup({
          from: 'game_table',
          localField: 'game_table',
          foreignField: '_id',
          as: 'game_table'
        })
        .unwind({
          path: '$game_table',
          preserveNullAndEmptyArrays: false
        })
        .match({
          'game_table.games': mongoose.Types.ObjectId(game_id),
          place: 'infield_fly',
          isOdds: false,
          status: 0
        })
        .then(async (data) => {
          for (var i = 0; i < data.length; i++) {
            const item = data[i];
            this.userLose(io, socket, item, 'infield_fly', play, game_id);
          }
        });
      await Bets.aggregate()
        .lookup({
          from: 'game_table',
          localField: 'game_table',
          foreignField: '_id',
          as: 'game_table'
        })
        .unwind({
          path: '$game_table',
          preserveNullAndEmptyArrays: false
        })
        .match({
          'game_table.games': mongoose.Types.ObjectId(game_id),
          place: 'bb',
          isOdds: false,
          status: 0
        })
        .then(async (data) => {
          for (var i = 0; i < data.length; i++) {
            const item = data[i];
            this.userLose(io, socket, item, 'bb', play, game_id);
          }
        });
      await Bets.aggregate()
        .lookup({
          from: 'game_table',
          localField: 'game_table',
          foreignField: '_id',
          as: 'game_table'
        })
        .unwind({
          path: '$game_table',
          preserveNullAndEmptyArrays: false
        })
        .match({
          'game_table.games': mongoose.Types.ObjectId(game_id),
          place: 'hit',
          isOdds: false,
          status: 0
        })
        .then(async (data) => {
          for (var i = 0; i < data.length; i++) {
            const item = data[i];
            this.userLose(io, socket, item, 'hit', play, game_id);
          }
        });

      await Bets.aggregate()
        .lookup({
          from: 'game_table',
          localField: 'game_table',
          foreignField: '_id',
          as: 'game_table'
        })
        .unwind({
          path: '$game_table',
          preserveNullAndEmptyArrays: false
        })
        .match({
          'game_table.games': mongoose.Types.ObjectId(game_id),
          place: { $nin: ['passline', 'ground_out', 'infield_fly', 'bb', 'hit'] },
          status: 0
        }).then(async (data) => {
          for (var i = 0; i < data.length; i++) {
            const item = data[i];
            this.userLose(io, socket, item, item.place, play, game_id);
          }
        })
    }


    return await GameTablePlays.create({
      PlayID: play.PlayID,
      games: mongoose.Types.ObjectId(game_id),
      result: play_mlb_conversion_to,
      button_on: button_on,
      button_pos: button_pos,
      inning: play.InningNumber,
      inningHalf: play.InningHalf,
      play_number: play.PlayNumber,
      check_user_winner: check_user_winner,
      runner: runner,
      user_lose: user_lose,
      created_at: new Date(),
      updated_at: new Date()
    })
      .then((play_table) => {
        return play_table;
      })
      .catch((e) => {
        console.log(e);
      });
  }

  static async getHistoryResult(item, play, play_mlb_conversion_to) {
    if (item.place == "come" && item.isOdds == false) {
      return play_mlb_conversion_to;
    }

    return item.place;
  }

  static async checkPassLineWin(item, playResult) {
    let max2Batters = await this.getPlayByMaxBat(2)
    // let max1Batter = await this.getPlayByMaxBat(1)

    // if(item.isOdds && max2Batters.includes(item.button_pos) && playResult == "Sacrifice Bunt Out" && item.batterCount < 3) {
    //   return 'lose';
    // }

    if (item.isOdds && ["Sacrifice Bunt Out", "Intentional Walk", "Sacrifice Fly Out"].includes(playResult)) {
      return 'return';
    }

    // if(item.isOdds && max1Batter.includes(item.button_pos)) {
    //   return false;
    // }

    return 'win';
  }

  static async getPlayByMaxBat(n) {
    var arr = [];
    if (n == 2) {
      arr = ['ground_out', 'hit', 'fly_out']
    }

    if (n == 1) {
      arr = ["k"]
    }

    return arr;
  }

  static async get_last_play_list(io, user_id, games, play_number) {
    var filter;
    try {
      if (play_number != 0) {
        filter = {
          games: mongoose.Types.ObjectId(games),
          play_number: { $lte: play_number }
        };
      } else {
        filter = {
          games: mongoose.Types.ObjectId(games)
        };
      }
      if (process.env.SIMULATOR == 1) {
        await GameTablePlays.find(filter)
          .sort({ created_at: -1 })
          .then((data) => {
            var results = [];
            for (var i = 0; i < data.length; i++) {
              var item = data[i];
              if (item.result != '') {
                results.push(item.result);
              }
            }

            io.emit('game_response', {
              type: 'last_play_list',
              data: results,
              games: games,
              user_id: user_id
            });
          });
      } else {
        await Plays.find({ games: mongoose.Types.ObjectId(games) })
          .sort({ created_at: -1 })
          .then(async (data) => {
            //console.log(data);
            var results = [];
            for (var i = 0; i < data.length; i++) {
              var item = data[i];
              if (item.result != '') {
                var result = await this.simulateResultData(
                  item.Result,
                  item.Description
                );
                if (result != '') {
                  results.push(result);
                }
              }
            }

            io.emit('game_response', {
              type: 'last_play_list',
              data: results,
              games: games,
              user_id: user_id
            });
          });
      }
    } catch (error) {
      console.log(error);
    }
  }

  static moveComePlace(str) {
    var array = {
      Walk: 'bb',
      Strikeout: 'k',
      'Ground Out': 'ground_out',
      'Infield Fly': 'infield_fly',
      Hit: 'hit',
      'Fly Out': 'fly_out'
    };
    if (array[str] != undefined) {
      return array[str];
    }
    return '';
  }

  static checkIf8Ways(result) {
    console.log('checkIf8Ways: ', result)
    //console.log(["Single", "Triple", "Home Run", "Double", "Single", "Intentional Walk", "Walk", "Hit by Pitch", "Error", "Fielder's Choice", "Catcher's Interference", "Fielders Indifference"].indexOf(result));
    return (
      [
        'single',
        'walk',
        'fielder\'s choice',
        'fielder\'s interference',
        'double',
        'home run',
        'triple',
        'reached on an error',
        'catcher\'s interference',
        'fielder\'s choice double play',
        'hit by pitch',
        'advanced on strikeout'
      ].indexOf(result.toLowerCase()) != -1
    );
  }

  static async userLose(io, socket, item, place, play, game_id) {
    const game_table = await this.updateGameTotalWinLoseByGame(
      item.user,
      game_id,
      'total_lose',
      item.amount
    );

    await UserBalance.create({
      user: mongoose.Types.ObjectId(item.user),
      type: 2,
      description: 'Lose',
      amount: item.amount,
      result: play.Result,
      PlayID: mongoose.Types.ObjectId(play.PlayID),
      created_at: new Date(),
      updated_at: new Date()
    }).then((user_balance) => {
      return true;
    });

    await Bets.findByIdAndUpdate(item._id, {
      status: 1,
      win: false
    }).then((result) => {
      io.emit('game_response', {
        type: 'reload_boards',
        remove_pos: place,
        game_table_id: item.game_table._id,
        placeLose: true,
        lose_amount: item.amount,
        is_odds: item.isOdds
      });
      return true;
    });
  }

  static isValidForFirstToHome(result) {
    return (
      [
        'single',
        'walk',
        'reached on an error',
        'catcher\'s interference',
        'hit by pitch',
        'intentional walk'
      ].indexOf(result.toLowerCase()) != -1
    );
  }
}

module.exports = MlbGamesService;
