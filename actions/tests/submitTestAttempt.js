'use server';

import { query } from '@/actions/db';

export async function submitTestAttempt(attemptId, finalScore = null, isPassed = null) {
    try {
        const sql = `
            UPDATE test_attempts 
            SET 
                submitted_at = NOW(),
                status = 'submitted',
                total_score = $2,
                percentage = $3,
                is_passed = $4,
                updated_at = NOW()
            WHERE id = $1
            RETURNING test_id, application_id
        `;

        const result = await query(sql, [attemptId, finalScore, finalScore, isPassed]);

        if (result.rows.length > 0) {
            const { test_id, application_id } = result.rows[0];

            // Update test_assignments status to 'attempted'
            const updateAssignmentSql = `
                UPDATE test_assignments 
                SET status = 'attempted', updated_at = NOW()
                WHERE test_id = $1 AND application_id = $2
            `;

            await query(updateAssignmentSql, [test_id, application_id]);
        }

        return { success: true };
    } catch (error) {
        console.error('Error submitting test attempt:', error);
        return { success: false, message: 'Failed to submit test attempt' };
    }
}