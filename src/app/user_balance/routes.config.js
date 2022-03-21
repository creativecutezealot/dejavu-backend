const express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var VerifyToken = require('../auth/verify-token');
router.use(bodyParser.urlencoded({extended: true}));
router.use(bodyParser.json());
var UserBalanceService = require('./user_balance.service');
router.get("/user_balance/get_balance",[VerifyToken],async (req,res)=>{
         const user_id = req.decoded_data.user_id;
         const data =  await UserBalanceService.getBalance(user_id);
         
         return res.status((data.httpStatus?data.httpStatus:200)).send(data);
});
module.exports = router;