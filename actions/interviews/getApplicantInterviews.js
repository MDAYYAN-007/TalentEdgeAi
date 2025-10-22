'use server'

import { query } from '@/actions/db';

export async function getApplicantInterviews(userId) {
    try {
        const sql = `
            SELECT 
                i.*,
                j.title as job_title,
                j.location as job_location,
                CONCAT(u.first_name, ' ', u.last_name) as scheduled_by_name,
                ARRAY(
                    SELECT CONCAT(u.first_name, ' ', u.last_name) 
                    FROM users 
                    WHERE id = ANY(i.interviewers)
                ) as interviewer_names,
                a.status as application_status,
                j.id as job_id,
                a.id as application_id
            FROM interviews i
            LEFT JOIN jobs j ON i.job_id = j.id
            LEFT JOIN users u ON i.scheduled_by = u.id
            LEFT JOIN applications a ON i.application_id = a.id
            WHERE i.applicant_id = $1
            ORDER BY i.scheduled_at DESC
        `;

        const result = await query(sql, [userId]);

        const interviews = result.rows.map(interview => ({
            id: interview.id,
            job_id: interview.job_id,
            application_id: interview.application_id,
            applicant_id: interview.applicant_id,
            scheduled_by: interview.scheduled_by,
            scheduled_by_name: interview.scheduled_by_name,
            scheduled_at: interview.scheduled_at,
            interviewers: interview.interviewers,
            interviewer_names: interview.interviewer_names,
            interview_type: interview.interview_type,
            meeting_platform: interview.meeting_platform,
            meeting_link: interview.meeting_link,
            meeting_location: interview.meeting_location,
            duration_minutes: interview.duration_minutes,
            status: interview.status,
            notes: interview.notes,
            created_at: interview.created_at,
            updated_at: interview.updated_at,
            job_title: interview.job_title,
            job_location: interview.job_location,
            application_status: interview.application_status
        }));

        return {
            success: true,
            interviews: interviews
        };

    } catch (error) {
        console.error('Error fetching applicant interviews:', error);
        return {
            success: false,
            message: error.message || 'Failed to fetch interviews',
            interviews: []
        };
    }
}