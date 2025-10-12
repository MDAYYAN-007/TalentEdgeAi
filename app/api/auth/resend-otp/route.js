import { NextResponse } from "next/server";
import crypto from "crypto";
import { query } from "@/actions/db";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_PORT == 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function POST(req) {
  try {
    const { email } = await req.json();

    // Check if email exists in otp_temp
    const record = await query("SELECT * FROM otp_temp WHERE email=$1", [email]);
    if (!record.rows.length) {
      return NextResponse.json({ success: false, message: "No pending verification found" });
    }

    // Generate new OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

    await query(
      "UPDATE otp_temp SET otp=$1, expires_at=$2 WHERE email=$3",
      [otp, expiresAt, email]
    );

    // Send OTP email
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: email,
      subject: "Your TalentEdge AI OTP (Resent)",
      text: `Your new OTP is: ${otp}. It expires in 5 minutes.`,
    });

    return NextResponse.json({ success: true, message: "OTP resent successfully" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, message: "Failed to resend OTP" });
  }
}
