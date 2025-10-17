'use server';

import { query } from '@/actions/db';

export async function getOrganizationData(orgId, authData) {
    try {
        if (!orgId) {
            return {
                success: false,
                message: "Organization ID is required."
            };
        }

        // Optional: Add authorization check if needed
        if (authData) {
            const { userId, userRole, orgId: userOrgId } = authData;

            // Check if user has access to this organization
            if (userOrgId && parseInt(userOrgId) !== parseInt(orgId)) {
                return {
                    success: false,
                    message: "Access denied: You are not authorized to view this organization's data."
                };
            }
        }

        // 1. Fetch Organization data and its metric counts
        const orgSql = `
            SELECT 
                company_name, industry, company_size, headquarters_location, 
                employee_count, hr_count, senior_hr_count, created_by_user_id
            FROM organizations 
            WHERE id = $1;
        `;
        const orgRes = await query(orgSql, [orgId]);

        if (!orgRes.rows.length) {
            return {
                success: false,
                message: "Organization not found."
            };
        }

        const orgData = orgRes.rows[0];

        // 2. Mock/Placeholder Analytics (In a real app, these would be separate complex queries)
        const mockAnalytics = {
            openRoles: 45,
            avgTimeToHire: 28,
            aiMatchSuccessRate: 89,
        };

        return {
            success: true,
            organization: {
                // Map database columns to camelCase for front-end
                companyName: orgData.company_name,
                industry: orgData.industry,
                companySize: orgData.company_size,
                location: orgData.headquarters_location,
                employeesTotal: parseInt(orgData.employee_count, 10),
                hrCount: parseInt(orgData.hr_count, 10),
                seniorHrCount: parseInt(orgData.senior_hr_count, 10),
                ...mockAnalytics,
            }
        };

    } catch (error) {
        console.error("Organization Data Error:", error);
        return {
            success: false,
            message: "Server error fetching organization data."
        };
    }
}