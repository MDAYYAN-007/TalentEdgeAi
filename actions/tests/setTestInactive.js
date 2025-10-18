// actions/tests/deleteTest.js
'use server';

import { query } from '@/actions/db';

export async function setTestInactive(testId, authData) {
    try {
        // First verify the test belongs to the organization
        const verifySql = 'SELECT org_id FROM tests WHERE id = $1';
        const verifyResult = await query(verifySql, [testId]);

        if (verifyResult.rows.length === 0) {
            return { success: false, message: 'Test not found' };
        }

        if (verifyResult.rows[0].org_id !== authData.orgId) {
            return { success: false, message: 'Unauthorized to delete this test' };
        }

        // Soft delete - set is_active to false
        const updateSql = 'UPDATE tests SET is_active = false WHERE id = $1';
        await query(updateSql, [testId]);

        return { success: true, message: 'Test deactivated successfully' };
    } catch (error) {
        console.error('Error deactivating test:', error);
        return { success: false, message: 'Failed to deactivate test: ' + error.message };
    }
}