const express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var VerifyToken = require('../auth/verify-token');
router.use(bodyParser.urlencoded({extended: true}));
router.use(bodyParser.json());
