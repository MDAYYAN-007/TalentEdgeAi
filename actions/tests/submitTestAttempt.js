'use server';

import { query } from '@/actions/db';

export async function submitTestAttempt(attemptId) {
    try {
        const sql = `
            UPDATE test_attempts 
            SET 
                submitted_at = NOW(),
                status = 'submitted'
            WHERE id = $1
            RETURNING id
        `;

        await query(sql, [attemptId]);

        return { success: true };
    } catch (error) {
        console.error('Error submitting test attempt:', error);
        return { success: false, message: 'Failed to submit test attempt' };
    }
}