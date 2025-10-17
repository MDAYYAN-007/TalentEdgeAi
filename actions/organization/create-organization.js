'use server';

import { query } from '@/actions/db';
import jwt from 'jsonwebtoken';

export async function createOrganization(organizationData) {
    try {
        const { companyName, createdById, adminEmail, industry, companySize, headquartersLocation } = organizationData;

        // 1. Basic validation
        if (!companyName || !createdById || !adminEmail) {
            return { success: false, message: "Required organization details or creator ID are missing." };
        }

        // 2. Transaction Start (Ensures both org creation and user update succeed or fail together)
        await query('BEGIN');

        // 3. Check if the user already belongs to an organization (prevent multiple org creation)
        const checkOrgRes = await query("SELECT company_name FROM organizations WHERE created_by_user_id=$1", [createdById]);
        if (checkOrgRes.rows.length > 0) {
            await query('ROLLBACK');
            return {
                success: false,
                message: `User already administers organization: ${checkOrgRes.rows[0].company_name}`
            };
        }

        // 4. Create the new Organization (The creator becomes the initial Org Admin)
        const orgInsertSql = `
            INSERT INTO organizations (
                company_name, created_by_user_id, admin_email, industry, company_size, headquarters_location, hr_count
            ) VALUES ($1, $2, $3, $4, $5, $6, 0) RETURNING id;
        `;
        const orgValues = [
            companyName,
            createdById,
            adminEmail,
            industry || null,
            companySize || null,
            headquartersLocation || null,
        ];
        const orgRes = await query(orgInsertSql, orgValues);
        const orgId = orgRes.rows[0].id;

        // 5. Upgrade User Role: Change user's role to 'OrgAdmin'
        const userUpdateSql = `
            UPDATE users SET role = $1, org_id = $2 WHERE id = $3 RETURNING *;
        `;
        const userRes = await query(userUpdateSql, ['OrgAdmin', orgId, createdById]);
        const updatedUser = userRes.rows[0];

        // 6. Commit Transaction
        await query('COMMIT');

        // 7. Generate new JWT token with the updated role and orgId
        const fullName = `${updatedUser.first_name || ""} ${updatedUser.last_name || ""}`.trim();

        const newToken = jwt.sign(
            {
                id: createdById,
                email: adminEmail,
                role: 'OrgAdmin', // New highest role
                name: fullName,
                orgName: companyName,
                orgId: orgId, // Organization ID
                isProfileComplete: updatedUser.isprofilecomplete || false,
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRY || "7d" }
        );

        return {
            success: true,
            message: "Organization created and user role updated to OrgAdmin.",
            organizationId: orgId,
            token: newToken
        };

    } catch (error) {
        await query('ROLLBACK'); // Rollback on any failure
        console.error("Organization creation error:", error);

        // Check for specific Postgres unique violation error
        if (error.code === '23505') {
            return {
                success: false,
                message: "This user is already the administrator of another organization."
            };
        }

        return {
            success: false,
            message: "An unexpected error occurred during organization setup."
        };
    }
}