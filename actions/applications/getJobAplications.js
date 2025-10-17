'use server';

import { query } from '@/actions/db';

export async function getJobApplications(jobId) {
    try {
        const sql = `
            SELECT * FROM applications 
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