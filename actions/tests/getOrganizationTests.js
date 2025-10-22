'use server';

import { query } from '@/actions/db';

export async function getOrganizationTests(orgId) {
    try {
        const sql = `
            SELECT 
                t.*,
                COUNT(tq.id) as question_count,
                CONCAT(u.first_name, ' ', u.last_name) as created_by_name,
                COUNT(DISTINCT ta.id) as assignment_count
            FROM tests t
            LEFT JOIN test_questions tq ON t.id = tq.test_id
            LEFT JOIN users u ON t.created_by = u.id
            LEFT JOIN test_assignments ta ON t.id = ta.test_id
            WHERE t.org_id = $1
            GROUP BY t.id, u.first_name, u.last_name
            ORDER BY t.created_at DESC
        `;

        const result = await query(sql, [orgId]);

        return {
            success: true,
            tests: result.rows
        };
    } catch (error) {
        console.error('Error fetching tests:', error);
        return { success: false, message: 'Failed to fetch tests' };
    }
}