
const path = require('path');
const dotenv = require('dotenv').config({ path: path.join(__dirname, '../../.env') });;
const db = require('../../config/db');

const MlbConversion = require('../app/mlbgames/models/mlbconversion.model');


function seed(){
    const data = [
        {
            from: "Wild Pitch",
            to:"",
            check_desc:false,
            comments:''
        },
        {
            from: "Batter's Interference",
            to:"",
            check_desc:false,
            comments:''
        },
        {
            from: "Bunted into Double Play",
            to:"Ground Out",
            check_desc:false,
            comments:''
        },
        {
            from: "Catcher's Interference",
            to:"Walk",
            check_desc:false,
            comments:''
        },
        {
            from: "Double",
            to:"Hit",
            check_desc:false,
            comments:''
        },
        {
            from: "Error",
            to:"",
            check_desc:false,
            comments:''
        },
        {
            from: "Fielder's Choice",
            to:"Ground Out",
            check_desc:false,
            comments:''
        },
        {
            from: "Fly into Double Play",
            to:"Infield Fly",
            check_desc:true,
            comments:'catcher to'
            
        },
        {
            from: "Fly into Double Play",
            to:"Infield Fly",
            check_desc:true,
            comments:'pitcher to'
            
        },
        {
            from: "Fly into Double Play",
            to:"Infield Fly",
            check_desc:true,
            comments:'first to'
            
        },
        {
            from: "Fly into Double Play",
            to:"Infield Fly",
            check_desc:true,
            comments:'second to'
            
        },
        {
            from: "Fly into Double Play",
            to:"Infield Fly",
            check_desc:true,
            comments:'shortstop to'
            
        },
        {
            from: "Fly into Double Play",
            to:"Infield Fly",
            check_desc:true,
            comments:'third to'
            
        },
        {
            from: "Fly into Double Play",
            to:"Fly Out",
            check_desc:true,
            comments:'left to'
            
        },
        {
            from: "Fly into Double Play",
            to:"Fly Out",
            check_desc:true,
            comments:'center to'
            
        },
        {
            from: "Fly into Double Play",
            to:"Fly Out",
            check_desc:true,
            comments:'right to'
            
        },
        {
            from: "Fly Out",
            to:"Infield Fly",
            check_desc:true,
            comments:'Flied out to catcher'
        },
        {
            from: "Fly Out",
            to:"Infield Fly",
            check_desc:true,
            comments:'bunt to catcher'
        },
        {
            from: "Fly Out",
            to:"Infield Fly",
            check_desc:true,
            comments:'Flied out on a bunt'
        },
        {
            from: "Fly Out",
            to:"Infield Fly",
            check_desc:true,
            comments:'Flied out to pitcher'
        },
        {
            from: "Fly Out",
            to:"Infield Fly",
            check_desc:true,
            comments:'Flied out to first'
        },
        {
            from: "Fly Out",
            to:"Infield Fly",
            check_desc:true,
            comments:'Flied out to second'
        },
        {
            from: "Fly Out",
            to:"Infield Fly",
            check_desc:true,
            comments:'Flied out to shortstop'
        },
        {
            from: "Fly Out",
            to:"Infield Fly",
            check_desc:true,
            comments:'Flied out to third'
        },
        {
            from: "Fly Out",
            to:"Fly Out",
            check_desc:true,
            comments:'Flied out to left'
        },
        {
            from: "Fly Out",
            to:"Fly Out",
            check_desc:true,
            comments:'Flied out to center'
        },
        {
            from: "Fly Out",
            to:"Fly Out",
            check_desc:true,
            comments:'Flied out to right'
        },
        {
            from: "Foul Out",
            to:"Infield Fly",
            check_desc:true,
            comments:'Fouled out to catcher'
        },
        {
            from: "Foul Out",
            to:"Infield Fly",
            check_desc:true,
            comments:'Fouled out to pitcher'
        },
        {
            from: "Foul Out",
            to:"Infield Fly",
            check_desc:true,
            comments:'Fouled out to first'
        },
        {
            from: "Foul Out",
            to:"Infield Fly",
            check_desc:true,
            comments:'Fouled out to second'
        },
        {
            from: "Foul Out",
            to:"Infield Fly",
            check_desc:true,
            comments:'Fouled out to shortstop'
        },
        {
            from: "Foul Out",
            to:"Infield Fly",
            check_desc:true,
            comments:'Fouled out to third'
        },
        {
            from: "Foul Out",
            to:"Fly Out",
            check_desc:true,
            comments:'Fouled out to left'
        },
        {
            from: "Foul Out",
            to:"Fly Out",
            check_desc:true,
            comments:'Fouled out to center'
        },
        {
            from: "Foul Out",
            to:"Fly Out",
            check_desc:true,
            comments:'Fouled out to right'
        },
        {
            from:"Fouled into Double Play",
            to:"Infield Fly",
            check_desc:true,
            comments:"catcher to"
        },
        {
            from:"Fouled into Double Play",
            to:"Infield Fly",
            check_desc:true,
            comments:"pitcher to"
        },
        {
            from:"Fouled into Double Play",
            to:"Infield Fly",
            check_desc:true,
            comments:"first to"
        },
        {
            from:"Fouled into Double Play",
            to:"Infield Fly",
            check_desc:true,
            comments:"second to"
        },
        {
            from:"Fouled into Double Play",
            to:"Infield Fly",
            check_desc:true,
            comments:"shortstop to"
        },
        {
            from:"Fouled into Double Play",
            to:"Infield Fly",
            check_desc:true,
            comments:"third to"
        },
        {
            from:"Fouled into Double Play",
            to:"Fly Out",
            check_desc:true,
            comments:"left to"
        },
        {
            from:"Fouled into Double Play",
            to:"Fly Out",
            check_desc:true,
            comments:"center to"
        },
        {
            from:"Fouled into Double Play",
            to:"Fly Out",
            check_desc:true,
            comments:"right to"
        },
        {
            from:"Ground into Double Play",
            to:"Ground Out",
            check_desc:false,
            comments:""
        },
        {
            from:"Ground Out",
            to:"Ground Out",
            check_desc:false,
            comments:""
        },
        {
            from:"Hit by Pitch",
            to:"Walk",
            check_desc:false,
            comments:""
        },
        {
            from:"Home Run",
            to:"Hit",
            check_desc:false,
            comments:""
        },
        {
            from:"Infield Fly Out",
            to:"Infield Fly",
            check_desc:false,
            comments:""
        },
        {
            from:"Intentional Walk",
            to:"Walk",
            check_desc:false,
            comments:""
        },
        {
            from:"Line into Double Play",
            to:"Infield Fly",
            check_desc:true,
            comments:"pitcher to"
        },
        {
            from:"Line into Double Play",
            to:"Infield Fly",
            check_desc:true,
            comments:"first to"
        },
        {
            from:"Line into Double Play",
            to:"Infield Fly",
            check_desc:true,
            comments:"second to"
        },
        {
            from:"Line into Double Play",
            to:"Infield Fly",
            check_desc:true,
            comments:"shortstop to"
        },
        {
            from:"Line into Double Play",
            to:"Infield Fly",
            check_desc:true,
            comments:"third to"
        },
        {
            from:"Line into Double Play",
            to:"Fly Out",
            check_desc:true,
            comments:"left to"
        },
        {
            from:"Line into Double Play",
            to:"Fly Out",
            check_desc:true,
            comments:"center to"
        },
        {
            from:"Line into Double Play",
            to:"Fly Out",
            check_desc:true,
            comments:"right to"
        },
        {
            from:"Line into Double Play",
            to:"Infield Fly",
            check_desc:true,
            comments:"lined into double play to first"
        },
        {
            from:"Line into Double Play",
            to:"Infield Fly",
            check_desc:true,
            comments:"lined into double play to second"
        },
        {
            from:"Line into Double Play",
            to:"Infield Fly",
            check_desc:true,
            comments:"lined into double play to shortstop"
        },
        {
            from:"Line into Double Play",
            to:"Infield Fly",
            check_desc:true,
            comments:"lined into double play to third"
        },{
            from:"Lineout",
            to:"Infield Fly",
            check_desc:true,
            comments:"Lined out to pitcher"
        },{
            from:"Lineout",
            to:"Infield Fly",
            check_desc:true,
            comments:"Lined out to first"
        },{
            from:"Lineout",
            to:"Infield Fly",
            check_desc:true,
            comments:"Lined out to second"
        },{
            from:"Lineout",
            to:"Infield Fly",
            check_desc:true,
            comments:"Lined out to third"
        },{
            from:"Lineout",
            to:"Infield Fly",
            check_desc:true,
            comments:"Lined out to shortstop"
        },{
            from:"Lineout",
            to:"Fly Out",
            check_desc:true,
            comments:"Lined out to left"
        },{
            from:"Lineout",
            to:"Fly Out",
            check_desc:true,
            comments:"Lined out to center"
        },{
            from:"Lineout",
            to:"Fly Out",
            check_desc:true,
            comments:"Lined out to right"
        },{
            from:"Pop Out",
            to:"Infield Fly",
            check_desc:true,
            comments:"Popped out to pitcher"
        },{
            from:"Pop Out",
            to:"Infield Fly",
            check_desc:true,
            comments:"Popped out to catcher"
        },{
            from:"Pop Out",
            to:"Infield Fly",
            check_desc:true,
            comments:"Popped out to first"
        },{
            from:"Pop Out",
            to:"Infield Fly",
            check_desc:true,
            comments:"Popped out to second"
        },{
            from:"Pop Out",
            to:"Infield Fly",
            check_desc:true,
            comments:"Popped out to third"
        },{
            from:"Pop Out",
            to:"Infield Fly",
            check_desc:true,
            comments:"Popped out to shortstop"
        },{
            from:"Pop Out",
            to:"Fly Out",
            check_desc:true,
            comments:"Popped out to left"
        },{
            from:"Pop Out",
            to:"Fly Out",
            check_desc:true,
            comments:"Popped out to center"
        },{
            from:"Pop Out",
            to:"Fly Out",
            check_desc:true,
            comments:"Popped out to right"
        },{
            from:"Popped into Double Play",
            to:"Infield Fly",
            check_desc:true,
            comments:"catcher to"
        },{
            from:"Popped into Double Play",
            to:"Infield Fly",
            check_desc:true,
            comments:"pitcher to",
        },{
            from:"Popped into Double Play",
            to:"Infield Fly",
            check_desc:true,
            comments:"first to",
        },{
            from:"Popped into Double Play",
            to:"Infield Fly",
            check_desc:true,
            comments:"second to",
        },{
            from:"Popped into Double Play",
            to:"Infield Fly",
            check_desc:true,
            comments:"shortstop to",
        },{
            from:"Popped into Double Play",
            to:"Infield Fly",
            check_desc:true,
            comments:"third to",
        },{
            from:"Popped into Double Play",
            to:"Fly Out",
            check_desc:true,
            comments:"left to",
        },{
            from:"Popped into Double Play",
            to:"Fly Out",
            check_desc:true,
            comments:"center to",
        },{
            from:"Popped into Double Play",
            to:"Fly Out",
            check_desc:true,
            comments:"right to",
        },{
            from:"Sacrifice",
            to:"Ground Out",
            check_desc:false,
            comments:"" 
        },{
            from:"Sacrifice Fly",
            to:"Fly Out",
            check_desc:false,
            comments:"" 
        },{
            from:"Single",
            to:"Hit",
            check_desc:false,
            comments:"" 
        },{
            from:"Strikeout Bunting",
            to:"Strikeout",
            check_desc:false,
            comments:"" 
        },{
            from:"Strikeout Looking",
            to:"Strikeout",
            check_desc:false,
            comments:"" 
        },{
            from:"Strikeout Swinging",
            to:"Strikeout",
            check_desc:false,
            comments:"" 
        },{
            from:"Triple",
            to:"Hit",
            check_desc:false,
            comments:"" 
        },{
            from:"Triple Play",
            to:"Infield Fly",
            check_desc:true,
            comments:"Lined into triple play"
        },{
            from:"Triple Play",
            to:"Ground Out",
            check_desc:true,
            comments:"Grounded into triple play"
        },{
            from:"Walk",
            to:"Walk",
            check_desc:false,
            comments:""
        }
        
        
    ];
   
    MlbConversion.deleteMany({},(err,result)=>{
        MlbConversion.create(data,(err,result)=>{
            console.log("Done seeding mlb conversion");
            process.exit(0);
        });
    })
}

seed();

