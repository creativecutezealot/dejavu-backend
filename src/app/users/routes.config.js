const express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var VerifyToken = require('../auth/verify-token');
router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());
var UsersSerivce = require('./users.service');


router.post("/users/friends/unfriend", [VerifyToken], async (req, res) => { //Unfriend
    const data = await UsersSerivce.unfriend(req);
    return res.status((data.httpStatus ? data.httpStatus : 200)).send(data);
});


router.post("/users/friends/send-friend-request", [VerifyToken], async (req, res) => { //VerifyToken
    const data = await UsersSerivce.sendFriendRequest(req);
    return res.status((data.httpStatus ? data.httpStatus : 200)).send(data);
});

router.post("/users/friends/accept", [VerifyToken], async (req, res) => { //Unfriend
    const data = await UsersSerivce.acceptFriend(req);
    return res.status((data.httpStatus ? data.httpStatus : 200)).send(data);
});


router.get("/users/top", [VerifyToken], async (req, res) => {
    const data = await UsersSerivce.getTopUsers();
    return res.status((data.httpStatus ? data.httpStatus : 200)).send(data);
});

router.get("/users/getrank", [VerifyToken], async (req, res) => {
    const user_id = req.decoded_data.user_id;
    const data = await UsersSerivce.getUserRank(user_id);
    return res.status((data.httpStatus ? data.httpStatus : 200)).send(data);
});


router.get("/users/search", [VerifyToken], async (req, res) => { //VerifyToken

    const data = await UsersSerivce.searchUsers(req);
    return res.status((data.httpStatus ? data.httpStatus : 200)).send(data);
});

router.get("/users/friends", [VerifyToken], async (req, res) => { //Friends
    const data = await UsersSerivce.listFriends(req);
    return res.status((data.httpStatus ? data.httpStatus : 200)).send(data);
});

router.post("/user/remove-account", [VerifyToken], async (req, res) => { //VerifyToken
    const user_id = req.decoded_data.user_id;
    const data = await UsersSerivce.removeAccount(user_id);
    return res.status((data.httpStatus ? data.httpStatus : 200)).send(data);
});

router.post("/user/add-chip", [VerifyToken], async (req, res) => { //VerifyToken
    const user_id = req.decoded_data.user_id;
    const data = await UsersSerivce.addChip(user_id);
    return res.status((data.httpStatus ? data.httpStatus : 200)).send(data);
});

router.post("/user/add-diamond", [VerifyToken], async (req, res) => { //VerifyToken
    const user_id = req.decoded_data.user_id;
    const data = await UsersSerivce.addDiamond(user_id);
    return res.status((data.httpStatus ? data.httpStatus : 200)).send(data);
});


router.get("/user/:id", [VerifyToken], async (req, res) => { //VerifyToken
    const id = req.params.id;
    const data = await UsersSerivce.getUser(id);
    return res.status((data.httpStatus ? data.httpStatus : 200)).send(data);
});

module.exports = router;