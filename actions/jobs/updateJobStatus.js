'use server';

import { query } from '@/actions/db';

export async function updateJobStatus(jobId, newStatus, authData) {
    try {
        const { userId, orgId, userRole } = authData;

        // Authorization check - Only authorized users can update job status
        if (!orgId || !userId) {
            return { success: false, message: "Unauthorized: User not authenticated." };
        }

        // First, check if user has permission to update this job
        const checkSql = `
            SELECT j.*, 
                   $1 = ANY(j.assigned_recruiters) as is_assigned_recruiter,
                   j.posted_by = $2 as is_owner
            FROM jobs j
            WHERE j.id = $3 AND j.org_id = $4
        `;

        const checkResult = await query(checkSql, [userId.toString(), userId, jobId, orgId]);

        if (checkResult.rows.length === 0) {
            return { success: false, message: "Job not found or unauthorized." };
        }

        const job = checkResult.rows[0];
        const canManage = job.is_owner || job.is_assigned_recruiter || userRole === 'OrgAdmin';

        if (!canManage) {
            return { success: false, message: "Unauthorized: You don't have permission to update this job." };
        }

        // Update job status
        const updateSql = `
            UPDATE jobs 
            SET status = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2 AND org_id = $3
            RETURNING id, title, status
        `;

        const updateResult = await query(updateSql, [newStatus, jobId, orgId]);

        if (updateResult.rows.length === 0) {
            return { success: false, message: "Failed to update job status." };
        }

        return {
            success: true,
            message: `Job status updated to ${newStatus} successfully.`,
            job: updateResult.rows[0]
        };

    } catch (error) {
        console.error("Job status update error:", error);
        return { success: false, message: error.message || "An unexpected error occurred while updating job status." };
    }
}