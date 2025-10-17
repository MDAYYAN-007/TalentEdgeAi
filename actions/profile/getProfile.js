'use server';

import { query } from '@/actions/db';

export async function getProfile(userId) {
    try {

        if (!userId) {
            return { success: false, message: "userId is required" };
        }

        const sql = "SELECT * FROM profiles WHERE user_id = $1";
        const result = await query(sql, [userId]);

        if (!result.rows.length) {
            return {
                success: true,
                profile: null,
                message: "Profile not found",
            };
        }

        // Parse JSON fields before returning
        const profile = result.rows[0];
        
        profile.experiences = Array.isArray(profile.experiences) ? profile.experiences : [];
        profile.education = Array.isArray(profile.education) ? profile.education : [];
        profile.skills = Array.isArray(profile.skills) ? profile.skills : [];
        profile.projects = Array.isArray(profile.projects) ? profile.projects : [];

        return {
            success: true,
            profile,
        };
    } catch (error) {
        console.error("Error fetching profile:", error);
        return { success: false, message: "An unexpected error occurred" };
    }
}