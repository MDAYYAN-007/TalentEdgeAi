'use server';

import { query } from '@/actions/db';

export async function getJobApplications(jobId) {
    try {
        const sql = `
            SELECT a.*,
            CONCAT(u.first_name, ' ', u.last_name) AS applicant_name,
            u.email AS applicant_email FROM users u
            JOIN applications a ON a.applicant_id = u.id
            WHERE job_id = $1 
            ORDER BY applied_at DESC
        `;

        const result = await query(sql, [jobId]);

        return { success: true, applications: result.rows };
    } catch (error) {
        console.error("Error fetching applications:", error);
        return { success: false, message: "Failed to fetch applications" };
    }
}