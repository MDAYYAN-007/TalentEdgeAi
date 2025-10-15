'use server';

import { query } from '@/actions/db';
import jwt from 'jsonwebtoken';

export async function verifyOTP(formData) {
    try {
        const { email, otp } = formData;

        // Check if OTP exists and is valid
        const otpRes = await query(
            "SELECT * FROM otp_temp WHERE email=$1 AND otp=$2 AND expires_at > NOW()",
            [email, otp]
        );

        if (!otpRes.rows.length) {
            return { success: false, message: "Invalid or expired OTP" };
        }

        const otpRecord = otpRes.rows[0];

        // Move user from otp_temp to users table
        await query(
            "INSERT INTO users (email, password, role, first_name, last_name, verified, created_at) VALUES ($1, $2, $3, $4, $5, $6, NOW())",
            [email, otpRecord.password, otpRecord.role, otpRecord.first_name, otpRecord.last_name, true]
        );

        // Get the newly created user
        const userRes = await query("SELECT * FROM users WHERE email=$1", [email]);
        const user = userRes.rows[0];

        // Create full name
        const fullName = `${user.first_name || ""} ${user.last_name || ""}`.trim();

        // Generate JWT
        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role,
                name: fullName,
                isProfileComplete: user.isprofilecomplete || false,
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRY || "7d" }
        );

        // Clean up OTP record
        await query("DELETE FROM otp_temp WHERE email=$1", [email]);

        return {
            success: true,
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                name: fullName,
                isProfileComplete: user.isprofilecomplete || false,
            }
        };
    } catch (error) {
        console.error("Verify OTP error:", error);
        return { success: false, message: "Verification failed" };
    }
}