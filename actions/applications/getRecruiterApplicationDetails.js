'use server';

import { query } from "@/actions/db";

export async function getRecruiterApplicationDetails(authData, applicationId) {
    try {
        const { orgId, userId } = authData;

        if (!orgId) {
            return { success: false, message: "Missing organization ID. Authorization failed." };
        }

        console.log(`Fetching application details for ID: ${applicationId}, recruiter: ${userId}, org: ${orgId}`);

        const sql = `
            SELECT 
                a.*,
                j.id as job_id, j.title as job_title, j.department, j.location, 
                j.experience_level, j.assigned_recruiters,
                u.id as applicant_id, u.first_name, u.last_name, u.email as applicant_email,
                CONCAT(u.first_name, ' ', u.last_name) as applicant_name
            FROM applications a
            JOIN jobs j ON a.job_id = j.id
            JOIN users u ON a.applicant_id = u.id
            WHERE a.id = $1 
            AND j.org_id = $2 
        `;

        const result = await query(sql, [applicationId, orgId]);

        if (result.rows.length === 0) {
            return { success: false, message: "Application not found or access denied" };
        }

        return {
            success: true,
            application: result.rows[0]
        };

    } catch (error) {
        console.error("Application details fetch error:", error);
        return { success: false, message: "Internal server error fetching application details." };
    }
}