'use server';

import { query } from '@/actions/db';

export async function rescheduleInterview(authData, interviewId, newScheduledAt, durationMinutes, notes = '') {
    try {
        const { orgId, userId } = authData;

        if (!orgId) {
            return { success: false, message: "Missing organization ID. Authorization failed." };
        }

        // Verify interview belongs to organization
        const interviewCheckSql = `
            SELECT i.*, j.org_id, j.title as job_title,
                   CONCAT(u.first_name, ' ', u.last_name) as applicant_name
            FROM interviews i
            INNER JOIN jobs j ON i.job_id = j.id
            INNER JOIN users u ON i.applicant_id = u.id
            WHERE i.id = $1 AND j.org_id = $2
        `;
        const interviewCheck = await query(interviewCheckSql, [interviewId, orgId]);

        if (interviewCheck.rows.length === 0) {
            return { success: false, message: 'Interview not found or access denied' };
        }

        const interview = interviewCheck.rows[0];
        const applicantName = interview.applicant_name;
        const jobTitle = interview.job_title;

        // Update interview
        const updateSql = `
            UPDATE interviews 
            SET scheduled_at = $1,
                duration_minutes = $2,
                status = 'scheduled',
                updated_at = NOW(),
                notes = CASE 
                    WHEN $3 != '' THEN COALESCE(notes || '\n\n', '') || 'Rescheduled: ' || $3
                    ELSE notes
                END
            WHERE id = $4
            RETURNING id
        `;

        await query(updateSql, [
            newScheduledAt,
            durationMinutes,
            notes,
            interviewId
        ]);

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
            interview.application_id,
            'interview_scheduled',
            'interview_scheduled',
            userId,
            `Interview rescheduled by ${recruiterName}. New time: ${new Date(newScheduledAt).toLocaleString()}. ${notes}`
        ]);

        return {
            success: true,
            message: `Interview has been rescheduled successfully for ${applicantName}`
        };

    } catch (error) {
        console.error('Error rescheduling interview:', error);
        return { success: false, message: 'Failed to reschedule interview' };
    }
}