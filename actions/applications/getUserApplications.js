'use server';

import { query } from '@/actions/db';

export async function getUserApplications(userId) {
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
            WHERE a.applicant_id = $1
            ORDER BY a.applied_at DESC
        `;

        const result = await query(sql, [userId]);

        const applications = result.rows.map(row => ({
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
        }));

        return {
            success: true,
            applications
        };

    } catch (error) {
        console.error('Error fetching user applications:', error);
        return {
            success: false,
            applications: [],
            error: 'Failed to fetch applications'
        };
    }
}