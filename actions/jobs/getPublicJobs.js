'use server';

import { query } from "@/actions/db";

export async function getPublicJobs() {
    try {
        const sql = `
            SELECT 
                j.id, 
                j.title, 
                j.department,
                j.job_type,
                j.work_mode,
                j.location,
                j.min_salary,
                j.max_salary,
                j.currency,
                j.experience_level,
                j.required_skills,
                j.qualifications,
                j.responsibilities,
                j.job_description,
                j.status,
                j.created_at,
                j.updated_at,
                o.company_name
            FROM jobs j
            JOIN organizations o ON j.org_id = o.id
            WHERE j.status = 'Active'
            ORDER BY j.created_at DESC
        `;

        const result = await query(sql);

        return {
            success: true,
            jobs: result.rows,
        };

    } catch (error) {
        console.error("Public jobs fetch error:", error);
        return { 
            success: false, 
            message: "Internal server error fetching jobs." 
        };
    }
}