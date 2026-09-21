const nodemailer = require("nodemailer");

export const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    },
    tls: {
        rejectUnauthorized: false
    }
});

export const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.EMAIL_TO || 'itsprivate203@gmail.com',
}