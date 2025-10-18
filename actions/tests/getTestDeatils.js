// actions/tests/getTestDetails.js
'use server';

import { query } from '@/actions/db';

export async function getTestDetails(testId, authData) {
    try {
        // Verify the test belongs to the organization and get basic info
        const testSql = `
            SELECT 
                t.*,
                CONCAT(u.first_name, ' ', u.last_name) as created_by_name,
                u.email as created_by_email,
                COUNT(tq.id) as question_count,
                COUNT(ta.id) as assignment_count
            FROM tests t
            LEFT JOIN users u ON t.created_by = u.id
            LEFT JOIN test_questions tq ON t.id = tq.test_id
            LEFT JOIN test_assignments ta ON t.id = ta.test_id
            WHERE t.id = $1 AND t.org_id = $2
            GROUP BY t.id, u.first_name, u.last_name, u.email
        `;

        const testResult = await query(testSql, [testId, authData.orgId]);

        if (testResult.rows.length === 0) {
            return { success: false, message: 'Test not found or access denied' };
        }

        const test = testResult.rows[0];

        // Get all questions with their details
        const questionsSql = `
            SELECT 
                *,
                (SELECT COUNT(*) FROM test_responses tr 
                 JOIN test_attempts ta ON tr.attempt_id = ta.id 
                 WHERE tr.question_id = tq.id AND ta.test_id = $1) as response_count
            FROM test_questions tq
            WHERE tq.test_id = $1
            ORDER BY tq.order_index ASC
        `;

        const questionsResult = await query(questionsSql, [testId]);
        const questions = questionsResult.rows;

        // Calculate statistics
        const totalMarks = questions.reduce((sum, q) => sum + parseInt(q.marks), 0);
        const questionTypes = questions.reduce((acc, q) => {
            acc[q.question_type] = (acc[q.question_type] || 0) + 1;
            return acc;
        }, {});
        const difficultyLevels = questions.reduce((acc, q) => {
            acc[q.difficulty_level] = (acc[q.difficulty_level] || 0) + 1;
            return acc;
        }, {});

        return {
            success: true,
            test: {
                ...test,
                total_marks: totalMarks,
                statistics: {
                    questionTypes,
                    difficultyLevels,
                    totalQuestions: questions.length
                }
            },
            questions
        };
    } catch (error) {
        console.error('Error fetching test details:', error);
        return { success: false, message: 'Failed to fetch test details' };
    }
}