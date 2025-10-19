// actions/interviews/updateInterviewStatus.js
'use server';

import { query } from '@/actions/db';

export async function updateInterviewStatus(authData, interviewId, newStatus, notes = '') {
    try {
        const { orgId, userId } = authData;

        if (!orgId) {
            return { success: false, message: "Missing organization ID. Authorization failed." };
        }

        // Verify interview belongs to organization
        const interviewCheckSql = `
            SELECT i.*, j.org_id 
            FROM interviews i
            INNER JOIN jobs j ON i.job_id = j.id
            WHERE i.id = $1 AND j.org_id = $2
        `;
        const interviewCheck = await query(interviewCheckSql, [interviewId, orgId]);

        if (interviewCheck.rows.length === 0) {
            return { success: false, message: 'Interview not found or access denied' };
        }

        const interview = interviewCheck.rows[0];

        // Update interview status
        const updateSql = `
            UPDATE interviews 
            SET status = $1, updated_at = NOW()
            WHERE id = $2
            RETURNING id
        `;

        await query(updateSql, [newStatus, interviewId]);

        return {
            success: true,
            message: `Interview status updated to ${newStatus}`
        };

    } catch (error) {
        console.error('Error updating interview status:', error);
        return { success: false, message: 'Failed to update interview status' };
    }
}