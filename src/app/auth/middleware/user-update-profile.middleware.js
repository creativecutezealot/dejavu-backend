var User = require('../../users/models/users.model');
var mongoose = require('mongoose'); 
function userUpdateProfile(req, res, next) {
    const user_id = req.decoded_data.user_id;
    if(req.body.first_name){
        if(req.body.first_name==""){
            return res.status(200).send({message:"First Name is required",success:false});
        }
    }else{
        return res.status(200).send({message:"First Name is required",success:false});
    }

    if(req.body.last_name){
        if(req.body.last_name==""){
            return res.status(200).send({message:"Last Name is required",success:false});
        }
    }else{
        return res.status(200).send({message:"Last Name is required",success:false});
    }

    if(req.body.email){
        if(req.body.email==""){
            return res.status(200).send({message:"Email is required",success:false});
        }
    }else{
        return res.status(200).send({message:"Email is required",success:false});
    }


    if(req.body.display_name){
        if(req.body.display_name==""){
            return res.status(200).send({message:"Diplay Name is required",success:false});
        }
    }else{
        return res.status(200).send({message:"Diplay Name is required",success:false});
    }
 
    User.findOne({'email':req.body.email,'_id':{$ne:mongoose.Types.ObjectId(user_id)}},(err,data)=>{
        if(err){
            return res.status(200).send({message:"Error Occured (EMV)",success:false});
        }
        if(data){
            return res.status(200).send({message:"Email already exists",success:false});
        }else{
            next();
        }
    });
}

module.exports = userUpdateProfile;