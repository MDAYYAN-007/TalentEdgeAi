import { NextResponse } from "next/server";

export async function POST(req) {
    try {
        const formData = await req.formData();
        const file = formData.get("file");

        if (!file) {
            return NextResponse.json({ success: false, message: "No file uploaded." });
        }

        // Create new FormData for Affinda with workspace
        const affindaForm = new FormData();
        affindaForm.append("file", file);
        affindaForm.append("workspace", "VDmSwfMR"); // your workspace ID

        // Step 1: Upload resume to Affinda
        const uploadRes = await fetch("https://api.affinda.com/v3/documents", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${process.env.AFFINDA_API_KEY}`,
            },
            body: affindaForm,
        });

        const uploadData = await uploadRes.json();

        console.log("Upload Data:", uploadData);
        
        if (!uploadData.data?.id) {
            return NextResponse.json({
                success: false,
                message: "Resume upload failed (no document ID).",
                raw: uploadData,
            });
        }

        const documentId = uploadData.data.id;

        // Step 2: Parse the uploaded resume
        const parseForm = new FormData();
        parseForm.append("document", documentId);

        const parseRes = await fetch("https://api.affinda.com/v3/resumes/parse", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${process.env.AFFINDA_API_KEY}`,
            },
            body: parseForm,
        });

        const parseData = await parseRes.json();

        if (!parseData.success || !parseData.data) {
            return NextResponse.json({
                success: false,
                message: "Resume parsing failed.",
                raw: parseData,
            });
        }

        const data = parseData.data;

        // Simplify the parsed data
        const parsed = {
            name: data.name?.value || "",
            email: data.emails?.[0]?.value || "",
            phone: data.phoneNumbers?.[0]?.value || "",
            linkedinUrl: data.websites?.find((url) => url.includes("linkedin"))?.value || "",
            portfolioUrl: data.websites?.find((url) => !url.includes("linkedin"))?.value || "",
            skills: data.skills?.map((s) => s.name) || [],
            education: data.education?.map((e) => ({
                degree: e.degree?.value,
                institution: e.organization?.value,
                year: e.year?.value,
                grade: e.grade?.value,
            })) || [],
            experiences: data.workExperience?.map((exp) => ({
                jobTitle: exp.jobTitle?.value,
                company: exp.organization?.value,
                startDate: exp.dates?.startDate,
                endDate: exp.dates?.endDate,
                description: exp.description?.value,
            })) || [],
            projects: data.projects?.map((p) => ({
                title: p.title?.value,
                description: p.description?.value,
                githubUrl: p.githubUrl?.value,
                liveUrl: p.liveUrl?.value,
            })) || [],
            certifications: data.certifications?.map((c) => c.name) || [],
        };

        return NextResponse.json({ success: true, parsedData: parsed });
    } catch (error) {
        console.error("Resume parsing error:", error);
        return NextResponse.json({
            success: false,
            message: "Error parsing resume.",
        });
    }
}
