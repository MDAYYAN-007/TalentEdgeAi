'use server';

import { query } from '@/actions/db';

export async function updateJobRecruiters(jobId, assignedRecruiters, authData) {
    try {
        const { userId, orgId, userRole } = authData;

        // Authorization check - Only authorized users can update recruiters
        if (!orgId || !userId) {
            return { success: false, message: "Unauthorized." };
        }

        // Verify user has permission to update this job
        const verifySql = `
            SELECT posted_by, org_id, assigned_recruiters 
            FROM jobs 
            WHERE id = $1 AND org_id = $2
        `;
        const verifyResult = await query(verifySql, [jobId, orgId]);

        if (verifyResult.rows.length === 0) {
            return { success: false, message: "Job not found or access denied." };
        }

        const job = verifyResult.rows[0];

        // Check if user is authorized to update recruiters
        const isAuthorized =
            job.posted_by === userId ||
            userRole === 'OrgAdmin' ||
            job.assigned_recruiters?.includes(parseInt(userId));

        if (!isAuthorized) {
            return { success: false, message: "You are not authorized to update recruiters for this job." };
        }

        // Update the job with new recruiters
        const updateSql = `
            UPDATE jobs 
            SET assigned_recruiters = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
            RETURNING id, assigned_recruiters
        `;

        const updateResult = await query(updateSql, [assignedRecruiters, jobId]);

        return {
            success: true,
            message: "Recruiters updated successfully.",
            job: updateResult.rows[0]
        };
    } catch (error) {
        console.error("Update recruiters error:", error);
        return { success: false, message: error.message || "An unexpected error occurred." };
    }
}