'use server';

import { query } from '@/actions/db';

export async function getTestResults(attemptId) {
    try {
        console.log('🔍 [getTestResults] Fetching test results for attempt:', attemptId);

        // 1. Get test attempt details
        const attemptSql = `
            SELECT 
                ta.*,
                t.title as test_title,
                t.description as test_description,
                t.duration_minutes,
                t.total_marks,
                t.passing_percentage,
                CONCAT(u.first_name, ' ', u.last_name) as applicant_name,
                u.email as applicant_email,
                j.title,
                j.location,
                a.applied_at,
                a.status as application_status
            FROM test_attempts ta
            JOIN tests t ON ta.test_id = t.id
            JOIN applications a ON ta.application_id = a.id
            JOIN users u ON a.applicant_id = u.id
            JOIN jobs j ON a.job_id = j.id
            WHERE ta.id = $1
        `;
        const attemptResult = await query(attemptSql, [attemptId]);

        console.log('Attempt Result Rows:', attemptResult.rows);
        if (attemptResult.rows.length === 0) {
            return { success: false, message: 'Test attempt not found' };
        }

        const attempt = attemptResult.rows[0];

        // 2. Get all test responses with question details
        const responsesSql = `
            SELECT 
                tr.*,
                tq.question_text,
                tq.question_type,
                tq.marks,
                tq.options,
                tq.correct_answer,
                tq.correct_options,
                tq.explanation as question_explanation,
                tq.difficulty_level,
                tq.order_index
            FROM test_responses tr
            JOIN test_questions tq ON tr.question_id = tq.id
            WHERE tr.attempt_id = $1
            ORDER BY tq.order_index ASC
        `;
        const responsesResult = await query(responsesSql, [attemptId]);
        const responses = responsesResult.rows;

        // 3. Calculate summary statistics
        const totalQuestions = responses.length;
        const correctAnswers = responses.filter(r => parseFloat(r.marks_awarded) === parseFloat(r.marks)).length;
        const incorrectAnswers = responses.filter(r => parseFloat(r.marks_awarded) === 0).length;
        const partialMarks = responses.filter(r => parseFloat(r.marks_awarded) > 0 && parseFloat(r.marks_awarded) < parseFloat(r.marks)).length;

        const result = {
            success: true,
            data: {
                attempt: {
                    id: attempt.id,
                    test_id: attempt.test_id,
                    application_id: attempt.application_id,
                    applicant_id: attempt.applicant_id,
                    started_at: attempt.started_at,
                    submitted_at: attempt.submitted_at,
                    status: attempt.status,
                    total_score: parseFloat(attempt.total_score || 0),
                    percentage: parseFloat(attempt.percentage || 0),
                    is_passed: attempt.is_passed,
                    time_spent_seconds: attempt.time_spent_seconds,
                    isEvaluated: attempt.is_evaluated,
                    created_at: attempt.created_at,
                    updated_at: attempt.updated_at
                },
                test: {
                    id: attempt.test_id,
                    title: attempt.test_title,
                    description: attempt.test_description,
                    duration_minutes: attempt.duration_minutes,
                    total_marks: parseFloat(attempt.total_marks),
                    passing_marks: parseFloat(attempt.passing_marks),
                    question_count: totalQuestions
                },
                application: {
                    id: attempt.application_id,
                    applicant_name: attempt.applicant_name,
                    applicant_email: attempt.applicant_email,
                    title: attempt.title,
                    location: attempt.location,
                    applied_at: attempt.applied_at,
                    status: attempt.application_status
                },
                responses: responses.map(response => ({
                    id: response.id,
                    question_id: response.question_id,
                    question_text: response.question_text,
                    question_type: response.question_type,
                    options: response.options,
                    correct_answer: response.correct_answer,
                    correct_options: response.correct_options,
                    selected_options: response.selected_options,
                    answer: response.answer,
                    marks: parseFloat(response.marks),
                    marks_awarded: parseFloat(response.marks_awarded || 0),
                    is_auto_graded: response.is_auto_graded,
                    ai_feedback: response.ai_feedback,
                    explanation: response.explanation,
                    time_taken_seconds: response.time_taken_seconds,
                    difficulty_level: response.difficulty_level,
                    order_index: response.order_index
                })),
                summary: {
                    total_questions: totalQuestions,
                    correct_answers: correctAnswers,
                    incorrect_answers: incorrectAnswers,
                    partial_marks: partialMarks,
                    total_score: parseFloat(attempt.total_score || 0),
                    percentage: parseFloat(attempt.percentage || 0),
                    is_passed: attempt.is_passed,
                    time_spent: attempt.time_spent_seconds
                }
            }
        };

        console.log('Attempt Result:', result);

        console.log('✅ [getTestResults] Successfully fetched test results');
        return result;

    } catch (error) {
        console.error('💥 [getTestResults] Error:', error);
        return {
            success: false,
            message: 'Failed to fetch test results: ' + error.message
        };
    }
}