'use server';

import { GoogleGenAI } from '@google/genai';

// Initialize the GoogleGenAI client (ensure GEMINI_API_KEY is in your .env.local)
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// --- REVISED SCORING WEIGHTS (Keeping the weights the same as the last version) ---
const WEIGHTS = {
    OBJECTIVE_BONUS: 5,         // LinkedIn (2.5) + Portfolio (2.5)
    DIRECT_SKILL_MATCH: 25,     // Hard Skill Match (Calculated objectively)
    EDUCATION_ALIGNMENT: 10,    // Subjective AI Score component
    EXPERIENCE_FIT: 40,         // Subjective AI Score component
    COVER_LETTER_FIT: 20,       // Subjective AI Score component
    MAX_SCORE: 100
};

// --- Helper function for direct skill matching (No change needed) ---
function calculateSkillMatch(requiredSkills, applicantSkills, applicantExperiences, applicantProjects) {
    if (!requiredSkills || requiredSkills.length === 0) return WEIGHTS.DIRECT_SKILL_MATCH;

    const required = new Set(requiredSkills.map(s => s.toLowerCase().trim()));
    let matchedSkills = new Set();

    // 1. Check Applicant's explicitly listed skills
    applicantSkills.forEach(s => {
        if (required.has(s.toLowerCase().trim())) {
            matchedSkills.add(s.toLowerCase().trim());
        }
    });

    // 2. Check skills mentioned implicitly in experience and project descriptions
    const experienceText = applicantExperiences.map(e => e.description).join(' ').toLowerCase();
    const projectText = applicantProjects.map(p => p.description).join(' ').toLowerCase();
    const combinedText = experienceText + ' ' + projectText;

    required.forEach(reqSkill => {
        // A simple check if the word is mentioned in the combined text
        if (combinedText.includes(reqSkill) || combinedText.includes(reqSkill.split(' ')[0])) {
            matchedSkills.add(reqSkill);
        }
    });

    // Calculate Score
    const matchCount = matchedSkills.size;
    const requiredCount = required.size;

    const skillScore = (matchCount / requiredCount) * WEIGHTS.DIRECT_SKILL_MATCH;

    return isNaN(skillScore) ? 0 : skillScore;
}


export async function scoreResume(payload) {
    const { jobDetails, applicantProfile, coverLetter } = payload;

    // --- STEP 1: OBJECTIVE PRE-CALCULATIONS (No change needed) ---
    let objectiveBonus = 0;
    if (applicantProfile.linkedinUrl && applicantProfile.linkedinUrl.startsWith('http')) {
        objectiveBonus += 2.5;
    }
    if (applicantProfile.portfolioUrl && applicantProfile.portfolioUrl.startsWith('http')) {
        objectiveBonus += 2.5;
    }

    const directSkillMatchScore = calculateSkillMatch(
        jobDetails.requiredSkills,
        applicantProfile.skills,
        applicantProfile.experiences,
        applicantProfile.projects
    );
    const objectiveScore = objectiveBonus + directSkillMatchScore;

    const aiScoreBudget = WEIGHTS.EXPERIENCE_FIT + WEIGHTS.EDUCATION_ALIGNMENT + WEIGHTS.COVER_LETTER_FIT;
    const scoreOffset = objectiveScore;

    // --- STEP 2: Configure Gemini for Structured Feedback ---

    const systemInstruction = `You are an expert HR/ATS Analyst. Your task is to perform three actions: 
    1. Objectively evaluate the subjective fit of the applicant's profile for the "Frontend Developer" role based on the provided weights (totaling ${aiScoreBudget} points).
    2. Provide a list of 3-4 professional strengths and weaknesses.
    3. Provide a list of 3-4 specific, actionable suggestions for improvement.

    Subjective Scoring Breakdown (Max ${aiScoreBudget} points):
    - **Experience & Project Fit (${WEIGHTS.EXPERIENCE_FIT} pts):** Assess relevance, depth, and the impact of past roles/projects, noting the current ML Engineer position.
    - **Education Alignment (${WEIGHTS.EDUCATION_ALIGNMENT} pts):** Evaluate degree relevance and whether qualifications are met.
    - **Cover Letter & Motivation (${WEIGHTS.COVER_LETTER_FIT} pts):** Judge the sincerity and specificity of the cover letter. Award 0 points if it is empty or generic.

    Output your entire response as a single, detailed JSON object. DO NOT include any markdown, commentary, or text outside the JSON object.
    The JSON object must strictly adhere to the following schema: { "ai_raw_score": number, "explanation_points": string[], "improvement_points": string[] }
    'ai_raw_score' must be an integer between 0 and ${aiScoreBudget}.
    'explanation_points' must be an array of 5-6 strings detailing strengths and weaknesses.
    'improvement_points' must be an array of 5-6 strings detailing actionable suggestions.
    `;

    // --- STEP 3: API Call and Final Calculation ---
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `JOB DETAILS:\n${JSON.stringify(jobDetails)}\n\nAPPLICANT PROFILE:\n${JSON.stringify(applicantProfile)}\n\nCOVER LETTER:\n${coverLetter}`,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: 'application/json',
                responseSchema: {
                    type: 'object',
                    properties: {
                        ai_raw_score: { type: 'number' },
                        explanation_points: {
                            type: 'array',
                            items: { type: 'string' },
                            description: '5-6 bullet points summarizing fit strengths and weaknesses.'
                        },
                        improvement_points: {
                            type: 'array',
                            items: { type: 'string' },
                            description: '5-6 actionable steps for the applicant to improve their score.'
                        }
                    },
                    required: ['ai_raw_score', 'explanation_points', 'improvement_points'],
                },
                temperature: 0.1,
            },
        });

        const jsonResponse = JSON.parse(response.text.trim());
        const aiRawScore = Math.min(aiScoreBudget, Math.max(0, Math.round(jsonResponse.ai_raw_score)));

        // --- FINAL CALCULATION ---
        const finalScore = Math.round(scoreOffset + aiRawScore);

        // Return a clean, structured object containing the score and the two lists
        return {
            success: true,
            score: finalScore,
            // Include Objective and Subjective scores for client-side display
            objectiveScore: Math.round(objectiveScore),
            subjectiveScore: aiRawScore,

            // Return the structured lists directly
            explanationList: jsonResponse.explanation_points || [],
            improvementList: jsonResponse.improvement_points || [],

            // NOTE: The 'message' field is no longer the primary output, but returning 
            // a simple success message is still good practice for toast notifications.
            message: 'AI score calculated successfully.'
        };

    } catch (error) {
        console.error('AI Score Generation Error:', error);
        return {
            success: false,
            score: null,
            objectiveScore: 0,
            subjectiveScore: 0,
            explanationList: [],
            improvementList: [],
            message: 'AI scoring service is temporarily unavailable. Please check your API key and try again later.'
        };
    }
}