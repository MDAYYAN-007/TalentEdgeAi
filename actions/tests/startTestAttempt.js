'use server';

import { query } from '@/actions/db';

export async function startTestAttempt(testAssignmentId, userId) {
    try {
        // First, check if there's already an attempt and update it
        const checkSql = `
            SELECT ta.id as attempt_id, ta.status
            FROM test_attempts ta
            JOIN test_assignments tass ON ta.application_id = tass.application_id AND ta.test_id = tass.test_id
            WHERE tass.id = $1 AND ta.applicant_id = $2
        `;

        const checkResult = await query(checkSql, [testAssignmentId, userId]);

        let attemptId;

        if (checkResult.rows.length > 0) {
            attemptId = checkResult.rows[0].attempt_id;
            const updateSql = `
                UPDATE test_attempts 
                SET status = 'in_progress', started_at = NOW(), updated_at = NOW()
                WHERE id = $1 AND status != 'submitted'
            `;
            await query(updateSql, [attemptId]);
        } else {
            // Create new attempt
            const insertSql = `
                INSERT INTO test_attempts (
                    test_id, application_id, applicant_id, status, started_at, created_at
                )
                SELECT 
                    tass.test_id, tass.application_id, $2, 'in_progress', NOW(), NOW()
                FROM test_assignments tass
                WHERE tass.id = $1
                RETURNING id
            `;
            const result = await query(insertSql, [testAssignmentId, userId]);
            attemptId = result.rows[0].id;
        }

        // UPDATE: Also update the test_assignments status to 'in_progress'
        const updateAssignmentSql = `
            UPDATE test_assignments 
            SET status = 'in_progress', updated_at = NOW()
            WHERE id = $1
        `;
        await query(updateAssignmentSql, [testAssignmentId]);

        return {
            success: true,
            attemptId: attemptId
        };
    } catch (error) {
        console.error('Error starting test attempt:', error);
        return {
            success: false,
            message: 'Failed to start test attempt'
        };
    }
}