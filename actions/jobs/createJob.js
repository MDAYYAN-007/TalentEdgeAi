'use server';

import { query } from '@/actions/db';

export async function createJob(jobData, authData) {
    try {
        const { userId, orgId, userRole } = authData;

        // Authorization check - Only OrgAdmin and SeniorHR can create jobs
        if (!orgId || !userId || !userRole || userRole === 'user' || userRole === 'HR') {
            return { success: false, message: "Unauthorized: Only OrgAdmin and SeniorHR can create jobs." };
        }

        const {
            title, department, job_type, work_mode, location, min_salary, max_salary, 
            currency, experience_level, required_skills, qualifications, responsibilities, 
            job_description, status, assigned_recruiters = []
        } = jobData;

        if (!title || !job_type || !experience_level) {
            return { success: false, message: "Missing required fields (title, job_type, experience_level)." };
        }

        // Prepare array fields for PostgreSQL
        const skillsArray = Array.isArray(required_skills) ? required_skills : [];
        const qualificationsArray = Array.isArray(qualifications) ? qualifications : [];
        const responsibilitiesArray = Array.isArray(responsibilities) ? responsibilities : [];
        const assignedRecruitersArray = Array.isArray(assigned_recruiters) ? assigned_recruiters.map(String) : [];

        const sql = `
            INSERT INTO jobs (
                posted_by, org_id, title, department, job_type, work_mode, location, 
                min_salary, max_salary, currency, experience_level, 
                required_skills, qualifications, responsibilities, job_description, status, assigned_recruiters
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
            RETURNING id, title, department, job_type, work_mode, location, currency, status;
        `;

        const values = [
            userId, // $1
            orgId, // $2
            title, // $3
            department || null, // $4
            job_type, // $5
            work_mode, // $6
            location || null, // $7
            min_salary || null, // $8
            max_salary || null, // $9
            currency, // $10
            experience_level, // $11
            skillsArray, // $12
            qualificationsArray, // $13
            responsibilitiesArray, // $14
            job_description || null, // $15
            status, // $16
            assignedRecruitersArray, // $17
        ];

        const result = await query(sql, values);
        const newJob = result.rows[0];

        return { success: true, newJob };
    } catch (error) {
        console.error("Job creation error:", error);
        return { success: false, message: error.message || "An unexpected error occurred during job creation." };
    }
}