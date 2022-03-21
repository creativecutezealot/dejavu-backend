var mongoose = require('mongoose');  
const Schema = mongoose.Schema; 

var TeamsSchema = new mongoose.Schema({ 
    TeamID: {type:Number, default:null},
    Key: {type:String, default:null},
    Active: {type:Boolean, default:null},
    City: {type:String, default:null},
    Name: {type:String, default:null},
    StadiumID: {type:Number, default:null},
    League:{type:String, default:null},
    Division: {type:String, default:null},
    PrimaryColor: {type:String, default:null},
    SecondaryColor: {type:String, default:null},
    TertiaryColor:{type:String, default:null},
    QuaternaryColor: {type:String, default:null},
    WikipediaLogoUrl: {type:String, default:null},
    WikipediaWordMarkUrl: {type:String, default:null},
    GlobalTeamID: {type:Number, default:null},
    created_at: Date,
    updated_at: Date,
});

mongoose.model('Teams', TeamsSchema,'teams');

module.exports = mongoose.model('Teams');