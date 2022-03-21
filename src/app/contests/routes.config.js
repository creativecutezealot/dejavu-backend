const express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var VerifyToken = require('../auth/verify-token');
router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());
var ContestsService = require('./contests.service');


router.post("/contest/create",[VerifyToken],async(req,res)=>{ 
    const data = await ContestsService.create(req);
    return res.status((data.httpStatus?data.httpStatus:200)).send(data); 
});

router.get("/contests",[VerifyToken],async(req,res)=>{ 
    const data = await ContestsService.list(req);
    return res.status((data.httpStatus?data.httpStatus:200)).send(data); 
});

router.get("/contest-invites",[VerifyToken],async(req,res)=>{ 
    const data = await ContestsService.getInvites(req);
    return res.status((data.httpStatus?data.httpStatus:200)).send(data); 
});

router.post("/contest/accept",[VerifyToken],async(req,res)=>{ 
    const data = await ContestsService.accept(req);
    return res.status((data.httpStatus?data.httpStatus:200)).send(data); 
});

router.post("/contest/delete",[VerifyToken],async(req,res)=>{ 
    const data = await ContestsService.delete(req);
    return res.status((data.httpStatus?data.httpStatus:200)).send(data); 
});

router.get("/contest/rank",[VerifyToken],async(req,res)=>{ 
    const data = await ContestsService.getRanks(req);
    return res.status((data.httpStatus?data.httpStatus:200)).send(data); 
});



module.exports = router;