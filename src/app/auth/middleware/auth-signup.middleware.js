var User = require('../../users/models/users.model');
function authSignUp(req, res, next) {

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

    if(req.body.password){
        if(req.body.password==""){
            return res.status(200).send({message:"Password is required",success:false});
        }
    }else{
        return res.status(200).send({message:"Password is required",success:false});
    }

    User.findOne({'first_name':req.body.first_name, 'last_name': req.body.last_name},(err,data)=>{
        if(err){
            return res.status(200).send({message:"Error Occured (EMV)",success:false});
        }
        if(data){
            return res.status(200).send({message:"First and Last name already exists",success:false});
        } else {
            User.findOne({'email':req.body.email},(err,data)=>{
                if(err){
                    console.log(err)
                    return res.status(200).send({message:"Error Occured (EMV)",success:false});
                }
                if(data){
                    return res.status(200).send({message:"Email already exists",success:false});
                } else {
                    User.findOne({'display_name':req.body.display_name},(err,data)=>{
                        if(err){
                            return res.status(200).send({message:"Error Occured (EMV)",success:false});
                        }
                        if(data){
                            return res.status(200).send({message:"Display name already exists",success:false});
                        }else{
                            next();
                        }
                    });
                }
            });
        }
    });

 
    

   
}

module.exports = authSignUp;