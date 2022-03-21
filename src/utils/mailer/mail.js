const path = require('path');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv').config({ path: path.join(__dirname, '../../../.env') });;

class Mail {
    static send(to, subject, text, html) {
        var transporter = nodemailer.createTransport({
            host: process.env.MAIL_HOST,
            port: process.env.MAIL_PORT,
            secure: process.env.MAIL_SECURE,
            auth: {
                user: process.env.MAIL_USERNAME,
                pass: process.env.MAIL_PASSWORD
            }
        });
        return transporter.sendMail({
            from: process.env.MAIL_DEFAULT_FROM,
            to: to,
            subject: subject,
            text: text,
            html: html
        });
    }
}
module.exports = Mail;