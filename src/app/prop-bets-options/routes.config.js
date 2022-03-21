const express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var VerifyToken = require('../auth/verify-token');
router.use(bodyParser.urlencoded({extended: true}));
router.use(bodyParser.json());
var PropBetsOptions = require('./prop-bets-options.service');
router.get("/prop-bets-options/get/:section",[VerifyToken],async (req,res)=>{
        // const user_id = req.decoded_data.user_id;
         const section = req.params.section;
         const data =  await PropBetsOptions.getAllOptions(section);
         return res.status((data.httpStatus?data.httpStatus:200)).send(data);
});
router.get("/prop-bets-options/get-send-to-options",[VerifyToken],async (req,res)=>{
         const data =  await PropBetsOptions.getAllOptionsSendTo(req);
         return res.status((data.httpStatus?data.httpStatus:200)).send(data);
});
module.exports = router;