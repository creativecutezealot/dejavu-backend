const express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var verifyToken = require('./verify-token');
var verifyTokenSocket = require('./verify-token-socket');
var authSignupMid = require('./middleware/auth-signup.middleware');
var authSigninMid = require('./middleware/auth-signin.middleware');
var userUpdateProfileMid = require('./middleware/user-update-profile.middleware');
var userUpdatePasswordMid = require('./middleware/user-update-password.middleware');
var AuthService = require('./auth.service');
var UserService = require('../users/users.service');
router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());


router.get('/verify_token', async (req, res) => {
    const token = req.headers['mbn-access-token'];
    const data = verifyTokenSocket(token);
    const user = await UserService.getUser(data.data.user_id);

    if (user == null) {
        return res.status(200).send({ success: false, message: "User does not exists" });
    }
    return res.status(200).send(data);
});

router.post('/auth/signin', authSigninMid, async (req, res) => {
    const data = await AuthService.signInUser(req);
    return res.status((data.httpStatus ? data.httpStatus : 200)).send(data);
});

router.post('/auth/signup', authSignupMid, async (req, res) => {
    const data = await AuthService.signUpUser(req);
    return res.status((data.httpStatus ? data.httpStatus : 200)).send(data);
});

router.post('/forgot-password/:step', async (req, res) => {
    const step = req.params.step;
    const data = await AuthService.processForgotPassword(step, req);

    return res.status(200).send(data);
});

router.get('/me', verifyToken, async (req, res) => {
    const user_id = req.decoded_data.user_id;
    const data = await AuthService.getMe(user_id);
    return res.status((data.httpStatus ? data.httpStatus : 200)).send(data.user);
});


router.put('/me/update', [verifyToken, userUpdateProfileMid], async (req, res) => {
    const user_id = req.decoded_data.user_id;
    const data = await AuthService.updateProfile(user_id, req);
    return res.status((data.httpStatus ? data.httpStatus : 200)).send(data);
});

router.put('/me/update-password', [verifyToken, userUpdatePasswordMid], async (req, res) => {
    const user_id = req.decoded_data.user_id;
    const data = await AuthService.updatePassword(user_id, req)
    return res.status((data.httpStatus ? data.httpStatus : 200)).send(data);
});

router.put('/me/updateFCMToken', [verifyToken], async (req, res) => {
    const user_id = req.decoded_data.user_id;
    const data = await AuthService.updateFCMToken(user_id, req);
    return res.status((data.httpStatus ? data.httpStatus : 200)).send(data);
});

module.exports = router;