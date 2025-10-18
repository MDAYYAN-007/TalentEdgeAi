// actions/tests/reactivateTest.js
'use server';

import { query } from '@/actions/db';

export async function reactivateTest(testId, authData) {
    try {
        // Verify the test belongs to the organization
        const verifySql = 'SELECT org_id FROM tests WHERE id = $1';
        const verifyResult = await query(verifySql, [testId]);

        if (verifyResult.rows.length === 0) {
            return { success: false, message: 'Test not found' };
        }

        if (verifyResult.rows[0].org_id !== authData.orgId) {
            return { success: false, message: 'Unauthorized to reactivate this test' };
        }

        // Reactivate the test
        const updateSql = 'UPDATE tests SET is_active = true WHERE id = $1';
        await query(updateSql, [testId]);

        return { success: true, message: 'Test reactivated successfully' };
    } catch (error) {
        console.error('Error reactivating test:', error);
        return { success: false, message: 'Failed to reactivate test: ' + error.message };
    }
}