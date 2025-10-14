import { NextResponse } from "next/server";
import { query } from "@/actions/db"; // Assuming this is your DB query function

// Helper to get User ID from query parameter
function getUserIdFromQuery(reqUrl) {
    const { searchParams } = new URL(reqUrl);
    return searchParams.get("userId");
}

// Helper to authenticate (Placeholder: replace with actual JWT verification)
function isAuthenticated(req) {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return false;
    }
    // In a real application, you would decode and verify the JWT here 
    // to get the actual user ID and ensure the token is valid.
    return authHeader.split(' ')[1];
}

/**
 * GET: Fetch all jobs posted by a specific user (userId from query param)
 */
export async function GET(req) {
    try {
        const userId = getUserIdFromQuery(req.url);

        if (!userId) {
            return NextResponse.json(
                { success: false, message: "userId query parameter is required" },
                { status: 400 }
            );
        }

        // NOTE: Column name changed from 'user_id' to 'posted_by' to match your schema.
        // We select all the list columns (TEXT[]) directly. The database driver 
        // should automatically map these to JavaScript arrays.
        const sql = `SELECT 
                        id, title, department, job_type, work_mode, location, 
                        min_salary, max_salary, currency, experience_level, 
                        required_skills, qualifications, responsibilities, 
                        job_description, status, posted_by, created_at
                     FROM jobs 
                     WHERE posted_by = $1 
                     ORDER BY created_at DESC`;

        const result = await query(sql, [userId]);

        return NextResponse.json({
            success: true,
            jobs: result.rows || [],
        });
    } catch (error) {
        console.error("Error fetching jobs:", error);
        return NextResponse.json(
            { success: false, message: "An unexpected error occurred while fetching jobs." },
            { status: 500 }
        );
    }
}

/**
 * POST: Create a new job listing (requires posted_by in the body)
 */
export async function POST(req) {
    try {
        if (!isAuthenticated(req)) {
            return NextResponse.json(
                { success: false, message: "Unauthorized: Missing or invalid token." },
                { status: 401 }
            );
        }

        const body = await req.json();
        const {
            user_id, // This field is coming from the client in JobsPage, used as posted_by
            title,
            department,
            job_type,
            work_mode,
            location,
            min_salary,
            max_salary,
            currency,
            experience_level,
            required_skills, // TEXT[] - pass directly
            qualifications, // TEXT[] - pass directly
            responsibilities, // TEXT[] - pass directly
            job_description,
            status
        } = body;

        // Use user_id from client as posted_by for the database
        const postedBy = user_id;

        // Basic server-side validation
        if (!postedBy || !title || !job_type || !experience_level) {
            return NextResponse.json(
                { success: false, message: "Missing required fields (user_id, title, job_type, experience_level)." },
                { status: 400 }
            );
        }

        // Ensure array fields are arrays (even if empty) to avoid DB errors with TEXT[] type
        const skillsArray = Array.isArray(required_skills) ? required_skills : [];
        const qualificationsArray = Array.isArray(qualifications) ? qualifications : [];
        const responsibilitiesArray = Array.isArray(responsibilities) ? responsibilities : [];


        const sql = `
            INSERT INTO jobs (
                posted_by, title, department, job_type, work_mode, location, 
                min_salary, max_salary, currency, experience_level, 
                required_skills, qualifications, responsibilities, job_description, status
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
            RETURNING *;
        `;

        const values = [
            postedBy, // $1
            title, // $2
            department || null, // $3
            job_type, // $4
            work_mode, // $5
            location || null, // $6
            min_salary || null, // $7
            max_salary || null, // $8
            currency, // $9
            experience_level, // $10
            skillsArray, // $11 (Passed as JS Array for TEXT[] column)
            qualificationsArray, // $12 (Passed as JS Array for TEXT[] column)
            responsibilitiesArray, // $13 (Passed as JS Array for TEXT[] column)
            job_description || null, // $14
            status, // $15
        ];

        const result = await query(sql, values);
        const newJob = result.rows[0];

        return NextResponse.json({
            success: true,
            message: "Job created successfully!",
            newJob: newJob,
        });
    } catch (error) {
        console.error("Job creation error:", error);
        return NextResponse.json(
            { success: false, message: "An unexpected error occurred during job creation." },
            { status: 500 }
        );
    }
}

export async function PUT(req) {
    try {
        const token = isAuthenticated(req);
        if (!token) {
            return NextResponse.json(
                { success: false, message: "Unauthorized: Missing or invalid token." },
                { status: 401 }
            );
        }

        const body = await req.json();
        const {
            id, // The job ID we are updating
            user_id, // Expected to be the posted_by user ID
            title,
            department,
            job_type,
            work_mode,
            location,
            min_salary,
            max_salary,
            currency,
            experience_level,
            required_skills,
            qualifications,
            responsibilities,
            job_description,
            status
        } = body;

        const postedBy = user_id;

        // Basic server-side validation for update
        if (!id || !postedBy || !title || !job_type || !experience_level) {
            return NextResponse.json(
                { success: false, message: "Missing required fields (id, user_id, title, job_type, experience_level) for update." },
                { status: 400 }
            );
        }

        // Ensure array fields are arrays (even if empty)
        const skillsArray = Array.isArray(required_skills) ? required_skills : [];
        const qualificationsArray = Array.isArray(qualifications) ? qualifications : [];
        const responsibilitiesArray = Array.isArray(responsibilities) ? responsibilities : [];

        // Note: In a production app, you would decode the JWT (token) here 
        // to verify that the token's user ID matches the 'postedBy' value 
        // AND that this user is the owner of the job 'id'.

        const sql = `
            UPDATE jobs SET
                title = $1,
                department = $2,
                job_type = $3,
                work_mode = $4,
                location = $5,
                min_salary = $6,
                max_salary = $7,
                currency = $8,
                experience_level = $9,
                required_skills = $10,
                qualifications = $11,
                responsibilities = $12,
                job_description = $13,
                status = $14,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $15 AND posted_by = $16
            RETURNING *;
        `;

        const values = [
            title, // $1
            department || null, // $2
            job_type, // $3
            work_mode, // $4
            location || null, // $5
            min_salary || null, // $6
            max_salary || null, // $7
            currency, // $8
            experience_level, // $9
            skillsArray, // $10
            qualificationsArray, // $11
            responsibilitiesArray, // $12
            job_description || null, // $13
            status, // $14
            id, // $15 (Job ID)
            postedBy, // $16 (User ID for security check)
        ];

        const result = await query(sql, values);

        if (result.rows.length === 0) {
            return NextResponse.json({ success: false, message: "Job not found or unauthorized to edit." }, { status: 404 });
        }

        const updatedJob = result.rows[0];

        return NextResponse.json({
            success: true,
            message: "Job updated successfully!",
            updatedJob: updatedJob,
        });

    } catch (error) {
        console.error("Job update error:", error);
        return NextResponse.json(
            { success: false, message: "An unexpected error occurred during job update." },
            { status: 500 }
        );
    }
}

/**
 * DELETE: Delete a job by its ID (jobId from query param)
 */
export async function DELETE(req) {
    try {
        if (!isAuthenticated(req)) {
            return NextResponse.json(
                { success: false, message: "Unauthorized: Missing or invalid token." },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(req.url);
        const jobId = searchParams.get("jobId");

        if (!jobId) {
            return NextResponse.json(
                { success: false, message: "jobId query parameter is required for deletion." },
                { status: 400 }
            );
        }

        // Note: For a proper implementation, you must verify the user token 
        // to check if the user is authorized to delete this specific job (i.e., posted_by matches JWT user ID).
        // The current implementation relies solely on the jobId.

        const sql = `DELETE FROM jobs WHERE id = $1 RETURNING id`;
        const result = await query(sql, [jobId]);

        if (result.rows.length === 0) {
            return NextResponse.json({ success: false, message: "Job not found." }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: "Job deleted successfully." });

    } catch (error) {
        console.error("Job deletion error:", error);
        return NextResponse.json(
            { success: false, message: "An unexpected error occurred during job deletion." },
            { status: 500 }
        );
    }
}
