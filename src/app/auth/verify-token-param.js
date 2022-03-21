var jwt = require('jsonwebtoken');
var config = require('../../../config/api_secrets');

function verifyTokenParam(req, res, next) {
  var token = req.params.token;
  if (!token) 
    return res.status(403).send({ auth: false, message: 'No token provided.' });
    jwt.verify(token, config.secret_key, function(err, decoded) {      
    if (err) 
      return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
    req.decoded_data = decoded;
    next();
  });
}
module.exports = verifyTokenParam;