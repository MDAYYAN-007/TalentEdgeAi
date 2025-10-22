'use server';

import { GoogleGenAI } from '@google/genai';
import { query } from '@/actions/db';

// Initialize the GoogleGenAI client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function evaluateWithAI(responseId) {
    try {
        console.log('🤖 [evaluateWithAI] Starting AI evaluation for response ID:', responseId);

        // Get response details with question information
        const responseSql = `
            SELECT 
                tr.*, 
                tq.question_text, 
                tq.correct_answer, 
                tq.question_type, 
                tq.marks,
                tq.options
            FROM test_responses tr
            JOIN test_questions tq ON tr.question_id = tq.id
            WHERE tr.id = $1
        `;
        const responseResult = await query(responseSql, [responseId]);

        if (responseResult.rows.length === 0) {
            console.log('❌ [evaluateWithAI] Response not found');
            return { success: false, message: 'Response not found' };
        }

        const response = responseResult.rows[0];
        console.log('📋 [evaluateWithAI] Response details:', {
            question_type: response.question_type,
            question_text: response.question_text,
            answer: response.answer,
            correct_answer: response.correct_answer,
            marks: response.marks
        });

        // Call AI evaluation based on question type
        const aiResult = await evaluateWithGemini(
            response.question_text,
            response.answer,
            response.correct_answer,
            response.question_type,
            response.marks,
            response.options
        );

        console.log('🤖 [evaluateWithAI] AI evaluation result:', aiResult);

        // Calculate marks based on AI score
        const marksAwarded = Math.round((aiResult.score / 100) * response.marks);

        // Update response with AI evaluation
        const updateSql = `
            UPDATE test_responses 
            SET marks_awarded = $1,
                is_auto_graded = false,
                ai_feedback = $2,
                ai_confidence_score = $3,
                explanation = $4
            WHERE id = $5
        `;
        await query(updateSql, [
            marksAwarded,
            aiResult.feedback,
            aiResult.confidence,
            aiResult.explanation || 'Evaluated by AI',
            responseId
        ]);

        console.log('💾 [evaluateWithAI] Database updated successfully');

        return {
            success: true,
            data: {
                marksAwarded,
                possibleMarks: response.marks,
                aiFeedback: aiResult.feedback,
                confidence: aiResult.confidence,
                explanation: aiResult.explanation,
                score: aiResult.score
            }
        };

    } catch (error) {
        console.error('💥 [evaluateWithAI] Error in AI evaluation:', error);
        return {
            success: false,
            message: 'AI evaluation failed: ' + error.message
        };
    }
}

// AI Evaluation using Gemini API
async function evaluateWithGemini(question, answer, correctAnswer, questionType, maxMarks, options) {
    console.log('🤖 [evaluateWithGemini] Starting AI evaluation for:', questionType);

    try {
        let systemInstruction = '';
        let prompt = '';

        switch (questionType) {
            case 'text':
                systemInstruction = `You are an expert technical evaluator. Evaluate the candidate's answer for a text-based question.
                
                Scoring Guidelines:
                - 90-100%: Comprehensive, accurate, and well-explained answer covering all key points
                - 70-89%: Good answer with most key points covered, minor omissions
                - 50-69%: Average answer with some key points but significant omissions
                - 30-49%: Poor answer with few relevant points
                - 0-29%: Incorrect, irrelevant, or very incomplete answer

                Output your evaluation as a JSON object with this exact structure:
                {
                    "score": number (0-100),
                    "feedback": string (2-3 sentence professional feedback),
                    "confidence": number (0.0-1.0),
                    "explanation": string (brief explanation of scoring)
                }`;

                prompt = `QUESTION: ${question}
                CORRECT ANSWER REFERENCE: ${correctAnswer}
                CANDIDATE'S ANSWER: ${answer}
                
                Evaluate the candidate's answer based on accuracy, completeness, and relevance to the question.`;
                break;

            case 'coding':
                systemInstruction = `You are an expert code reviewer and technical evaluator. Evaluate the candidate's code submission.
                
                Scoring Guidelines:
                - 90-100%: Efficient, correct, well-structured code with proper edge cases
                - 70-89%: Correct logic with minor issues in efficiency or structure
                - 50-69%: Partially correct but with significant issues
                - 30-49%: Major logical errors or incomplete solution
                - 0-29%: Completely incorrect or non-functional code

                Output your evaluation as a JSON object with this exact structure:
                {
                    "score": number (0-100),
                    "feedback": string (2-3 sentence professional feedback),
                    "confidence": number (0.0-1.0),
                    "explanation": string (brief explanation of scoring)
                }`;

                prompt = `PROGRAMMING QUESTION: ${question}
                CANDIDATE'S CODE SOLUTION: ${answer}
                
                Evaluate the code based on:
                1. Correctness and functionality
                2. Code quality and structure
                3. Efficiency and best practices
                4. Handling of edge cases`;
                break;

            default:
                throw new Error(`Unsupported question type: ${questionType}`);
        }

        console.log('🤖 [evaluateWithGemini] Sending request to Gemini API...');

        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: prompt,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: 'application/json',
                responseSchema: {
                    type: 'object',
                    properties: {
                        score: { 
                            type: 'number',
                            minimum: 0,
                            maximum: 100,
                            description: 'Evaluation score from 0-100'
                        },
                        feedback: {
                            type: 'string',
                            description: 'Professional feedback for the candidate'
                        },
                        confidence: {
                            type: 'number',
                            minimum: 0,
                            maximum: 1,
                            description: 'Confidence level of the evaluation'
                        },
                        explanation: {
                            type: 'string',
                            description: 'Brief explanation of the scoring'
                        }
                    },
                    required: ['score', 'feedback', 'confidence', 'explanation'],
                },
                temperature: 0.1, // Low temperature for consistent scoring
                maxOutputTokens: 1024,
            },
        });

        console.log('🤖 [evaluateWithGemini] Received response from Gemini API');

        const jsonResponse = JSON.parse(response.text.trim());
        
        // Validate response
        if (typeof jsonResponse.score !== 'number' || jsonResponse.score < 0 || jsonResponse.score > 100) {
            throw new Error('Invalid score returned from AI');
        }

        return {
            score: Math.round(jsonResponse.score),
            feedback: jsonResponse.feedback || 'No specific feedback provided',
            confidence: Math.min(1, Math.max(0, jsonResponse.confidence || 0.7)),
            explanation: jsonResponse.explanation || 'AI evaluation completed'
        };

    } catch (error) {
        console.error('💥 [evaluateWithGemini] Error in Gemini API call:', error);
        
        // Fallback evaluation if AI fails
        return getFallbackEvaluation(question, answer, correctAnswer, questionType, maxMarks);
    }
}

// Fallback evaluation when AI fails
function getFallbackEvaluation(question, answer, correctAnswer, questionType, maxMarks) {
    console.log('🔄 [getFallbackEvaluation] Using fallback evaluation');

    let score = 0;
    let feedback = '';
    let confidence = 0.5;
    let explanation = 'Evaluated using fallback method';

    if (questionType === 'text') {
        if (!answer || answer.trim().length === 0) {
            score = 0;
            feedback = 'No answer provided.';
        } else {
            // Simple keyword-based fallback
            const answerWords = new Set(answer.toLowerCase().split(/\s+/));
            const correctWords = new Set((correctAnswer || '').toLowerCase().split(/\s+/));
            
            let matches = 0;
            correctWords.forEach(word => {
                if (answerWords.has(word) && word.length > 3) {
                    matches++;
                }
            });

            const totalKeywords = correctWords.size;
            score = totalKeywords > 0 ? Math.min((matches / totalKeywords) * 100, 70) : 50;
            feedback = `Answer contains ${matches} relevant keywords. Basic content analysis performed.`;
        }
    } else if (questionType === 'coding') {
        if (!answer || answer.trim().length < 10) {
            score = 0;
            feedback = 'Incomplete or no code submitted.';
        } else {
            // Basic code length and structure check
            const lines = answer.split('\n').length;
            const hasFunction = answer.includes('function') || answer.includes('def ') || answer.includes('class ');
            const hasReturn = answer.includes('return');
            
            if (hasFunction && lines > 5) {
                score = 60;
                feedback = 'Code appears structured but requires detailed review.';
            } else if (lines > 3) {
                score = 40;
                feedback = 'Basic code structure detected but appears incomplete.';
            } else {
                score = 20;
                feedback = 'Minimal code submission detected.';
            }
        }
    }

    return {
        score: Math.round(score),
        feedback,
        confidence,
        explanation
    };
}

