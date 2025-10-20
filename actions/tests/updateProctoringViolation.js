'use server';

import { query } from '@/actions/db';

export async function updateProctoringViolation(attemptId, violationData) {
    try {
        // First get existing proctoring data
        const getSql = `SELECT proctoring_data FROM test_attempts WHERE id = $1`;
        const getResult = await query(getSql, [attemptId]);

        const existingData = getResult.rows[0]?.proctoring_data || {};

        // Merge with new violation data
        const updatedData = {
            ...existingData,
            ...violationData,
            last_updated: new Date().toISOString()
        };

        const sql = `
            UPDATE test_attempts 
            SET 
                proctoring_data = $2,
                updated_at = NOW()
            WHERE id = $1
        `;

        await query(sql, [attemptId, JSON.stringify(updatedData)]);

        return { success: true };
    } catch (error) {
        console.error('Error updating proctoring violation:', error);
        return { success: false, message: 'Failed to update violation' };
    }
}