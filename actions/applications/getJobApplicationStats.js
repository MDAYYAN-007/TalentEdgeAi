'use server';

import { query } from '@/actions/db';

export async function getJobApplicationStats(jobId) {
    try {
        const sql = `
            SELECT
                COUNT(*) AS total,
                SUM(CASE WHEN status = 'shortlisted' THEN 1 ELSE 0 END) AS shortlisted,
                SUM(CASE WHEN status = 'test_scheduled' THEN 1 ELSE 0 END) AS test_assigned,
                SUM(CASE WHEN status = 'interview_scheduled' THEN 1 ELSE 0 END) AS interview_scheduled,
                SUM(CASE WHEN status = 'waiting_for_result' THEN 1 ELSE 0 END) AS waiting_for_result,
                SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) AS accepted,
                SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) AS rejected
            FROM applications
            WHERE job_id = $1
        `;
        const values = [jobId];
        const result = await query(sql, values);
        return result.rows[0];
    } catch (error) {
        console.error('Error fetching job application stats:', error);
        throw new Error('Failed to fetch job application stats');
    }
}
