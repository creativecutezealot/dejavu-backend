function authSignIn(req, res, next) {
    if(req.body.email){
        if(req.body.email==""){
            return res.status(400).send({success:false,message:"Username is required"});
        }
    }else{
        return res.status(400).send({success:false,message:"Username is required"});
    }
    if(req.body.password){
        if(req.body.password==""){
            return res.status(400).send({success:false,message:"Password is required"});
        }
    }else{
        return res.status(400).send({success:false,message:"Password is required"});
    }
    next();
}

module.exports = authSignIn;