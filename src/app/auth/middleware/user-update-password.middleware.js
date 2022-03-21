var mongoose = require('mongoose'); 
function userUpdatePassword(req, res, next) {
    if(req.body.password){
        if(req.body.password==""){
            return res.status(200).send({message:"Password is required",success:false});
        }
    }else{
        return res.status(200).send({message:"Password is required",success:false});
    }

    if(req.body.password2){
        if(req.body.password2==""){
            return res.status(200).send({message:"Repeat Password is required",success:false});
        }
    }else{
        return res.status(200).send({message:"Repeat Password is required",success:false});
    }

    if(req.body.password!=req.body.password2){
        return res.status(200).send({message:"Password did not match",success:false});
    
    }

    next();

}

module.exports = userUpdatePassword;