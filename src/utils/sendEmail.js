const nodemailer = require('nodemailer');


const sendEmail = async(options) => {
    //1- Create transporter => (Service that will send email like "gmail")
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: true,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
        }
    });
    //2- Defined email options (like from, to, subject, email content)
    const mailOptions = {
        from: `E-Commerce App <${process.env.EMAIL_USER}>`,
        to: options.email,
        subject: options.subject,
        text: options.message
    };
    //3- Send email
    await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;


/**
 * Reset Password Email Template
 */
module.exports.resetPasswordTemplate = (name, resetCode) => `
Hi ${name},\n
We received a request to reset the password on your E-Commerce Account.\n
Your reset code is: ${resetCode}\n
Enter this code to complete the reset.\n
Thanks for helping us keep your account secure.\n
The E-Commerce Team
`;


module.exports.verificationTemplate = (name, code) => `
Hi ${name},\n
Your email verification code is: ${code}.\n
The E-Commerce Team
`;

