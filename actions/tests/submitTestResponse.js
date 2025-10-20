'use server';

import { query } from '@/actions/db';

export async function submitTestResponse(attemptId, questionId, response) {
    try {
        // First, check if a response already exists
        const checkSql = `
            SELECT id FROM test_responses 
            WHERE attempt_id = $1 AND question_id = $2
        `;

        const checkResult = await query(checkSql, [attemptId, questionId]);

        let sql, params;

        if (checkResult.rows.length > 0) {
            // Update existing response
            sql = `
                UPDATE test_responses 
                SET 
                    answer = $3,
                    selected_options = $4,
                    question_snapshot = $5,
                    created_at = NOW()
                WHERE attempt_id = $1 AND question_id = $2
                RETURNING id
            `;
        } else {
            // Insert new response
            sql = `
                INSERT INTO test_responses (
                    attempt_id,
                    question_id,
                    answer,
                    selected_options,
                    question_snapshot,
                    created_at
                )
                VALUES ($1, $2, $3, $4, $5, NOW())
                RETURNING id
            `;
        }

        // Prepare the data
        const answer = response.answer || null;
        const selectedOptions = response.selectedOptions ? JSON.stringify(response.selectedOptions) : null;

        const questionSnapshot = {
            questionType: response.questionType,
            timestamp: response.timestamp
        };

        params = [
            attemptId,
            questionId,
            answer,
            selectedOptions,
            JSON.stringify(questionSnapshot)
        ];

        const result = await query(sql, params);

        return {
            success: true,
            responseId: result.rows[0]?.id
        };
    } catch (error) {
        console.error('Error submitting test response:', error);
        return {
            success: false,
            message: 'Failed to submit response',
            error: error.message
        };
    }
}