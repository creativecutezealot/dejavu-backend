var jwt = require('jsonwebtoken');
var bcrypt = require('bcrypt');
var config = require('../../../config/api_secrets');
var User = require('../../app/users/models/users.model');
var UserBalanace = require('../user_balance/models/user_balance.model');
var mongoose = require('mongoose');
var Mail = require('../../utils/mailer/mail');
class AuthService {
    static async signInUser(req) {
        return await User.findOneAndUpdate({ email: String(req.body.email).toLowerCase() }, { fcm_token: req.body.fcm_token}).then((user) => {
            if (!user) {
                return { message: 'Invalid Email', success: false };
            }
            var checkPassword = bcrypt.compareSync(req.body.password, user.password);
            if (!checkPassword) {
                return { 'message': 'Invalid password for the email ' + req.body.email, success: false };
            }
            var token = jwt.sign({ user_id: user._id }, config.secret_key, {
                expiresIn: config.tokenLifeTime
            });
            return {
                message: 'Success',
                success: true,
                token: token,
                user: user
            };
        }).catch(err => {
            console.log('Server Error: ', err);
            return { message: 'Server Error', success: false, httpStatus: 500 };
        });
    }//end

    static async signUpUser(req) {
        var form_data = {};
        const hashedPassword = bcrypt.hashSync(req.body.password, 8);
        form_data.first_name = String(req.body.first_name).trim();
        form_data.last_name = String(req.body.last_name).trim();
        form_data.display_name = String(req.body.display_name).trim();
        form_data.email = String(req.body.email).toLowerCase().trim();
        form_data.password = hashedPassword;
        form_data.fcm_token = String(req.body.fcm_token);
        form_data.status = 1;
        form_data.user_type = 2;
        form_data.created_at = new Date();
        form_data.updated_at = new Date();

        return await User.create(form_data).then(async (data) => {
            return await UserBalanace.create({
                user: data._id,
                type: 1,
                amount: 1000,
                description: "Free Credit",
                created_at: new Date(),
                updated_at: new Date()
            }).then((data) => {
                return { success: true, message: "You have successfully registered" };
            }).catch(err => {
                return { success: false, message: 'Server Error: User balance', httpStatus: 500 }
            });
        }).catch(err => {

            return { success: false, message: 'Server Error: User create', httpStatus: 500 };
        })
    }//end

    static async updateProfile(user_id, req) {
        return await User.findOneAndUpdate({ _id: mongoose.Types.ObjectId(user_id) }, {
            first_name: String(req.body.first_name).trim(),
            last_name: String(req.body.last_name).trim(),
            email: String(req.body.email).trim(),
            display_name: String(req.body.display_name).trim()
        }).then(async (data) => {
            return await User.findById(user_id).then((data) => {
                return { user: data, success: true, message: 'You have successfully updated your profile' };
            });
        }).catch(err => {
            return { success: false, message: 'Could not process your request' };
        });
    }//end

    static async updateFCMToken(user_id, req) {
        return await User.findOneAndUpdate({ _id: mongoose.Types.ObjectId(user_id) }, {
            fcm_token: req.body.fcm_token
        }).then(async (data) => {
            return await User.findById(user_id).then((data) => {
                return { user: data, success: true, message: 'You have successfully updated your profile' };
            });
        }).catch(err => {
            return { success: false, message: 'Could not process your request' };
        });
    }//end

    static async updatePassword(user_id, req) {
        const hashedPassword = bcrypt.hashSync(req.body.password, 8);
        return await User.findOneAndUpdate({ _id: mongoose.Types.ObjectId(user_id) }, {
            password: hashedPassword
        }).then(async (data) => {
            return await User.findById(user_id).then((data) => {
                return { user: data, success: true, message: 'You have successfully updated your password' };
            });
        }).catch(err => {
            return { success: false, message: 'Could not process your request' };
        });
    }//end

    static async getMe(user_id) {
        return await User.findById(user_id).then((user) => {
            if (!user) {
                return { message: "No user found.", success: false };
            }
            return { user: user };
        }).catch(err => {
            return { message: 'There was a problem finding the user.', success: false };
        })
    }//end

    static async processForgotPassword(step, req) {
        if (step == 1) {
            const email = req.body.email;
            console.log('email: ', email);
            return await User.findOne({ email: email }).then(async (data) => {
                if (!data) {
                    return { success: false, message: 'Your account does not exist, please create an account' };
                }
                const code = Math.floor(Math.random() * 10000) + 10000;
                return await User.findByIdAndUpdate(data._id, { reset_code: code }).then(async (data) => {
                    return await Mail.send(data.email, "Dejavu Sports: Password Reset", "Hello,\n\n Here's your reset code " + code + ".\n\nRegards,\nDejavu Sports Team", "Hello,<br/><br/> Here's your reset code <strong>" + code + "</strong>.<br/><br/>Regards,<br/>Dejavu Sports Team")
                        .then(resp => {
                            return { success: true, step: step, message: "We have sent a code to your email. If you don’t receive the message promptly, check your spam/junk folder." };
                        })
                        .catch(err => {
                            console.log(err);
                            return { success: false, message: 'There was a problem sending code to the user' };
                        });
                });
            }).catch(err => {
                return { success: false, message: 'There was a problem checking user' };
            });
        }
        if (step == 2) {
            const code = req.body.code;
            const email = req.body.email;
            return await User.findOne({ reset_code: code, email: email }).then((data) => {
                if (!data) {
                    return { success: false, message: "Invalid code" };
                }
                return { success: true, step: step, code: code, email: email, message: "The code is valid, you may now change your password" };
            }).catch(err => {
                return { success: false, message: "Invalid code" };
            })
        }
        if (step == 3) {
            const code = req.body.code;
            const email = req.body.email;
            const hashedPassword = bcrypt.hashSync(req.body.password, 8);
            return await User.findOneAndUpdate({ reset_code: code, email: email }, {
                password: hashedPassword,
                reset_code: ''
            }).then((data) => {
                return { success: true, step: step, message: 'You have successfully updated your password, you may now login to your account using your new password' };
            }).catch(err => {
                return { success: false, message: 'Could not process your request' };
            })
        }

        return { success: false, message: 'Could not process your step request' };
    }//end
}

module.exports = AuthService;