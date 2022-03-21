var Mail = require('../mailer/mail');
Mail.send("natmbndev3@gmail.com","Password Reset","Hello,\n\n Here's your reset code 123.\n\nRegards,\nDejavu Sports Team","Hello,<br/><br/> Here's your reset code <strong>123</strong>.<br/><br/>Regards,<br/>Dejavu Sports Team")
.then(resp=>console.log(resp))
.catch(err=>console.log(err));
