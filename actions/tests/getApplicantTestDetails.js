'use server';

import { query } from '@/actions/db';

export async function getApplicantTestDetails(testAssignmentId, userId) {
    try {
        // Verify the test assignment belongs to the applicant and get test details
        const sql = `
            SELECT 
                ta.*,
                t.title,
                t.description,
                t.duration_minutes,
                t.total_marks,
                t.passing_percentage,
                t.instructions,
                t.created_at as test_created_at,
                j.title as job_title,
                o.company_name,
                CONCAT(u.first_name, ' ', u.last_name) as assigned_by_name,
                u.email as assigned_by_email,
                a.applicant_id,
                a.status as application_status
            FROM test_assignments ta
            JOIN tests t ON ta.test_id = t.id
            JOIN applications a ON ta.application_id = a.id
            JOIN jobs j ON a.job_id = j.id
            JOIN organizations o ON j.org_id = o.id
            JOIN users u ON ta.assigned_by = u.id
            WHERE ta.id = $1 AND a.applicant_id = $2
        `;

        const result = await query(sql, [testAssignmentId, userId]);

        if (result.rows.length === 0) {
            return {
                success: false,
                message: 'Test assignment not found or access denied'
            };
        }

        const testAssignment = result.rows[0];

        // Check if test is currently available
        const now = new Date();
        const startTime = new Date(testAssignment.test_start_date);
        const endTime = new Date(testAssignment.test_end_date);

        let availability = 'available';
        if (now < startTime) {
            availability = 'not_started';
        } else if (now > endTime) {
            availability = 'expired';
        } else if (testAssignment.status !== 'assigned' || testAssignment.status === 'in_progress') {
            availability = 'completed';
        }

        return {
            success: true,
            testAssignment: {
                ...testAssignment,
                availability,
                time_until_start: startTime - now,
                time_until_end: endTime - now
            }
        };
    } catch (error) {
        console.error('Error fetching applicant test details:', error);
        return {
            success: false,
            message: 'Failed to fetch test details'
        };
    }
}