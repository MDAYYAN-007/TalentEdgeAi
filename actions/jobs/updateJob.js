'use server';

import { query } from '@/actions/db';

export async function updateJob(jobData, authData) {
    try {
        const { userId, userRole, orgId } = authData;

        const {
            id, title, department, job_type, work_mode, location, min_salary, max_salary,
            currency, experience_level, required_skills, qualifications, responsibilities,
            job_description, status, assigned_recruiters = []
        } = jobData;

        if (!id || !title || !job_type || !experience_level) {
            return { success: false, message: "Missing required fields for update." };
        }

        // Authorization Check: Fetch ownership
        const currentJobRes = await query(`SELECT posted_by, org_id FROM jobs WHERE id = $1`, [id]);
        if (currentJobRes.rows.length === 0) {
            return { success: false, message: "Job not found." };
        }

        const currentJob = currentJobRes.rows[0];

        const isOwner = currentJob.posted_by === userId;
        const isAdmin = userRole === 'OrgAdmin';
        const isAuthorizedOrg = currentJob.org_id === orgId;

        // Only the owner or an OrgAdmin can edit, and job must belong to their org
        if (!isAuthorizedOrg || (!isOwner && !isAdmin)) {
            return { success: false, message: "Unauthorized to edit this job listing." };
        }

        const skillsArray = Array.isArray(required_skills) ? required_skills : [];
        const qualificationsArray = Array.isArray(qualifications) ? qualifications : [];
        const responsibilitiesArray = Array.isArray(responsibilities) ? responsibilities : [];
        const assignedRecruitersArray = Array.isArray(assigned_recruiters) ? assigned_recruiters.map(String) : [];

        const sql = `
            UPDATE jobs SET
                title = $1, department = $2, job_type = $3, work_mode = $4, location = $5,
                min_salary = $6, max_salary = $7, currency = $8, experience_level = $9,
                required_skills = $10, qualifications = $11, responsibilities = $12,
                job_description = $13, status = $14, assigned_recruiters = $15,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $16 AND org_id = $17
            RETURNING *;
        `;

        const values = [
            title, department || null, job_type, work_mode, location || null,
            min_salary || null, max_salary || null, currency, experience_level,
            skillsArray, qualificationsArray, responsibilitiesArray,
            job_description || null, status, assignedRecruitersArray,
            id, orgId
        ];

        const result = await query(sql, values);

        if (result.rows.length === 0) {
            return { success: false, message: "Update failed (DB constraint)." };
        }

        return { success: true, updatedJob: result.rows[0] };

    } catch (error) {
        console.error("Job update error:", error);
        return { success: false, message: "An unexpected error occurred during job update." };
    }
}