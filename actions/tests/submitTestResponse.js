'use server';

import { query } from '@/actions/db';

export async function submitTestResponse(attemptId, questionId, response) {
    try {
        const sql = `
            INSERT INTO test_responses (
                attempt_id,
                question_id,
                selected_options,
                answer,
                question_snapshot,
                time_taken_seconds,
                created_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, NOW())
            ON CONFLICT (attempt_id, question_id) 
            DO UPDATE SET
                selected_options = EXCLUDED.selected_options,
                answer = EXCLUDED.answer,
                question_snapshot = EXCLUDED.question_snapshot,
                time_taken_seconds = EXCLUDED.time_taken_seconds,
                updated_at = NOW()
        `;

        await query(sql, [
            attemptId,
            questionId,
            response.selectedOptions,
            response.answer,
            { 
                questionType: response.questionType,
                timestamp: response.timestamp
            },
            0 // time_taken_seconds - you can calculate this based on timestamps
        ]);

        return { success: true };
    } catch (error) {
        console.error('Error submitting test response:', error);
        return { success: false, message: 'Failed to submit response' };
    }
}