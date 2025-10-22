'use server';

import { query } from '@/actions/db';

export async function updateProctoringViolation(attemptId, proctoringData) {
    try {
        const sql = `
            UPDATE test_attempts 
            SET 
                proctoring_data = $2,
                violation_score = $3,
                updated_at = NOW()
            WHERE id = $1
        `;

        await query(sql, [
            attemptId, 
            JSON.stringify(proctoringData),
            proctoringData.violationScore || 0
        ]);

        console.log('Proctoring data stored for attempt:', attemptId, 'with score:', proctoringData.violationScore);
        return { success: true };
    } catch (error) {
        console.error('Error updating proctoring violation:', error);
        return { success: false, message: 'Failed to update proctoring data' };
    }
}