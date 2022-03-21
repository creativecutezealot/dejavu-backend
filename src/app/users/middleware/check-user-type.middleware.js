var UserType = require('../../user-type/models/user-type.model');
function checkUserTypeCreate(req, res, next) {
    UserType.findOne({'slug':req.params.user_type},(err,data)=>{
        if(!data){
            return res.status(400).send("User Type Does not exist");
        }else{
            req.params.user_type = data._id;
            next();
        }
    });
  }
  module.exports = checkUserTypeCreate;