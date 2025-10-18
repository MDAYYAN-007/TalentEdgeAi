'use server';

import { query } from '@/actions/db';

export async function getApplicationStatusHistory(applicationId) {
    try {
        const sql = `
            SELECT 
                ash.*,
                CONCAT(u.first_name,u.last_name) as performer_name,
                u.email as performer_email
            FROM application_status_history ash
            LEFT JOIN users u ON ash.performed_by = u.id
            WHERE ash.application_id = $1
            ORDER BY ash.performed_at DESC
        `;

        const result = await query(sql, [applicationId]);

        return {
            success: true,
            history: result.rows.map(row => ({
                id: row.id,
                oldStatus: row.old_status,
                newStatus: row.new_status,
                performedBy: row.performed_by,
                performerName: row.performer_name,
                performerEmail: row.performer_email,
                performedAt: row.performed_at,
                notes: row.notes
            }))
        };
    } catch (error) {
        console.error('Error fetching application status history:', error);
        return { success: false, message: 'Failed to fetch status history' };
    }
}