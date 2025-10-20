'use server';

import { query } from '@/actions/db';

export async function checkApplication(jobId, applicantId) {
    try {
        const result = await query(
            'SELECT * FROM applications WHERE job_id = $1 AND applicant_id = $2',
            [jobId, applicantId]
        );

        if (result.rowCount > 0) {
            return {
                success: true,
                hasApplied: true,
                application: result.rows[0]
            };
        }

        return {
            success: true,
            hasApplied: false,
            application: null
        };
    } catch (error) {
        console.error('Error checking application:', error);
        return {
            success: false,
            hasApplied: false,
            application: null,
            error: error.message
        };
    }
}