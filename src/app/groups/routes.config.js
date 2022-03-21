const express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var VerifyToken = require('../auth/verify-token');
router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());
var GroupsService = require('./groups.service');
var ValidateCreate = require('./middleware/groups-create.middleware');
var ValidateUpdate = require('./middleware/groups-update.middleware');


router.post("/groups/user/remove",[VerifyToken],async(req,res)=>{ 
    const data = await GroupsService.remove(req);
    return res.status((data.httpStatus?data.httpStatus:200)).send(data); 
});

router.get("/groups/users/search",[VerifyToken],async(req,res)=>{ 
    const data = await GroupsService.search(req);
    return res.status((data.httpStatus?data.httpStatus:200)).send(data); 
});

router.post("/groups/create",[VerifyToken,ValidateCreate],async(req,res)=>{ 
    const data = await GroupsService.create(req);
    return res.status((data.httpStatus?data.httpStatus:200)).send(data); 
});

router.post("/groups/update",[VerifyToken,ValidateUpdate],async(req,res)=>{ 
    const data = await GroupsService.update(req);
    return res.status((data.httpStatus?data.httpStatus:200)).send(data); 
});

router.post("/groups/invite",[VerifyToken],async(req,res)=>{ 
    
    const data = await GroupsService.invite(req);
    return res.status((data.httpStatus?data.httpStatus:200)).send(data); 
});

router.post("/groups/accept",[VerifyToken],async(req,res)=>{ 
    
    const data = await GroupsService.accept(req);
    return res.status((data.httpStatus?data.httpStatus:200)).send(data); 
});



router.post("/groups/leave",[VerifyToken],async(req,res)=>{ 
    const data = await GroupsService.leave(req);
    return res.status((data.httpStatus?data.httpStatus:200)).send(data); 
});

router.get("/groups/pending",[VerifyToken],async(req,res)=>{ 
    const data = await GroupsService.search_pending(req);
    return res.status((data.httpStatus?data.httpStatus:200)).send(data); 
});

router.get("/groups/members/:group_id",[VerifyToken],async(req,res)=>{ 
    const data = await GroupsService.groups_members(req);
    return res.status((data.httpStatus?data.httpStatus:200)).send(data); 
});



router.get("/groups",[VerifyToken],async(req,res)=>{ 
    
    const data = await GroupsService.list(req);
    return res.status((data.httpStatus?data.httpStatus:200)).send(data); 
});



module.exports = router;