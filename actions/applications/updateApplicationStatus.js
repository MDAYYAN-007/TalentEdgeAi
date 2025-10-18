'use server';

import { query } from "@/actions/db";

export async function updateApplicationStatus(authData, applicationId, newStatus, notes = null) {
    try {
        const { orgId, userId } = authData;

        if (!orgId) {
            return { success: false, message: "Missing organization ID. Authorization failed." };
        }

        console.log(`Updating application ${applicationId} status to ${newStatus} by recruiter ${userId}`);

        // First verify the recruiter has access to this application
        const verifySql = `
            SELECT a.id 
            FROM applications a
            JOIN jobs j ON a.job_id = j.id
            WHERE a.id = $1 
            AND j.org_id = $2 
            AND $3 = ANY(j.assigned_recruiters)
        `;

        const verifyResult = await query(verifySql, [applicationId, orgId, userId]);

        if (verifyResult.rows.length === 0) {
            return { success: false, message: "Application not found or access denied" };
        }

        const currentStatusSql = 'SELECT status FROM applications WHERE id = $1';
        const currentStatusResult = await query(currentStatusSql, [applicationId]);

        if (currentStatusResult.rows.length === 0) {
            return { success: false, message: 'Application not found' };
        }

        const oldStatus = currentStatusResult.rows[0].status;

        // Update application status
        const updateSql = 'UPDATE applications SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2';
        await query(updateSql, [newStatus, applicationId]);

        // Log the status change
        const historySql = `
            INSERT INTO application_status_history 
            (application_id, old_status, new_status, performed_by, notes)
            VALUES ($1, $2, $3, $4, $5)
        `;

        const updateResult = await query(historySql, [
            applicationId,
            oldStatus,
            newStatus,
            authData.userId,
            notes
        ]);

        return {
            success: true,
            application: updateResult.rows[0],
            message: `Application status updated to ${newStatus}`
        };

    } catch (error) {
        console.error("Application status update error:", error);
        return { success: false, message: "Internal server error updating application status." };
    }
}