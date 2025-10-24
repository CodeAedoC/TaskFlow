import sgMail from "@sendgrid/mail";
import axios from "axios";

// Configure SendGrid with retry logic
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
sgMail.setTimeout(15000); // 15 seconds timeout

// Configure axios instance for SendGrid
const sgClient = axios.create({
  baseURL: "https://api.sendgrid.com/v3",
  timeout: 15000,
  headers: {
    Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
    "Content-Type": "application/json",
  },
});

export async function sendVerificationEmail(to, url) {
  const msg = {
    to,
    from: {
      email: process.env.SENDGRID_FROM_EMAIL,
      name: "TaskFlow",
    },
    subject: "Verify your TaskFlow account",
    html: `
      <div style="background-color: #0f172a; padding: 20px; font-family: Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #1e293b; padding: 30px; border-radius: 16px; border: 1px solid #3f4c6b;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold; text-align: center;">Welcome to TaskFlow!</h1>
          <p style="color: #cbd5e1; font-size: 16px; line-height: 24px; margin: 20px 0;">
            Please verify your email address to get started with TaskFlow.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${url}" 
               style="display: inline-block; background: linear-gradient(to right, #14b8a6, #10b981); 
                      color: white; padding: 14px 28px; text-decoration: none; 
                      border-radius: 12px; font-weight: 600; font-size: 16px;">
              Verify Email Address
            </a>
          </div>
        </div>
      </div>
    `,
  };

  try {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`Attempt ${attempt} to send verification email to ${to}`);
        await sgMail.send(msg);
        console.log(`Email sent successfully to ${to}`);
        return;
      } catch (error) {
        if (attempt === 3) throw error;
        console.log(`Attempt ${attempt} failed, retrying...`);
        await new Promise((resolve) => setTimeout(resolve, 2000 * attempt));
      }
    }
  } catch (error) {
    console.error("Error sending verification email:", error);
    if (error.response) {
      console.error("SendGrid API error:", error.response.body);
    }
    throw new Error("Failed to send verification email");
  }
}
