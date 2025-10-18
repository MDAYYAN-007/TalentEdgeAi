'use server';

import { query } from '@/actions/db';

export async function getRecruiters(orgId, currentUserId, currentUserRole) {
    try {
        if (!orgId) {
            return { success: false, message: "Organization ID is required." };
        }

        const sql = `
            SELECT id, first_name, last_name, email, role
            FROM users 
            WHERE org_id = $1 AND role IN ('HR', 'SeniorHR', 'OrgAdmin')
            ORDER BY 
                CASE 
                    WHEN role = 'OrgAdmin' THEN 1
                    WHEN role = 'SeniorHR' THEN 2
                    WHEN role = 'HR' THEN 3
                    ELSE 4
                END,
                first_name
        `;

        const result = await query(sql, [orgId]);

        const recruiters = result.rows.map(user => ({
            id: user.id,
            name: `${user.first_name} ${user.last_name}`,
            email: user.email,
            role: user.role
        }));

        // Determine default selected recruiters based on current user role
        let defaultSelectedRecruiters = [];
        let lockedRecruiters = [];

        if (currentUserRole === 'OrgAdmin') {
            // OrgAdmin: select themselves
            defaultSelectedRecruiters = [currentUserId.toString()];
            lockedRecruiters = [currentUserId.toString()];
        } else if (currentUserRole === 'SeniorHR') {
            // SeniorHR: select themselves + OrgAdmin
            const orgAdmin = recruiters.find(rec => rec.role === 'OrgAdmin');
            defaultSelectedRecruiters = [
                currentUserId.toString(),
                ...(orgAdmin ? [orgAdmin.id.toString()] : [])
            ];
            lockedRecruiters = [
                currentUserId.toString(),
                ...(orgAdmin ? [orgAdmin.id.toString()] : [])
            ];
        }

        return {
            success: true,
            recruiters,
            defaultSelectedRecruiters,
            lockedRecruiters
        };
    } catch (error) {
        console.error("Error fetching recruiters:", error);
        return { success: false, message: "Failed to fetch recruiters." };
    }
}