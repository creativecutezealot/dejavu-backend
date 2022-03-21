const mongoose = require('mongoose');
const moment = require('moment');
const path = require('path');
const dotenv = require('dotenv').config({ path: path.join(__dirname, '../../.env') });;
const db = require('../../config/db');
const fdClientModule = require('fantasydata-node-client');
const sports_data_io_key = {
    'MLBv3ScoresClient': process.env.SPORTS_DATA_IO_KEY,
    'MLBv3StatsClient': process.env.SPORTS_DATA_IO_KEY,
    'MLBv3PlayByPlayClient': process.env.SPORTS_DATA_IO_KEY
};
const FantasyDataClient = new fdClientModule(sports_data_io_key);
const Games = require("../app/mlbgames/models/games.model");
const GameTable = require("../app/game_table/models/game_table.model");
const Bets = require("../app/game_table/models/bets.model");
const Plays = require("../app/mlbgames/models/plays.model");
const GameTablePlays = require("../app/game_table/models/game_table_plays.model");

const MlbGamesService = require('../app/mlbgames/mlbgames.service');


async function testPlaybyPlay() {
    console.log(moment(new Date()).format() + " Start checking..");
    const game_id = "5dafb1fde46b9e0d7096a0d3";//"5d9bb4c774a46e0566f884bb";
    const plays = await simulatePlaybyPlay(game_id);
    console.log(moment(new Date()).format() + " Done checking..");
    process.exit(0);
}



async function simulatePlaybyPlay(game_id) {
    await GameTablePlays.deleteMany({}).then(data => { });

    await Plays.find({ games: game_id }).sort('PlayID').then(async (data) => {
        var button_on = false;
        var button_pos = "";
        for (var i = 0; i < data.length; i++) {
            const play = data[i];
            var play_mlb_conversion_to = await MlbGamesService.simulateResultData(play.Result, play.Description)
            var game_table_plays = await MlbGamesService.save_game_table_play(play, game_id, play_mlb_conversion_to, button_on, button_pos);
            button_on = game_table_plays.button_on;
            button_pos = game_table_plays.button_pos;

        }//end

        return true;

    });
}

testPlaybyPlay();