'use server';

import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { query } from '@/actions/db';

export async function verifyAuth() {
    try {
        // ADD 'await' here:
        const cookieStore = await cookies();
        const accessToken = cookieStore.get('accessToken')?.value;

        if (!accessToken) {
            return { success: false, user: null };
        }

        try {
            const { payload } = await jwtVerify(
                accessToken,
                new TextEncoder().encode(process.env.JWT_SECRET)
            );

            return {
                success: true,
                user: payload
            };
        } catch (error) {
            // Token expired or invalid, try refresh
            return await refreshTokens();
        }
    } catch (error) {
        return { success: false, user: null };
    }
}

async function refreshTokens() {
    try {
        // ADD 'await' here too:
        const cookieStore = await cookies();
        const refreshToken = cookieStore.get('refreshToken')?.value;

        if (!refreshToken) {
            return { success: false, user: null };
        }

        // Verify refresh token
        const { payload } = await jwtVerify(
            refreshToken,
            new TextEncoder().encode(process.env.REFRESH_TOKEN_SECRET)
        );

        // Check if refresh token exists in database
        const userRes = await query(
            "SELECT * FROM users WHERE id = $1 AND refresh_token = $2",
            [payload.id, refreshToken]
        );

        if (!userRes.rows.length) {
            // Invalid refresh token, clear cookies
            cookieStore.delete('accessToken');
            cookieStore.delete('refreshToken');
            return { success: false, user: null };
        }

        const user = userRes.rows[0];

        // Generate new access token
        const fullName = `${user.first_name || ""} ${user.last_name || ""}`.trim();

        const newAccessToken = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role,
                name: fullName,
                isProfileComplete: user.isprofilecomplete || false,
                type: 'access'
            },
            process.env.JWT_SECRET,
            { expiresIn: '15m' }
        );

        // Set new access token cookie
        cookieStore.set('accessToken', newAccessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 15 * 60,
            path: '/',
        });

        return {
            success: true,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                name: fullName,
                isProfileComplete: user.isprofilecomplete || false,
            }
        };

    } catch (error) {
        // Clear invalid cookies
        const cookieStore = await cookies();
        cookieStore.delete('accessToken');
        cookieStore.delete('refreshToken');
        return { success: false, user: null };
    }
}