const express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var VerifyToken = require('../auth/verify-token');
router.use(bodyParser.urlencoded({extended: true}));
router.use(bodyParser.json());
var UserDiamondsService = require('./user_diamonds.service');
router.get("/user_diamonds/get_diamonds",[VerifyToken],async (req,res)=>{
         const user_id = req.decoded_data.user_id;
         const data =  await UserDiamondsService.getDiamonds(user_id);
         
         return res.status((data.httpStatus?data.httpStatus:200)).send(data);
});
module.exports = router;