import { NextResponse } from "next/server";
import { query } from "@/actions/db";

function getJobsListHeaders(req) {
    const orgId = req.headers.get('X-Org-ID');

    if (!orgId) {
        throw new Error("Missing X-Org-ID header. Authorization failed.");
    }

    return { orgId: parseInt(orgId, 10) };
}

export async function GET(req) {
    let authData;
    try {
        authData = getJobsListHeaders(req);
    } catch (e) {
        return NextResponse.json({ success: false, message: e.message }, { status: 401 });
    }

    const orgId = authData.orgId;

    console.log(`Fetching jobs for organization ID: ${orgId}`);

    try {
        const sql = `
            SELECT 
                j.id, j.title, j.department, j.job_type, j.work_mode, j.location, 
                j.min_salary, j.max_salary, j.currency, j.experience_level, 
                j.required_skills, j.qualifications, j.responsibilities, 
                j.job_description, j.status, j.created_at, j.posted_by, 
                CONCAT(u.first_name, ' ', u.last_name) AS posted_by_name
            FROM jobs j
            JOIN users u ON j.posted_by = u.id
            WHERE j.org_id = $1
            ORDER BY j.created_at DESC;
        `;

        const result = await query(sql, [orgId]);

        return NextResponse.json({
            success: true,
            jobs: result.rows,
        });

    } catch (error) {
        console.error("Job fetch error:", error);
        return NextResponse.json({ success: false, message: "Internal server error fetching jobs." }, { status: 500 });
    }
}
