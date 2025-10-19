'use server';

import { query } from '@/actions/db';

export async function getInterviewsForApplication(applicationId) {
    try {
        const sql = `
            SELECT 
                i.*,
                CONCAT(u1.first_name, ' ', u1.last_name) as scheduled_by_name,
                u1.email as scheduled_by_email,
                ARRAY(
                    SELECT CONCAT(u2.first_name, ' ', u2.last_name) 
                    FROM users u2 
                    WHERE u2.id = ANY(i.interviewers)
                ) as interviewer_names,
                j.title as job_title,
                CONCAT(u3.first_name, ' ', u3.last_name) as applicant_name
            FROM interviews i
            LEFT JOIN users u1 ON i.scheduled_by = u1.id
            LEFT JOIN jobs j ON i.job_id = j.id
            LEFT JOIN users u3 ON i.applicant_id = u3.id
            WHERE i.application_id = $1
            ORDER BY i.scheduled_at DESC
        `;

        const result = await query(sql, [applicationId]);

        return {
            success: true,
            interviews: result.rows
        };
    } catch (error) {
        console.error('Error fetching interviews for application:', error);
        return {
            success: false,
            message: 'Failed to fetch interviews',
            interviews: []
        };
    }
}