const express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var VerifyToken = require('../auth/verify-token');
router.use(bodyParser.urlencoded({extended: true}));
router.use(bodyParser.json());
var BattersService = require('./batters.service');
router.get("/batters/get",[VerifyToken],async (req,res)=>{
        // const user_id = req.decoded_data.user_id;
         const game_id = req.query.game_id;
         const data =  await BattersService.getBatters(game_id);
         return res.status((data.httpStatus?data.httpStatus:200)).send(data);
});
module.exports = router;