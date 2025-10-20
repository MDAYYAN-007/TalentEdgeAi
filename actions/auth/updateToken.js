// In your server actions file (e.g., auth/updateToken.js)
'use server';

import jwt from 'jsonwebtoken';

export async function updateUserToken(userData) {
    try {
        const token = jwt.sign(
            userData, 
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRY || "7d" }
        );
        return { success: true, token };
    } catch (error) {
        return { success: false, error: error.message };
    }
}