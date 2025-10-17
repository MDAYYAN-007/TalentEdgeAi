'use server';

import { query } from "@/actions/db";

export async function getPublicJobDetails(jobId) {
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
            WHERE j.id = $1 AND j.status = 'Active'
        `;

        const result = await query(sql, [jobId]);

        if (result.rows.length === 0) {
            return {
                success: false,
                message: "Job not found or no longer active."
            };
        }

        return {
            success: true,
            job: result.rows[0]
        };

    } catch (error) {
        console.error("Public job details fetch error:", error);
        return { 
            success: false, 
            message: "Internal server error fetching job details." 
        };
    }
}