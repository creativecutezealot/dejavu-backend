const Groups = require('../models/groups.model');
async function validateUpdate(req, res, next) {
    const name = req.body.name;
    const group_id = req.body.group_id;
  
    if(name){
        if(name==""){
            return res.status(400).send({success:false,message:"Group Name is required"});
        }
    }else{
        return res.status(400).send({success:false,message:"Group Name is required"});
    }

    if(group_id){
        if(group_id==""){
            return res.status(400).send({success:false,message:"Group ID is required"});
        }
    }else{
        return res.status(400).send({success:false,message:"Group ID is required"});
    }

 

    await Groups.findOne({name:name,_id:{"$ne":group_id}}).then(result=>{
        if(result){
            return res.status(400).send({success:false,message:"Group Name is already exist"});
        }
        next();
    }).catch(err=>{
        return res.status(400).send({success:false,message:"Invalid Group"});
    });
}

module.exports = validateUpdate;