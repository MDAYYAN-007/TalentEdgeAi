'use server';

import { cookies } from 'next/headers';
import { query } from '@/actions/db';

export async function logout() {
    try {
        const cookieStore = cookies();
        const refreshToken = cookieStore.get('refreshToken')?.value;

        // Clear refresh token from database
        if (refreshToken) {
            await query(
                "UPDATE users SET refresh_token = NULL WHERE refresh_token = $1",
                [refreshToken]
            );
        }

        // Clear cookies
        cookieStore.delete('accessToken');
        cookieStore.delete('refreshToken');

        return { success: true };
    } catch (error) {
        console.error('Logout error:', error);
        // Still clear cookies even if DB operation fails
        const cookieStore = cookies();
        cookieStore.delete('accessToken');
        cookieStore.delete('refreshToken');
        return { success: true };
    }
}