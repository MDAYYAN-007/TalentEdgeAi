import { NextResponse } from "next/server";
import { query } from "@/actions/db";
import jwt from "jsonwebtoken";

export async function POST(req) {
    try {
        const body = await req.json();
        const {
            userId,
            fullName,
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
            SECRET,
            { expiresIn: process.env.JWT_EXPIRY || "7d" }
        );

        const response = NextResponse.json({
            success: true,
            profile,
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
