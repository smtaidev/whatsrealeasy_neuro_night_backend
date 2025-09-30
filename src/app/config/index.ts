import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.join(process.cwd(), ".env") });

export default {
  NODE_ENV: process.env.NODE_ENV,
  port: process.env.PORT || 5005,
  host: process.env.HOST || "localhost",
  databaseUrl: process.env.DATABASE_URL,
  sendEmail: {
    email_from: process.env.EMAIL_FROM,
    brevo_pass: process.env.BREVO_PASS,
    brevo_email: process.env.BREVO_EMAIL,
  },
  jwt: {
    access: {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN,
    },
    refresh: {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
    },
    resetPassword: {
      expiresIn: process.env.JWT_RESET_PASS_ACCESS_EXPIRES_IN,
    },
  },
  superAdmin: {
    email: process.env.SUPER_ADMIN_EMAIL,
    password: process.env.SUPER_ADMIN_PASSWORD,
    name: process.env.SUPER_ADMIN_NAME,
  },
  url: {
    image: process.env.IMAGE_URL,
    backend: process.env.BACKEND_URL,
    frontend: process.env.FRONTEND_URL,
  },
  verify: {
    email: process.env.VERIFY_EMAIL_LINK,
    resetPassUI: process.env.RESET_PASS_UI_LINK,
    resetPassLink: process.env.VERIFY_RESET_PASS_LINK,
  },
  cloudinary: {
    cloudinary_cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    cloudinary_api_key: process.env.CLOUDINARY_API_KEY,
    cloudinary_api_secret: process.env.CLOUDINARY_API_SECRET,
  },

  // process.env.CLIENT_ID,
  // process.env.SECRET_ID,
  // process.env.REDIRECT
  calendar: {
    client_id: process.env.CLIENT_ID,
    secret_id: process.env.SECRET_ID,
    redirect: process.env.REDIRECT,
  }
};
