const express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var VerifyToken = require('../auth/verify-token');
router.use(bodyParser.urlencoded({extended: true}));
router.use(bodyParser.json());
var BetsService = require('./bets.service');

router.post("/bet/remove",[VerifyToken],async (req,res)=>{
        const user_id = req.decoded_data.user_id;
        const data =  await BetsService.deleteBet(req.body, user_id);
        return res.status((data.httpStatus?data.httpStatus:200)).send(data);
});

router.get("/bet/all",[VerifyToken],async (req,res)=>{
        const user_id = req.decoded_data.user_id;
        const data =  await BetsService.getBets(req.query, user_id);
        return res.status((data.httpStatus?data.httpStatus:200)).send(data);
});
module.exports = router;