// app/actions/applicants/getApplicantsForTestAssignment.js
'use server';

import { query } from '@/actions/db';

export async function getApplicantsForTestAssignment(orgId, currentTestId,userId) {
    try {
        const sql = `
            SELECT 
                a.id as application_id,
                a.job_id,
                a.applicant_id,
                a.status,
                a.applied_at,
                a.resume_score,
                j.title as job_title,
                j.department,
                j.experience_level,
                CONCAT(u.first_name, ' ', u.last_name) as applicant_name,
                u.email as applicant_email,
                p.phone as applicant_phone,
                p.resume_url,
                p.experiences,
                p.education,
                p.skills,
                p.projects,
                -- Check if already assigned to this specific test
                EXISTS(
                    SELECT 1 FROM test_assignments ta 
                    WHERE ta.application_id = a.id AND ta.test_id = $2
                ) as already_assigned_to_this_test,
                -- Get count of other test assignments
                (
                    SELECT COUNT(*) FROM test_assignments ta 
                    WHERE ta.application_id = a.id AND ta.test_id != $2
                ) as other_test_assignments_count
            FROM applications a
            INNER JOIN jobs j ON a.job_id = j.id
            INNER JOIN users u ON a.applicant_id = u.id
            LEFT JOIN profiles p ON u.id = p.user_id
            WHERE j.org_id = $1 
            AND a.status IN ('shortlisted', 'test_scheduled','interview_scheduled')
            AND j.status = 'Active'
            AND $3 = ANY(j.assigned_recruiters)
            ORDER BY a.resume_score DESC, a.applied_at DESC
        `;

        const result = await query(sql, [orgId, currentTestId,userId]);

        return {
            success: true,
            applicants: result.rows
        };
    } catch (error) {
        console.error('Error fetching applicants for test assignment:', error);
        return { success: false, message: 'Failed to fetch applicants' };
    }
}