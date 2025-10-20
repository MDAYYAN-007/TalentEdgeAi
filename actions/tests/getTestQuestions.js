'use server';

import { query } from '@/actions/db';

export async function getTestQuestions(testId) {
    try {
        // Get test details
        const testSql = `
            SELECT * FROM tests WHERE id = $1
        `;
        const testResult = await query(testSql, [testId]);

        if (testResult.rows.length === 0) {
            return {
                success: false,
                message: 'Test not found'
            };
        }

        // Get questions
        const questionsSql = `
            SELECT 
                id,
                question_type,
                question_text,
                question_image_url,
                options,
                marks,
                difficulty_level,
                explanation,
                order_index
            FROM test_questions 
            WHERE test_id = $1 
            ORDER BY order_index ASC
        `;
        const questionsResult = await query(questionsSql, [testId]);

        return {
            success: true,
            test: testResult.rows[0],
            questions: questionsResult.rows
        };
    } catch (error) {
        console.error('Error fetching test questions:', error);
        return {
            success: false,
            message: 'Failed to fetch test questions'
        };
    }
}