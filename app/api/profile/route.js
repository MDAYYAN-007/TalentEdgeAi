import { NextResponse } from "next/server";
import { query } from "@/actions/db";
import jwt from "jsonwebtoken";

export async function POST(req) {
    try {
        const body = await req.json();
        const {
            userId,
            fullName,
            email,
            role,
            phone,
            linkedinUrl,
            portfolioUrl,
            resumeUrl,
            experiences,
            education,
            skills,
            projects
        } = body;

        // Validate required field
        if (!userId) {
            return NextResponse.json(
                { success: false, message: "userId is required" },
                { status: 400 }
            );
        }

        // Upsert query: insert if not exists, else update
        const sql = `
      INSERT INTO profiles
        (user_id, phone, linkedin_url, portfolio_url, resume_url, experiences, education, skills, projects)
      VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (user_id)
      DO UPDATE SET
        phone = EXCLUDED.phone,
        linkedin_url = EXCLUDED.linkedin_url,
        portfolio_url = EXCLUDED.portfolio_url,
        resume_url = EXCLUDED.resume_url,
        experiences = EXCLUDED.experiences,
        education = EXCLUDED.education,
        skills = EXCLUDED.skills,
        projects = EXCLUDED.projects,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *;
    `;

        const values = [
            userId,
            phone || null,
            linkedinUrl || null,
            portfolioUrl || null,
            resumeUrl || null,
            JSON.stringify(experiences || []),
            JSON.stringify(education || []),
            JSON.stringify(skills || []),
            JSON.stringify(projects || [])
        ];

        const result = await query(sql, values);

        const newToken = jwt.sign(
            {
                id: userId,
                email,
                role,
                fullName,
                isProfileComplete: true,
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRY || "7d" }
        );

        const response = NextResponse.json({
            success: true,
            token: newToken,
        });

        return response;
    } catch (error) {
        console.error("Profile save error:", error);

        return NextResponse.json(
            { success: false, message: "An unexpected error occurred" },
            { status: 500 }
        );
    }
}

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get("userId");

        console.log("Fetching profile for userId:", userId);

        if (!userId) {
            return NextResponse.json(
                { success: false, message: "userId query param is required" },
                { status: 400 }
            );
        }

        const sql = "SELECT * FROM profiles WHERE user_id = $1";
        const result = await query(sql, [userId]);

        if (!result.rows.length) {
            return NextResponse.json({
                success: true,
                profile: null,
                message: "Profile not found",
            });
        }

        // Parse JSON fields before returning
        const profile = result.rows[0];
        console.log("Profile data retrieved:", profile);
    
        profile.experiences = profile.experiences || [];
        profile.education = profile.education || [];
        profile.skills = profile.skills || [];
        profile.projects = profile.projects || [];
        
        profile.experiences = Array.isArray(profile.experiences) ? profile.experiences : [];
        profile.education = Array.isArray(profile.education) ? profile.education : [];
        profile.skills = Array.isArray(profile.skills) ? profile.skills : [];
        profile.projects = Array.isArray(profile.projects) ? profile.projects : [];

        return NextResponse.json({
            success: true,
            profile,
        });
    } catch (error) {
        console.error("Error fetching profile:", error);
        return NextResponse.json(
            { success: false, message: "An unexpected error occurred" },
            { status: 500 }
        );
    }
}
