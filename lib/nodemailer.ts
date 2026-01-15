import nodemailer from "nodemailer";

// Use SMTP pooling and a direct SMTP host for better connection reuse and lower latency
const transporter = nodemailer.createTransport({
  pool: true,
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.NODEMAILER_EMAIL,
    pass: process.env.NODEMAILER_PASSKEY,
  },
  maxConnections: 3,
  maxMessages: 100,
  tls: {
    rejectUnauthorized: false,
    ciphers: "SSLv3"
  },
});

export default transporter;
