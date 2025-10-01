// import config from "../config";
// import nodemailer from "nodemailer";

// export const sendEmail = async (
//   to: string,
//   resetPassLink?: string,
//   confirmLink?: string
// ) => {
//   const transporter = nodemailer.createTransport({
//     host: "smtp-relay.brevo.com",
//     port: 587,
//     secure: true,
//     auth: {
//       user: config.sendEmail.brevo_email,
//       pass: config.sendEmail.brevo_pass,
//     },
//   });

//   const html = `
//   <div style="max-width: 600px; margin: 0 auto; background-color: #F6F7F9; color: #000; border-radius: 8px; padding: 24px;">
//     ${
//       confirmLink
//         ? `
//           <h3 style="text-align: center; color: #000;">Verify Your Email Within 5 Minutes</h3>
//           <div style="padding: 0 1em; text-align: center;">
//             <a href="${confirmLink}" 
//                style="display: inline-block; padding: 12px 24px; background-color: #28C76F; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold;">
//                Verify Email
//             </a>
//           </div>`
//         : `
//           <h3 style="text-align: center; color: #000;">Reset Your Password Within 5 Minutes</h3>
//           <div style="padding: 0 1em; text-align: center;">
//             <a href="${resetPassLink}" 
//                style="display: inline-block; padding: 12px 24px; background-color: #28C76F; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold;">
//                Reset Password
//             </a>
//           </div>`
//     }
//   </div>
// `;

//   await transporter.sendMail({
//     from: `"Whats Real Easy" <${config.sendEmail.email_from}>`,
//     to,
//     subject: `${
//       resetPassLink
//         ? `Reset Your Password within 5 Minutes.`
//         : `Verify Your Email within 5 Minutes.`
//     }`,
//     text: "Hello world?",
//     html: html,
//   });
// };


import config from "../config";
import nodemailer from "nodemailer";

export const sendEmail = async (
  to: string,
  resetPassLink?: string,
  confirmLink?: string
) => {
  const transporter = nodemailer.createTransport({
    host: config.sendEmail.host || "smtp.gmail.com",
    port: config.sendEmail.port || 465,
    secure: config.sendEmail.secure ?? true,
    auth: {
      user: config.sendEmail.user,
      pass: config.sendEmail.pass,
    },
  });

  const html = `
  <div style="max-width: 600px; margin: 0 auto; background-color: #F6F7F9; color: #000; border-radius: 8px; padding: 24px; font-family: Arial, sans-serif;">
    
    <!-- Title/Header -->
    <h2 style="text-align: center; color: #333;">Whats Real Easy</h2>
    <p style="text-align: center; color: #555; font-size: 14px;">Secure your account with the following action</p>
    
    <!-- Main Content -->
    <div style="margin-top: 20px; text-align: center;">
      ${
        confirmLink
          ? `
          <h3 style="color: #000;">Verify Your Email Within 5 Minutes</h3>
          <a href="${confirmLink}" 
             style="display: inline-block; margin-top: 10px; padding: 12px 24px; background-color: #28C76F; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold;">
             Verify Email
          </a>`
          : `
          <h3 style="color: #000;">Reset Your Password Within 5 Minutes</h3>
          <a href="${resetPassLink}" 
             style="display: inline-block; margin-top: 10px; padding: 12px 24px; background-color: #28C76F; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold;">
             Reset Password
          </a>`
      }
    </div>

    <!-- Footer -->
    <p style="text-align: center; margin-top: 30px; color: #888; font-size: 12px;">
      If you did not request this, please ignore this email.
    </p>

  </div>
`;

  await transporter.sendMail({
    from: `"Whats Real Easy" <${config.sendEmail.email_from}>`,
    to,
    subject: resetPassLink
      ? `Reset Your Password within 5 Minutes.`
      : `Verify Your Email within 5 Minutes.`,
    text: "Hello world?",
    html,
  });
};


// 1. MongoDb atlas 
// 2. cloudinary
// 3. Google App password
// 4. first time authenticate with api

