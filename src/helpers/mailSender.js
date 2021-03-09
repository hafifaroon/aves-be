const nodemailer = require('nodemailer');
const responseMsg = require('../helpers/responseMessage');

var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: "avesbox2020@gmail.com",
    pass: "Pemalang123"
  }
});

exports.forgetPassword = async (email, token) => {
    let info = await transporter.sendMail({
        from: `"${process.env.NAME_SENDER} 🐔" <${process.env.MAIL_SENDER}>`,
        to: `"${email}"`,
        subject: "Avesbox: Reset Password",
        text: `Reset Password`,
        html: `${responseMsg.sendResetPassword('http://localhost:3000/recover/password' , token)}`
    });

    return info;
}

exports.verifyEmail = async (email, token) => {
    let info = await transporter.sendMail({
        from: `"${process.env.NAME_SENDER} 🐔" <${process.env.MAIL_SENDER}>`,
        to: `"${email}"`,
        subject: "Avesbox: Verify Email",
        text: `Verify Your Email`,
        html: `${responseMsg.sendVerifyEmail('http://localhost:8000/verify-email' , token, "https://localhost:8000")}`
    });

    return info;
}

exports.OTP = async (email, token) => {
    let info = await transporter.sendMail({
        from: `"${process.env.NAME_SENDER} 🐔" <${process.env.MAIL_SENDER}>`,
        to: `"${email}"`,
        subject: "Avesbox: Change Email",
        text: `Change Your Email`,
        html: `${responseMsg.OTP(token, "https://localhost:8000")}`
    });

    return info;
}

exports.OTP2 = async (email, token) => {
    let info = await transporter.sendMail({
        from: `"${process.env.NAME_SENDER} 🐔" <${process.env.MAIL_SENDER}>`,
        to: `"${email}"`,
        subject: "Avesbox: Change Password",
        text: `Change Your Password`,
        html: `${responseMsg.OTP(token, "https://localhost:8000")}`
    });

    return info;
}
