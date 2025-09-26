import config from "../config";
import nodemailer from "nodemailer";

export const sendEmail = async (
  to: string,
  resetPassLink?: string,
  confirmLink?: string
) => {
  const transporter = nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: 587,
    secure: false,
    auth: {
      user: config.sendEmail.brevo_email,
      pass: config.sendEmail.brevo_pass,
    },
  });

  // const formattedDate = new Intl.DateTimeFormat("en-US", {
  //   dateStyle: "medium",
  //   timeStyle: "short",
  // }).format(new Date());

  // const clickableResetPass = `<a href="${resetPassLink}" style="color: #28C76F; text-decoration: underline;">here</a>`;
  // const clickableConfirm = `<a href="${confirmLink}" style="color: #28C76F; text-decoration: underline;">here</a>`;

  const html = `
  <div style="max-width: 600px; margin: 0 auto; background-color: #F6F7F9; color: #000; border-radius: 8px; padding: 24px;">
    ${
      confirmLink
        ? `
          <h3 style="text-align: center; color: #000;">Verify Your Email Within 5 Minutes</h3>
          <div style="padding: 0 1em; text-align: center;">
            <a href="${confirmLink}" 
               style="display: inline-block; padding: 12px 24px; background-color: #28C76F; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold;">
               Verify Email
            </a>
          </div>`
        : `
          <h3 style="text-align: center; color: #000;">Reset Your Password Within 5 Minutes</h3>
          <div style="padding: 0 1em; text-align: center;">
            <a href="${resetPassLink}" 
               style="display: inline-block; padding: 12px 24px; background-color: #28C76F; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold;">
               Reset Password
            </a>
          </div>`
    }
  </div>
`;

  await transporter.sendMail({
    from: `"Whats Real Easy" <${config.sendEmail.email_from}>`,
    to,
    subject: `${
      resetPassLink
        ? `Reset Your Password within 5 Minutes.`
        : `Verify Your Email within 5 Minutes.`
    }`,
    text: "Hello world?",
    html: html,
  });
};
