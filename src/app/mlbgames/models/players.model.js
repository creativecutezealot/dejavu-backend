const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var PlayersSchema = new mongoose.Schema({
    PlayerID: { type: Number, default: null },
    SportsDataID: { type: Number, default: null },
    Status: { type: String, default: null },
    TeamID: { type: Number, default: null },
    Team: { type: String, default: null },
    Jersey: { type: Number, default: null },
    PositionCategory: { type: String, default: null },
    Position: { type: String, default: null },
    MLBAMID: { type: Number, default: null },
    FirstName: { type: String, default: null },
    LastName: { type: String, default: null },
    BatHand: { type: String, default: null },
    ThrowHand: { type: String, default: null },
    Height: { type: Number, default: null },
    Weight: { type: Number, default: null },
    BirthDate: { type: Date, default: null },
    BirthCity: { type: String, default: null },
    BirthState: { type: String, default: null },
    BirthCountry: { type: String, default: null },
    HighSchool: { type: String, default: null },
    College: { type: String, default: null },
    ProDebut: { type: Date, default: null },
    Salary: { type: Number, default: null },
    PhotoUrl: { type: String, default: null },
    SportRadarPlayerID: { type: String, default: null },
    RotoworldPlayerID: { type: Number, default: null },
    RotoWirePlayerID: { type: Number, default: null },
    FantasyAlarmPlayerID: { type: Number, default: null },
    StatsPlayerID: { type: Number, default: null },
    SportsDirectPlayerID: { type: Number, default: null },
    XmlTeamPlayerID: { type: Number, default: null },
    InjuryStatus: { type: String, default: null },
    InjuryBodyPart: { type: String, default: null },
    InjuryStartDate: { type: String, default: null },
    InjuryNotes: { type: String, default: null },
    FanDuelPlayerID: { type: Number, default: null },
    DraftKingsPlayerID: { type: Number, default: null },
    YahooPlayerID: { type: Number, default: null },
    UpcomingGameID: { type: Number, default: null },
    FanDuelName: { type: String, default: null },
    DraftKingsName: { type: String, default: null },
    YahooName: { type: String, default: null },
    GlobalTeamID: { type: Number, default: null },
    FantasyDraftName: { type: String, default: null },
    FantasyDraftPlayerID: { type: Number, default: null },
    Experience: { type: String, default: null },
    UsaTodayPlayerID: { type: Number, default: null },
    UsaTodayHeadshotUrl: { type: String, default: null },
    UsaTodayHeadshotNoBackgroundUrl: { type: String, default: null },
    UsaTodayHeadshotUpdated: { type: Date, default: null },
    UsaTodayHeadshotNoBackgroundUpdated: { type: Date, default: null },
    created_at: Date,
    updated_at: Date,
});

mongoose.model('Players', PlayersSchema, 'players');

module.exports = mongoose.model('Players');