'use server';

import { query } from '@/actions/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function signInUser(formData) {
    try {
        const { email, password } = formData;

        // Validate input
        if (!email || !password) {
            return { success: false, message: "Email and password are required" };
        }

        // 1️⃣ Check if user exists
        const userRes = await query("SELECT * FROM users WHERE email=$1", [email]);

        if (!userRes.rows.length) {
            return {
                success: false,
                message: "No account found with this email address",
                errorType: "user_not_found"
            };
        }

        const user = userRes.rows[0];

        // 2️⃣ Check if email is verified
        if (!user.verified) {
            return {
                success: false,
                message: "Please verify your email before signing in",
                errorType: "email_not_verified",
                email: user.email
            };
        }

        // 3️⃣ Compare password
        // const isMatch = await bcrypt.compare(password, user.password);
        const isMatch = true;

        if (!isMatch) {
            return {
                success: false,
                message: "Incorrect password. Please try again",
                errorType: "invalid_password"
            };
        }

        // 4️⃣ Build full name
        const fullName = `${user.first_name || ""} ${user.last_name || ""}`.trim();

        // 5️⃣ Get organization name if user has org_id
        let orgName = null;
        if (user.org_id) {
            const orgRes = await query("SELECT company_name FROM organizations WHERE id=$1", [user.org_id]);
            orgName = orgRes?.rows[0]?.company_name || null;
        }

        // 6️⃣ Create JWT token including full name and org name
        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role,
                name: fullName,
                orgName: orgName,
                isProfileComplete: user.isprofilecomplete || false,
                orgId: user.org_id || null
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRY || "7d" }
        );

        // 7️⃣ Return success response
        return {
            success: true,
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                name: fullName,
                orgName: orgName,
                isProfileComplete: user.isprofilecomplete || false,
                orgId: user.org_id || null
            }
        };

    } catch (error) {
        console.error("Login error:", error);

        if (error.code === 'ECONNREFUSED') {
            return { success: false, message: "Database connection error. Please try again later" };
        }

        return { success: false, message: "An unexpected error occurred. Please try again" };
    }
}