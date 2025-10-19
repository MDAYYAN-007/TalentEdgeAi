'use server';

import { query } from '@/actions/db';

export async function rescheduleTest(authData, testAssignmentId, newStartDate, newEndDate, proctoringSettings) {
    try {
        const { orgId, userId } = authData;

        if (!orgId) {
            return { success: false, message: "Missing organization ID. Authorization failed." };
        }

        // Verify test assignment belongs to organization
        const assignmentCheckSql = `
            SELECT ta.*, j.org_id, t.title as test_title,
                   CONCAT(u.first_name, ' ', u.last_name) as applicant_name
            FROM test_assignments ta
            INNER JOIN applications a ON ta.application_id = a.id
            INNER JOIN jobs j ON a.job_id = j.id
            INNER JOIN tests t ON ta.test_id = t.id
            INNER JOIN users u ON a.applicant_id = u.id
            WHERE ta.id = $1 AND j.org_id = $2
        `;
        const assignmentCheck = await query(assignmentCheckSql, [testAssignmentId, orgId]);

        if (assignmentCheck.rows.length === 0) {
            return { success: false, message: 'Test assignment not found or access denied' };
        }

        const assignment = assignmentCheck.rows[0];
        const testTitle = assignment.test_title;
        const applicantName = assignment.applicant_name;

        // Calculate minimum required time difference
        const testDuration = assignment.duration_minutes || 60;
        const minTimeDifference = (testDuration + 5) * 60 * 1000;
        const startDate = new Date(newStartDate);
        const endDate = new Date(newEndDate);
        const actualTimeDifference = endDate - startDate;

        if (actualTimeDifference < minTimeDifference) {
            const requiredMinutes = Math.ceil(minTimeDifference / (60 * 1000));
            return {
                success: false,
                message: `Test window too short for "${testTitle}". For a ${testDuration}-minute test, you need at least ${requiredMinutes} minutes between start and end time.`
            };
        }

        // Update test assignment
        const updateSql = `
            UPDATE test_assignments 
            SET test_start_date = $1,
                test_end_date = $2,
                is_proctored = $3,
                proctoring_settings = $4,
                updated_at = NOW(),
                assigned_by = $5,
                status = 'assigned'
            WHERE id = $6
            RETURNING id
        `;

        await query(updateSql, [
            newStartDate,
            newEndDate,
            proctoringSettings.isProctored,
            JSON.stringify(proctoringSettings.proctoringSettings),
            userId,
            testAssignmentId
        ]);

        // Update test attempt status if exists
        const updateAttemptSql = `
            UPDATE test_attempts 
            SET status = 'not_started',
                updated_at = NOW()
            WHERE test_id = $1 AND application_id = $2
        `;
        await query(updateAttemptSql, [assignment.test_id, assignment.application_id]);

        // Get recruiter name for logging
        const recruiterSql = `
            SELECT first_name, last_name FROM users WHERE id = $1 AND org_id = $2
        `;
        const recruiterResult = await query(recruiterSql, [userId, orgId]);
        const recruiterName = recruiterResult.rows[0] ?
            `${recruiterResult.rows[0].first_name} ${recruiterResult.rows[0].last_name}` :
            'Unknown Recruiter';

        // Log the rescheduling
        const applicationHistorySql = `
            INSERT INTO application_status_history 
            (application_id, old_status, new_status, performed_by, notes, performed_at)
            VALUES ($1, $2, $3, $4, $5, NOW())
        `;
        await query(applicationHistorySql, [
            assignment.application_id,
            'test_scheduled',
            'test_scheduled',
            userId,
            `Test "${testTitle}" rescheduled by ${recruiterName}. New window: ${new Date(newStartDate).toLocaleDateString()} to ${new Date(newEndDate).toLocaleDateString()}`
        ]);

        return {
            success: true,
            message: `Test "${testTitle}" has been rescheduled successfully for ${applicantName}`
        };

    } catch (error) {
        console.error('Error rescheduling test:', error);
        return { success: false, message: 'Failed to reschedule test' };
    }
}