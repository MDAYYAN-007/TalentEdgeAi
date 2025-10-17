'use server';

import { query } from '@/actions/db';

export async function submitApplication(applicationData) {
    try {
        const { 
            jobId, 
            applicantId, 
            applicationData: appData, 
            coverLetter, 
            resumeScore,
            aiFeedback // Add this parameter
        } = applicationData;

        // Check if already applied
        const checkSql = 'SELECT id FROM applications WHERE job_id = $1 AND applicant_id = $2';
        const checkResult = await query(checkSql, [jobId, applicantId]);

        if (checkResult.rows.length > 0) {
            return { success: false, message: 'You have already applied for this job' };
        }

        // Insert application with AI feedback
        const insertSql = `
            INSERT INTO applications 
            (job_id, applicant_id, application_data, cover_letter, resume_score, ai_feedback, ai_score_breakdown, ai_improvement_suggestions, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
            RETURNING id, applied_at
        `;

        const values = [
            jobId,
            applicantId,
            JSON.stringify(appData),
            coverLetter,
            resumeScore || 0,
            aiFeedback ? JSON.stringify({
                objectiveScore: aiFeedback.objectiveScore,
                subjectiveScore: aiFeedback.subjectiveScore,
                explanationList: aiFeedback.explanationList,
                message: aiFeedback.message
            }) : null,
            aiFeedback ? JSON.stringify({
                overallScore: aiFeedback.score,
                breakdown: {
                    objective: aiFeedback.objectiveScore,
                    subjective: aiFeedback.subjectiveScore
                }
            }) : null,
            aiFeedback ? JSON.stringify(aiFeedback.improvementList) : null
        ];

        const result = await query(insertSql, values);

        return {
            success: true,
            applicationId: result.rows[0].id,
            application: {
                id: result.rows[0].id,
                appliedAt: result.rows[0].applied_at,
                resumeScore: resumeScore || 0,
                status: 'pending',
                aiFeedback: aiFeedback ? {
                    objectiveScore: aiFeedback.objectiveScore,
                    subjectiveScore: aiFeedback.subjectiveScore,
                    explanationList: aiFeedback.explanationList,
                    improvementList: aiFeedback.improvementList
                } : null
            },
            message: 'Application submitted successfully'
        };

    } catch (error) {
        console.error('Submit application error:', error);
        return { success: false, message: 'Failed to submit application' };
    }
}