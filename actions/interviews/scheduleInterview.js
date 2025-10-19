// actions/interviews/scheduleInterview.js
'use server';

import { query } from '@/actions/db';

export async function scheduleInterview(authData, interviewData) {
    try {
        const { orgId, userId } = authData;
        const {
            applicationId,
            scheduledAt,
            durationMinutes,
            interviewType,
            meetingPlatform,
            meetingLink,
            meetingLocation,
            interviewers,
            notes
        } = interviewData;

        if (!orgId) {
            return { success: false, message: "Missing organization ID. Authorization failed." };
        }

        // Verify application belongs to organization
        const applicationCheckSql = `
            SELECT a.id, a.applicant_id, a.status as current_status, a.job_id,
                   j.title as job_title, u.first_name, u.last_name, u.email
            FROM applications a
            INNER JOIN jobs j ON a.job_id = j.id
            INNER JOIN users u ON a.applicant_id = u.id
            WHERE a.id = $1 AND j.org_id = $2
        `;
        const applicationCheck = await query(applicationCheckSql, [applicationId, orgId]);

        if (applicationCheck.rows.length === 0) {
            return { success: false, message: 'Application not found or access denied' };
        }

        const application = applicationCheck.rows[0];

        // Verify interviewers belong to organization
        const interviewersCheckSql = `
            SELECT id FROM users 
            WHERE id = ANY($1) AND org_id = $2
        `;
        const interviewersCheck = await query(interviewersCheckSql, [interviewers, orgId]);

        if (interviewersCheck.rows.length !== interviewers.length) {
            const foundInterviewerIds = interviewersCheck.rows.map(row => row.id);
            const missingInterviewers = interviewers.filter(id => !foundInterviewerIds.includes(id));
            return {
                success: false,
                message: `Some interviewers not found or access denied. Missing interviewer IDs: ${missingInterviewers.join(', ')}`
            };
        }

        // Check for scheduling conflicts
        const conflictCheckSql = `
            SELECT id FROM interviews 
            WHERE application_id = $1 
            AND scheduled_at = $2 
            AND status != 'cancelled'
        `;
        const conflictCheck = await query(conflictCheckSql, [applicationId, scheduledAt]);

        if (conflictCheck.rows.length > 0) {
            return {
                success: false,
                message: 'An interview is already scheduled for this application at the selected time'
            };
        }

        // Insert interview
        const insertInterviewSql = `
            INSERT INTO interviews 
            (job_id, application_id, applicant_id, scheduled_by, scheduled_at, 
             duration_minutes, interview_type, meeting_platform, meeting_link, 
             meeting_location, interviewers, notes, status, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'scheduled', NOW(), NOW())
            RETURNING id
        `;

        const interviewResult = await query(insertInterviewSql, [
            application.job_id,
            applicationId,
            application.applicant_id,
            userId,
            scheduledAt,
            durationMinutes,
            interviewType,
            meetingPlatform,
            meetingLink,
            meetingLocation,
            interviewers,
            notes
        ]);

        const interviewId = interviewResult.rows[0].id;

        // Update application status to 'interview_scheduled' if not already
        if (application.current_status !== 'interview_scheduled') {
            const updateApplicationStatusSql = `
                UPDATE applications 
                SET status = 'interview_scheduled', 
                    updated_at = CURRENT_TIMESTAMP 
                WHERE id = $1
            `;
            await query(updateApplicationStatusSql, [applicationId]);

            // Log application status change
            const applicationHistorySql = `
                INSERT INTO application_status_history 
                (application_id, old_status, new_status, performed_by, notes, performed_at)
                VALUES ($1, $2, $3, $4, $5, NOW())
            `;
            await query(applicationHistorySql, [
                applicationId,
                application.current_status,
                'interview_scheduled',
                userId,
                `Interview scheduled by recruiter. Type: ${interviewType}, Date: ${new Date(scheduledAt).toLocaleDateString()}`
            ]);
        }

        // Get recruiter name for logging
        const recruiterSql = `
            SELECT first_name, last_name FROM users WHERE id = $1 AND org_id = $2
        `;
        const recruiterResult = await query(recruiterSql, [userId, orgId]);
        const recruiterName = recruiterResult.rows[0] ?
            `${recruiterResult.rows[0].first_name} ${recruiterResult.rows[0].last_name}` :
            'Unknown Recruiter';

        return {
            success: true,
            message: 'Interview scheduled successfully',
            interviewId: interviewId,
            interview: {
                id: interviewId,
                scheduledAt: scheduledAt,
                durationMinutes: durationMinutes,
                interviewType: interviewType,
                meetingPlatform: meetingPlatform,
                interviewers: interviewers
            }
        };

    } catch (error) {
        console.error('Error scheduling interview:', error);
        return { success: false, message: 'Failed to schedule interview' };
    }
}