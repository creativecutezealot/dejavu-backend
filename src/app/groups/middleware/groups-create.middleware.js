const Groups = require('../models/groups.model');
async function validateCreate(req, res, next) {
    const name = req.body.name;
   
    if(name){
        if(name==""){
            return res.status(400).send({success:false,message:"Group Name is required"});
        }
    }else{
        return res.status(400).send({success:false,message:"Group Name is required"});
    }

    await Groups.findOne({name:name}).then(result=>{
        if(result){
            return res.status(400).send({success:false,message:"Group Name is already exist"});
        }
        next();
    });
}

module.exports = validateCreate;