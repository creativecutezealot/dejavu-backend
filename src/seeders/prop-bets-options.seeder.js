const path = require('path');
const dotenv = require('dotenv').config({ path: path.join(__dirname, '../../.env') });;
const db = require('../../config/db');

const PropBetsOptions = require('../app/prop-bets-options/models/prop-bets-options.model');


async function seed() {
    // player team options

    var options = [];
    options.push({
        key: "next_player",
        name: "Next Player",
        section: "player_team_options",
        ordering: 1
    });
    options.push({
        key: "choose_batter",
        name: "Choose Batter",
        section: "player_team_options",
        ordering: 2
    });
    options.push({
        key: "any_batter",
        name: "Any Batter this Half",
        section: "player_team_options",
        ordering: 3
    });
    options.push({
        key: "team_up_bat",
        name: "The Team Up To Bat",
        section: "player_team_options",
        ordering: 4
    });
    options.push({
        key: "team_in_field",
        name: "The Team In The Field",
        section: "player_team_options",
        ordering: 5
    });

    //will result in options

    options.push({
        key: "common",
        name: "****COMMON****",
        section: "will_result_in_options",
        is_separator: true,
        ordering: 1
    });

    options.push({
        key: "get_a_hit",
        name: "Get a Hit",
        section: "will_result_in_options",
        ordering: 2
    });

    options.push({
        key: "reach_base",
        name: "Reach Base",
        section: "will_result_in_options",
        ordering: 3
    });

    options.push({
        key: "hit_a_single",
        name: "Hit a Single",
        section: "will_result_in_options",
        ordering: 4
    });
    options.push({
        key: "hit_a_double",
        name: "Hit a Double",
        section: "will_result_in_options",
        ordering: 5
    });

    options.push({
        key: "hit_a_tripple",
        name: "Hit a Triple",
        section: "will_result_in_options",
        ordering: 6
    });

    options.push({
        key: "hit_a_home_run",
        name: "Hit a Home Run",
        section: "will_result_in_options",
        ordering: 7
    });

    options.push({
        key: "be_hit_by_a_pitch",
        name: "Be Hit By A Pitch",
        section: "will_result_in_options",
        ordering: 8
    });

    options.push({
        key: "strike_out",
        name: "Strike Out",
        section: "will_result_in_options",
        ordering: 9
    });

    options.push({
        key: "get_a_walk",
        name: "Get a Walk",
        section: "will_result_in_options",
        ordering: 10
    });

    options.push({
        key: "steal_a_base",
        name: "Steal A Base",
        section: "will_result_in_options",
        ordering: 11
    });

    options.push({
        key: "get_picked_off",
        name: "Get Picked Off",
        section: "will_result_in_options",
        ordering: 12
    });

    options.push({
        key: "get_caught_stealing",
        name: "Get Caught Stealing",
        section: "will_result_in_options",
        ordering: 13
    });

    options.push({
        key: "get_an_at_bat",
        name: "Get an At Bat",
        section: "will_result_in_options",
        ordering: 14
    });

    options.push({
        key: "uncommon",
        name: "****UNCOMMON****",
        section: "will_result_in_options",
        is_separator: true,
        ordering: 15
    });

    options.push({
        key: "be_hit_by_a_pitch",
        name: "Be Hit By a Pitch",
        section: "will_result_in_options",
        ordering: 16
    });
    options.push({
        key: "hit_into_a_double_play",
        name: "Hit into a Double Play",
        section: "will_result_in_options",
        ordering: 17
    });

    options.push({
        key: "hit_into_a_double_play",
        name: "Reach Base on an Error",
        section: "will_result_in_options",
        ordering: 18
    });

    options.push({
        key: "foul_out",
        name: "Foul Out",
        section: "will_result_in_options",
        ordering: 19
    });

    options.push({
        key: "ground_out",
        name: "Ground Out",
        section: "will_result_in_options",
        ordering: 20
    });

    options.push({
        key: "get_intentionally_walked",
        name: "Get Intentionally Walked",
        section: "will_result_in_options",
        ordering: 21
    });

    options.push({
        key: "strikeout_bunting",
        name: "Strikeout Bunting",
        section: "will_result_in_options",
        ordering: 22
    });

    options.push({
        key: "strikeout_looking",
        name: "Strikeout Looking",
        section: "will_result_in_options",
        ordering: 23
    });

    options.push({
        key: "strikeout_swinging",
        name: "Strikeout Swinging",
        section: "will_result_in_options",
        ordering: 24
    });

    options.push({
        key: "hit_into_a_triple_play",
        name: "Hit into a Triple Play",
        section: "will_result_in_options",
        ordering: 25
    });


    //Team Results


      options.push({
        key: "win_the_game",
        name: "Win The Game",
        section: "team_results",
        ordering: 1
    });

    options.push({
        key: "win_by_1_run",
        name: "Win by >1 Run",
        section: "team_results",
        ordering: 2
    });

    options.push({
        key: "win_by_2_run",
        name: "Win by >2 Runs",
        section: "team_results",
        ordering: 3
    });

    options.push({
        key: "win_by_3_run",
        name: "Win by >3 Runs",
        section: "team_results",
        ordering: 4
    });

    options.push({
        key: "combine_more_5",
        name: "Combine with the other team to score more than 5 runs",
        section: "team_results",
        ordering: 5
    });


    options.push({
        key: "combine_more_6",
        name: "Combine with the other team to score more than 6 runs",
        section: "team_results",
        ordering: 6
    });

    options.push({
        key: "combine_more_7",
        name: "Combine with the other team to score more than 7 runs",
        section: "team_results",
        ordering: 7
    });

    options.push({
        key: "combine_more_8",
        name: "Combine with the other team to score more than 8 runs",
        section: "team_results",
        ordering: 8
    });

    options.push({
        key: "combine_more_9",
        name: "Combine with the other team to score more than 9 runs",
        section: "team_results",
        ordering: 9
    });

    options.push({
        key: "combine_more_10",
        name: "Combine with the other team to score more than 10 runs",
        section: "team_results",
        ordering: 10
    });


    // Timeframe


    options.push({
        key: "the_next_at_bat",
        name: "The Next At Bat",
        section: "timeframe",
        ordering: 1
    });

    options.push({
        key: "this_inning",
        name: "This Inning",
        section: "timeframe",
        ordering: 2
    });

    options.push({
        key: "this_game",
        name: "This Game",
        section: "timeframe",
        ordering: 3
    });


    //Proposed Odds
    
    var proposed_bets = [
        "Even",
        "-110",
        "+110",
        "-120",
        "+120",
        "-150",
        "+150",
        "-200",
        "+200",
        "-300",
        "+300",
        "-400",
        "+400",
        "-500",
        "+500",
        "-750",
        "+750",
        "-1000",
        "+1000"
        ];

    for(var i = 0;i<proposed_bets.length;i++){
        options.push({
            key: String(proposed_bets[i]).toLowerCase(),
            name: proposed_bets[i],
            section: "proposed_bets",
            ordering: (i+1)
        });
    }
    



    await PropBetsOptions.create(options).then(result => {
        console.log("Done Seeding");
        process.exit(0);

    });
}
seed();
