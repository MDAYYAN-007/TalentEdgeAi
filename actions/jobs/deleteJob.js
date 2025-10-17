'use server';

import { query } from '@/actions/db';

export async function deleteJob(jobId, authData) {
    try {
        const { userId, userRole, orgId } = authData;

        if (!jobId) {
            return { success: false, message: "jobId is required for deletion." };
        }

        // Authorization Check: Fetch ownership
        const currentJobRes = await query(`SELECT posted_by, org_id FROM jobs WHERE id = $1`, [jobId]);
        if (currentJobRes.rows.length === 0) {
            return { success: false, message: "Job not found." };
        }

        const currentJob = currentJobRes.rows[0];

        const isOwner = currentJob.posted_by === userId;
        const isAdmin = userRole === 'OrgAdmin';
        const isAuthorizedOrg = currentJob.org_id === orgId;

        // Only the owner or an OrgAdmin can delete, and job must belong to their org
        if (!isAuthorizedOrg || (!isOwner && !isAdmin)) {
            return { success: false, message: "Unauthorized to delete this job listing." };
        }

        // Perform Deletion
        const sql = `DELETE FROM jobs WHERE id = $1 AND org_id = $2 RETURNING id`;
        const result = await query(sql, [jobId, orgId]);

        if (result.rows.length === 0) {
            return { success: false, message: "Deletion failed (job not found or unauthorized)." };
        }

        return { success: true, message: "Job deleted successfully." };

    } catch (error) {
        console.error("Job deletion error:", error);
        return { success: false, message: error.message || "An unexpected error occurred during job deletion." };
    }
}