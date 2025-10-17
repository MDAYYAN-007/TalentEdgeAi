'use server';

import { query } from "@/actions/db";

export async function getJobs(authData) {
    try {
        const { orgId, userId, userRole } = authData;

        if (!orgId) {
            return { success: false, message: "Missing organization ID. Authorization failed." };
        }

        console.log(`Fetching jobs for organization ID: ${orgId}`);

        const sql = `
            SELECT 
                j.id, j.title, j.department, j.job_type, j.work_mode, j.location, 
                j.min_salary, j.max_salary, j.currency, j.experience_level, 
                j.required_skills, j.qualifications, j.responsibilities, 
                j.job_description, j.status, j.created_at, j.posted_by, 
                j.assigned_recruiters,
                CONCAT(u.first_name, ' ', u.last_name) AS posted_by_name
            FROM jobs j
            JOIN users u ON j.posted_by = u.id
            WHERE j.org_id = $1
            ORDER BY j.created_at DESC;
        `;

        const result = await query(sql, [orgId]);

        return {
            success: true,
            jobs: result.rows,
        };

    } catch (error) {
        console.error("Job fetch error:", error);
        return { success: false, message: "Internal server error fetching jobs." };
    }
}