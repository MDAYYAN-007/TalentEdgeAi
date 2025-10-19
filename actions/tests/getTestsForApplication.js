'use server';

import { query } from '@/actions/db';

export async function getTestsForApplication(applicationId) {
    try {
        const sql = `
            SELECT 
                ta.*,
                t.title as test_title,
                t.description as test_description,
                t.duration_minutes,
                t.total_marks,
                t.passing_marks,
                t.instructions,
                t.is_active as test_active,
                CONCAT(u.first_name, ' ', u.last_name) as assigned_by_name,
                u.email as assigned_by_email
            FROM test_assignments ta
            LEFT JOIN tests t ON ta.test_id = t.id
            LEFT JOIN users u ON ta.assigned_by = u.id
            WHERE ta.application_id = $1
            ORDER BY ta.assigned_at DESC
        `;
        const result = await query(sql, [applicationId]);
        
        return {
            success: true,
            tests: result.rows
        };
    } catch (error) {
        console.error('Error fetching tests for application:', error);
        return {
            success: false,
            message: 'Failed to fetch test assignments',
            tests: []
        };
    }
}