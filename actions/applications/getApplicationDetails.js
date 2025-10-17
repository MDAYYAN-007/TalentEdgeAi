'use server';

import { query } from '@/actions/db';

export async function getApplicationDetails(applicationId, userId) {
    try {
        const sql = `
            SELECT 
                a.id,
                a.job_id,
                a.application_data,
                a.cover_letter,
                a.resume_score,
                a.ai_feedback,
                a.ai_score_breakdown,
                a.ai_improvement_suggestions,
                a.status,
                a.applied_at,
                j.title as job_title,
                j.job_type,
                j.work_mode,
                j.location,
                j.experience_level,
                o.company_name,
                o.industry
            FROM applications a
            JOIN jobs j ON a.job_id = j.id
            JOIN organizations o ON j.org_id = o.id
            WHERE a.id = $1 AND a.applicant_id = $2
        `;

        const result = await query(sql, [applicationId, userId]);

        if (result.rows.length === 0) {
            return {
                success: false,
                error: 'Application not found'
            };
        }

        const row = result.rows[0];

        const application = {
            id: row.id,
            jobId: row.job_id,
            jobTitle: row.job_title,
            companyName: row.company_name,
            industry: row.industry,
            location: row.location,
            jobType: row.job_type,
            experienceLevel: row.experience_level,
            workMode: row.work_mode,
            applicationData: row.application_data,
            coverLetter: row.cover_letter,
            resumeScore: row.resume_score,
            aiFeedback: row.ai_feedback,
            aiScoreBreakdown: row.ai_score_breakdown,
            aiImprovementSuggestions: row.ai_improvement_suggestions,
            status: row.status,
            appliedAt: row.applied_at
        };

        return {
            success: true,
            application
        };

    } catch (error) {
        console.error('Error fetching application details:', error);
        return {
            success: false,
            error: 'Failed to fetch application details'
        };
    }
}