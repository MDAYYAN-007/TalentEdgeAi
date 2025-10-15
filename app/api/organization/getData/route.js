import { NextResponse } from "next/server";
import { query } from "@/actions/db";

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const orgId = searchParams.get('orgId');

        if (!orgId) {
            return NextResponse.json({ success: false, message: "Organization ID is required." }, { status: 400 });
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
            return NextResponse.json({ success: false, message: "Organization not found." }, { status: 404 });
        }

        const orgData = orgRes.rows[0];

        // 2. Mock/Placeholder Analytics (In a real app, these would be separate complex queries)
        const mockAnalytics = {
            openRoles: 45,
            avgTimeToHire: 28,
            aiMatchSuccessRate: 89,
        };

        return NextResponse.json({
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
        });

    } catch (error) {
        console.error("API Org Data Error:", error);
        return NextResponse.json(
            { success: false, message: "Server error fetching organization data." },
            { status: 500 }
        );
    }
}
