'use server';

import { query } from '@/actions/db';

export async function startTestAttempt(testAssignmentId, userId) {
    try {
        const sql = `
            INSERT INTO test_attempts (
                test_id,
                application_id,
                applicant_id,
                started_at,
                status
            )
            SELECT 
                ta.test_id,
                ta.application_id,
                $2,
                NOW(),
                'in_progress'
            FROM test_assignments ta
            WHERE ta.id = $1
            RETURNING id
        `;

        const result = await query(sql, [testAssignmentId, userId]);

        return {
            success: true,
            attemptId: result.rows[0].id
        };
    } catch (error) {
        console.error('Error starting test attempt:', error);
        return {
            success: false,
            message: 'Failed to start test attempt'
        };
    }
}