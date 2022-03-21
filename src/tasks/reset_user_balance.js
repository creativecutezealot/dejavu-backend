
const path = require('path');
const dotenv = require('dotenv').config({ path: path.join(__dirname, '../../.env') });;
const db = require('../../config/db');
const UserBalance = require('../app/user_balance/models/user_balance.model');
function seed(){
    UserBalance.deleteMany({description:{"$ne":"Free Credit"}},(err,result)=>{
            process.exit(0);
            console.log("success reset");
    });
}
seed();

