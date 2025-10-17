'use server';

import { query } from '@/actions/db';

export async function getJobDetails(jobId) {
    try {
        const sql = `
            SELECT j.*, 
                   u.first_name || ' ' || u.last_name as posted_by_name,
                   o.company_name
            FROM jobs j
            LEFT JOIN users u ON j.posted_by = u.id
            LEFT JOIN organizations o ON j.org_id = o.id
            WHERE j.id = $1
        `;

        const result = await query(sql, [jobId]);

        if (result.rows.length === 0) {
            return { success: false, message: "Job not found" };
        }

        return { success: true, job: result.rows[0] };
    } catch (error) {
        console.error("Error fetching job details:", error);
        return { success: false, message: "Failed to fetch job details" };
    }
}