'use server';

export async function parseResume(formData) {
    try {
        const file = formData.get("file");

        if (!file) {
            return { success: false, message: "No file uploaded." };
        }

        // Create new FormData for Affinda
        const affindaForm = new FormData();
        affindaForm.append("file", file, file.name);
        affindaForm.append("workspace", "VDmSwfMR"); // Your workspace ID

        const response = await fetch("https://api.affinda.com/v3/documents", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${process.env.AFFINDA_API_KEY}`,
            },
            body: affindaForm,
        });

        const data = await response.json();
        console.log("Affinda API response:", data);

        if (!data.data) {
            return {
                success: false,
                message: "No data parsed",
                raw: data,
            };
        }

        // Map response to your form
        const parsed = {
            name: data.data.candidateName?.raw || "",
            email: data.data.emails?.[0] || "",
            phone: data.data.phoneNumbers?.[0]?.raw || "",
            linkedinUrl: data.data?.websites?.find((url) => url.includes("linkedin")) || "",
            portfolioUrl: data.data?.website,
            skills: data.data.skills?.map((s) => s?.parsed?.name) || [],
            education: data.data.education?.map((e) => ({
                degree: e?.parsed?.educationAccreditation?.parsed,
                institution: e?.parsed?.educationOrganization?.parsed,
                year: e?.parsed?.educationDates?.parsed?.end?.year,
                grade: e?.parsed?.educationGrade?.parsed?.educationGradeScore?.parsed,
            })) || [],
            experience: data.data.workExperience?.map((exp) => ({
                jobTitle: exp?.parsed?.workExperienceJobTitle?.parsed,
                company: exp?.parsed?.workExperienceOrganization?.parsed,
                duration: exp?.parsed?.workExperienceDates?.raw,
                description: exp?.parsed?.workExperienceDescription?.parsed,
            })) || [],
            projects: data.data.projects?.map((p) => ({
                title: p?.parsed?.projectTitle?.parsed,
                description: p?.parsed?.projectDescription?.parsed,
                githubUrl: p?.parsed?.githubUrl,
                liveUrl: p?.parsed?.liveUrl,
            })) || [],
        };

        return { success: true, parsedData: parsed, raw: data };
    } catch (error) {
        console.error("Resume parsing error:", error);
        return { success: false, message: "Resume upload failed", raw: error };
    }
}