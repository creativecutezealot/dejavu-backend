const express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var VerifyToken = require('../auth/verify-token');
router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());
var PropBetsService = require('./prop-bets.service');

router.post("/propbet/create", [VerifyToken], async (req, res) => {
    const user_id = req.decoded_data.user_id;
    const data = await PropBetsService.create(req.body, user_id);
    return res.status((data.httpStatus ? data.httpStatus : 200)).send(data);
});

router.get("/propbet/all", [VerifyToken], async (req, res) => {
    const user_id = req.decoded_data.user_id;
    const data = await PropBetsService.getAllBets();
    return res.status((data.httpStatus ? data.httpStatus : 200)).send(data);
});

router.get("/propbet/proposed", [VerifyToken], async (req, res) => {
    const user_id = req.decoded_data.user_id;
    const data = await PropBetsService.getProposedBets(req.query, user_id);
    return res.status((data.httpStatus ? data.httpStatus : 200)).send(data);
});

router.get("/propbet/accepted", [VerifyToken], async (req, res) => {
    const user_id = req.decoded_data.user_id;
    const data = await PropBetsService.getAcceptedBets(req.query, user_id);
    return res.status((data.httpStatus ? data.httpStatus : 200)).send(data);
});

router.get("/propbet/available", [VerifyToken], async (req, res) => {
    const user_id = req.decoded_data.user_id;
    const data = await PropBetsService.getAvailableBets(req.query, user_id);
    return res.status((data.httpStatus ? data.httpStatus : 200)).send(data);
});

router.get("/propbet/completed", [VerifyToken], async (req, res) => {
    const user_id = req.decoded_data.user_id;
    const data = await PropBetsService.getCompletedBets(req.query, user_id);
    return res.status((data.httpStatus ? data.httpStatus : 200)).send(data);
});

module.exports = router;