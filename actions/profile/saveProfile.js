'use server';

import { query } from '@/actions/db';
import jwt from 'jsonwebtoken';

export async function saveProfile(profileData) {
    try {
        const {
            userId,
            name,
            email,
            role,
            phone,
            linkedinUrl,
            portfolioUrl,
            resumeUrl,
            experiences,
            education,
            skills,
            projects
        } = profileData;

        console.log("Saving profile for userId:", name);
        // Validate required field
        if (!userId) {
            return { success: false, message: "userId is required" };
        }

        // Upsert query: insert if not exists, else update
        const sql = `
            INSERT INTO profiles
                (user_id, phone, linkedin_url, portfolio_url, resume_url, experiences, education, skills, projects)
            VALUES
                ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (user_id)
            DO UPDATE SET
                phone = EXCLUDED.phone,
                linkedin_url = EXCLUDED.linkedin_url,
                portfolio_url = EXCLUDED.portfolio_url,
                resume_url = EXCLUDED.resume_url,
                experiences = EXCLUDED.experiences,
                education = EXCLUDED.education,
                skills = EXCLUDED.skills,
                projects = EXCLUDED.projects,
                updated_at = CURRENT_TIMESTAMP
            RETURNING *;
        `;

        const values = [
            userId,
            phone || null,
            linkedinUrl || null,
            portfolioUrl || null,
            resumeUrl || null,
            JSON.stringify(experiences || []),
            JSON.stringify(education || []),
            JSON.stringify(skills || []),
            JSON.stringify(projects || [])
        ];

        const result = await query(sql, values);

        // Generate new JWT token with updated profile completion status
        const newToken = jwt.sign(
            {
                id: userId,
                email,
                role,
                name,
                isProfileComplete: true,
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRY || "7d" }
        );

        return {
            success: true,
            token: newToken,
        };
    } catch (error) {
        console.error("Profile save error:", error);
        return { success: false, message: "An unexpected error occurred" };
    }
}