'use server';

import crypto from "crypto";
import bcrypt from "bcryptjs";
import { query } from '@/actions/db';
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_PORT == "465",
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export async function signupUser(formData) {
    try {
        const { email, password, firstName, lastName } = formData;

        // Check if email already exists
        const exists = await query("SELECT * FROM users WHERE email=$1", [email]);
        if (exists.rows.length > 0) {
            return { success: false, message: "Email already exists" };
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        const otp = crypto.randomInt(100000, 999999).toString();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

        // Store OTP and name temporarily
        await query(
            "INSERT INTO otp_temp (email, otp, password, role, first_name, last_name, created_at, expires_at) VALUES ($1,$2,$3,$4,$5,$6,NOW(),$7)",
            [email, otp, hashedPassword, "user", firstName, lastName, expiresAt]
        );

        await transporter.sendMail({
            from: process.env.SMTP_USER,
            to: email,
            subject: "Your TalentEdge AI OTP",
            text: `Your OTP is: ${otp}. It expires in 5 minutes.`,
        });

        return { success: true };
    } catch (error) {
        console.error(error);
        return { success: false, message: "Signup failed" };
    }
}