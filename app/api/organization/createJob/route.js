import { NextResponse } from "next/server";
import { query } from "@/actions/db";

function getAuthHeaders(req) {
    const orgId = req.headers.get('X-Org-ID');
    const userId = req.headers.get('X-User-ID');
    const userRole = req.headers.get('X-User-Role');

    if (!orgId || !userId || !userRole || userRole === 'user') {
        throw new Error("Unauthorized: Organizational user headers are missing.");
    }
    
    return { 
        orgId: parseInt(orgId, 10), 
        userId: parseInt(userId, 10), 
        userRole 
    };
}

/**
 * POST: Create a new job listing.
 */
export async function POST(req) {
    let authData;
    try {
        // 1. Get Authentication Details from Headers
        authData = getAuthHeaders(req);
    } catch (e) {
        return NextResponse.json({ success: false, message: e.message }, { status: 401 });
    }
    
    const postedBy = authData.userId;
    const orgId = authData.orgId;

    try {
        const body = await req.json();
        const {
            title, department, job_type, work_mode, location, min_salary, max_salary, 
            currency, experience_level, required_skills, qualifications, responsibilities, 
            job_description, status, assigned_recruiters = [] // Array of user IDs (strings)
        } = body;

        if (!title || !job_type || !experience_level) {
            return NextResponse.json(
                { success: false, message: "Missing required fields (title, job_type, experience_level)." },
                { status: 400 }
            );
        }

        // Prepare array fields for PostgreSQL
        const skillsArray = Array.isArray(required_skills) ? required_skills : [];
        const qualificationsArray = Array.isArray(qualifications) ? qualifications : [];
        const responsibilitiesArray = Array.isArray(responsibilities) ? responsibilities : [];
        // Map recruiters to integers/strings as stored in DB
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
            postedBy, // $1
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

        return NextResponse.json({ success: true, newJob });
    } catch (error) {
        console.error("Job creation error:", error);
        return NextResponse.json(
            { success: false, message: error.message || "An unexpected error occurred during job creation." },
            { status: 500 }
        );
    }
}

/**
 * PUT: Update an existing job.
 */
export async function PUT(req) {
    let authData;
    try {
        // 1. Get Authentication Details from Headers
        authData = getAuthHeaders(req);
    } catch (e) {
        return NextResponse.json({ success: false, message: e.message }, { status: 401 });
    }
    
    const { userId, userRole, orgId } = authData;

    try {
        const body = await req.json();
        const {
            id, title, department, job_type, work_mode, location, min_salary, max_salary, 
            currency, experience_level, required_skills, qualifications, responsibilities, 
            job_description, status, assigned_recruiters = []
        } = body;

        if (!id || !title || !job_type || !experience_level) {
            return NextResponse.json({ success: false, message: "Missing required fields for update." }, { status: 400 });
        }

        // 2. Authorization Check: Fetch ownership
        const currentJobRes = await query(`SELECT posted_by, org_id FROM jobs WHERE id = $1`, [id]);
        if (currentJobRes.rows.length === 0) {
            return NextResponse.json({ success: false, message: "Job not found." }, { status: 404 });
        }
        
        const currentJob = currentJobRes.rows[0];
        
        const isOwner = currentJob.posted_by === userId;
        const isAdmin = userRole === 'OrgAdmin';
        const isAuthorizedOrg = currentJob.org_id === orgId;

        // Only the owner or an OrgAdmin can edit, and job must belong to their org
        if (!isAuthorizedOrg || (!isOwner && !isAdmin)) {
            return NextResponse.json({ success: false, message: "Unauthorized to edit this job listing." }, { status: 403 });
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
            return NextResponse.json({ success: false, message: "Update failed (DB constraint)." }, { status: 404 });
        }

        return NextResponse.json({ success: true, updatedJob: result.rows[0] });

    } catch (error) {
        console.error("Job update error:", error);
        return NextResponse.json({ success: false, message: "An unexpected error occurred during job update." }, { status: 500 });
    }
}

/**
 * DELETE: Delete a job by its ID.
 */
export async function DELETE(req) {
    let authData;
    try {
        authData = getAuthHeaders(req);
    } catch (e) {
        return NextResponse.json({ success: false, message: e.message }, { status: 401 });
    }
    
    const { userId, userRole, orgId } = authData;

    try {
        const { searchParams } = new URL(req.url);
        const jobId = searchParams.get("jobId");

        if (!jobId) {
            return NextResponse.json({ success: false, message: "jobId query parameter is required for deletion." }, { status: 400 });
        }

        // 1. Authorization Check: Fetch ownership
        const currentJobRes = await query(`SELECT posted_by, org_id FROM jobs WHERE id = $1`, [jobId]);
        if (currentJobRes.rows.length === 0) {
            return NextResponse.json({ success: false, message: "Job not found." }, { status: 404 });
        }
        
        const currentJob = currentJobRes.rows[0];
        
        const isOwner = currentJob.posted_by === userId;
        const isAdmin = userRole === 'OrgAdmin';
        const isAuthorizedOrg = currentJob.org_id === orgId;

        // Only the owner or an OrgAdmin can delete, and job must belong to their org
        if (!isAuthorizedOrg || (!isOwner && !isAdmin)) {
            return NextResponse.json({ success: false, message: "Unauthorized to delete this job listing." }, { status: 403 });
        }
        
        // 2. Perform Deletion
        const sql = `DELETE FROM jobs WHERE id = $1 AND org_id = $2 RETURNING id`;
        const result = await query(sql, [jobId, orgId]);

        if (result.rows.length === 0) {
            return NextResponse.json({ success: false, message: "Deletion failed (job not found or unauthorized)." }, { status: 403 });
        }

        return NextResponse.json({ success: true, message: "Job deleted successfully." });

    } catch (error) {
        console.error("Job deletion error:", error);
        return NextResponse.json(
            { success: false, message: error.message || "An unexpected error occurred during job deletion." },
            { status: 500 }
        );
    }
}
