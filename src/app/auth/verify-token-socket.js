var jwt = require('jsonwebtoken');
var config = require('../../../config/api_secrets');
function verifyTokenSocket(token) {
  
  if (!token){
        return {success:false,'message':'Token is required'};
    } 
   
    return jwt.verify(token, config.secret_key, function(err, decoded) {      
   
    if (err){
    
      return {success:false,'message':'Failed to authenticate token.'};
    }
    
    return  {success:true,'message':'Token is valid','data':decoded};
  });
}
module.exports = verifyTokenSocket;