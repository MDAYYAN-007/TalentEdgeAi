'use server';

import { query } from '@/actions/db';

export async function getTestAttemptId(testId, applicationId) {
    try {
        const sql = `
            SELECT id, status, is_evaluated,total_score,percentage,is_passed
            FROM test_attempts 
            WHERE test_id = $1 AND application_id = $2
            ORDER BY created_at DESC
            LIMIT 1
        `;

        const result = await query(sql, [testId, applicationId]);

        if (result.rows.length === 0) {
            return {
                success: false,
                message: 'No test attempt found'
            };
        }

        return {
            success: true,
            attempt: result.rows[0]
        };
    } catch (error) {
        console.error('Error fetching test attempt:', error);
        return {
            success: false,
            message: 'Failed to fetch test attempt'
        };
    }
}