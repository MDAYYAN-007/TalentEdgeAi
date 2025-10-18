// actions/applications/getRecruiterApplications.js
'use server';

import { query } from "@/actions/db";

export async function getRecruiterApplications(authData) {
    try {
        const { orgId, userId } = authData;

        if (!orgId) {
            return { success: false, message: "Missing organization ID. Authorization failed." };
        }

        console.log(`Fetching all applications for recruiter ID: ${userId}, organization ID: ${orgId}`);

        const sql = `
            SELECT 
                a.id, a.status, a.resume_score, a.applied_at, a.updated_at,
                a.cover_letter, a.ai_feedback, a.ai_score_breakdown, 
                a.ai_improvement_suggestions, a.application_data,
                j.id as job_id, j.title as job_title, j.department, 
                j.location, j.experience_level,
                u.id as applicant_id, u.first_name, u.last_name, u.email as applicant_email,
                CONCAT(u.first_name, ' ', u.last_name) as applicant_name
            FROM applications a
            JOIN jobs j ON a.job_id = j.id
            JOIN users u ON a.applicant_id = u.id
            WHERE j.org_id = $1 
            AND $2 = ANY(j.assigned_recruiters)
            ORDER BY a.applied_at DESC;
        `;

        const params = [orgId, userId];

        console.log('Fetching all applications for recruiter...');
        const result = await query(sql, params);

        return {
            success: true,
            applications: result.rows,
        };

    } catch (error) {
        console.error("Applications fetch error:", error);
        return { success: false, message: "Internal server error fetching applications." };
    }
}