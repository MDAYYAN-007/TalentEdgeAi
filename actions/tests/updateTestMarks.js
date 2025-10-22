'use server';

import { query } from '@/actions/db';

export async function updateTestMarks(responseId, marksAwarded, explanation = '') {
    try {
        console.log('📝 [updateTestMarks] Starting update for response:', responseId);
        console.log('📝 [updateTestMarks] Received marksAwarded:', marksAwarded, 'Type:', typeof marksAwarded);
        console.log('📝 [updateTestMarks] Received explanation:', explanation);

        // Validate and sanitize marksAwarded
        let sanitizedMarks = parseFloat(marksAwarded);
        console.log('🔍 [updateTestMarks] After parseFloat:', sanitizedMarks);

        if (isNaN(sanitizedMarks)) {
            console.log('⚠️ [updateTestMarks] marksAwarded is NaN, setting to 0');
            sanitizedMarks = 0;
        }

        // Ensure marks are not negative
        sanitizedMarks = Math.max(0, sanitizedMarks);
        console.log('✅ [updateTestMarks] Final sanitized marks:', sanitizedMarks);

        // 1. First, get the current response to know the maximum possible marks
        const getResponseSql = `
            SELECT tr.*, tq.marks as max_marks 
            FROM test_responses tr 
            JOIN test_questions tq ON tr.question_id = tq.id 
            WHERE tr.id = $1
        `;
        console.log('🔍 [updateTestMarks] Fetching response details...');
        const responseDetails = await query(getResponseSql, [responseId]);

        if (responseDetails.rows.length === 0) {
            console.log('❌ [updateTestMarks] Response not found with ID:', responseId);
            return { success: false, message: 'Response not found' };
        }

        const responseDetail = responseDetails.rows[0];
        const maxMarks = parseFloat(responseDetail.max_marks);
        console.log('🔍 [updateTestMarks] Max marks for this question:', maxMarks);
        console.log('🔍 [updateTestMarks] Current marks_awarded:', responseDetail.marks_awarded);

        // Validate that marks don't exceed maximum
        if (sanitizedMarks > maxMarks) {
            console.log('⚠️ [updateTestMarks] Marks exceed maximum, capping to:', maxMarks);
            sanitizedMarks = maxMarks;
        }

        console.log('🔍 [updateTestMarks] Attempt ID:', responseDetail.attempt_id);

        // 2. Update the test response
        const updateResponseSql = `
            UPDATE test_responses 
            SET marks_awarded = $1, 
                explanation = $2,
                is_auto_graded = false
            WHERE id = $3
            RETURNING *
        `;
        console.log('💾 [updateTestMarks] Updating response in database...');
        const responseResult = await query(updateResponseSql, [sanitizedMarks, explanation, responseId]);

        if (responseResult.rows.length === 0) {
            console.log('❌ [updateTestMarks] Failed to update response - no rows returned');
            return { success: false, message: 'Failed to update response' };
        }

        const updatedResponse = responseResult.rows[0];
        console.log('✅ [updateTestMarks] Response updated successfully:', updatedResponse);

        // 3. Recalculate total score for the attempt
        const attemptId = responseDetail.attempt_id;
        console.log('🧮 [updateTestMarks] Recalculating scores for attempt:', attemptId);

        const recalcSql = `
            SELECT 
                COALESCE(SUM(marks_awarded), 0) as new_total_score,
                COALESCE(SUM(marks), 0) as total_possible_marks
            FROM test_responses tr
            JOIN test_questions tq ON tr.question_id = tq.id
            WHERE tr.attempt_id = $1
        `;
        const recalcResult = await query(recalcSql, [attemptId]);

        const newTotalScore = parseFloat(recalcResult.rows[0].new_total_score || 0);
        const totalPossibleMarks = parseFloat(recalcResult.rows[0].total_possible_marks || 0);
        const newPercentage = totalPossibleMarks > 0 ? (newTotalScore / totalPossibleMarks) * 100 : 0;

        console.log('🧮 [updateTestMarks] Recalculation results:');
        console.log('🧮 [updateTestMarks] - New Total Score:', newTotalScore);
        console.log('🧮 [updateTestMarks] - Total Possible Marks:', totalPossibleMarks);
        console.log('🧮 [updateTestMarks] - New Percentage:', newPercentage);

        // 4. Update test attempt with new scores
        const updateAttemptSql = `
            UPDATE test_attempts 
            SET total_score = $1,
                percentage = $2,
                is_passed = $3,
                is_evaluated = true
            WHERE id = $4
            RETURNING *
        `;
        console.log('💾 [updateTestMarks] Updating test attempt...');
        const attemptResult = await query(updateAttemptSql, [
            newTotalScore,
            newPercentage,
            newPercentage >= 60, // Assuming 60% is passing
            attemptId
        ]);

        if (attemptResult.rows.length === 0) {
            console.log('❌ [updateTestMarks] Failed to update test attempt');
            return { success: false, message: 'Failed to update test attempt' };
        }

        const updatedAttempt = attemptResult.rows[0];
        console.log('✅ [updateTestMarks] Test attempt updated successfully:', updatedAttempt);

        console.log('🎉 [updateTestMarks] Complete success!');
        console.log('📊 [updateTestMarks] Final Results:');
        console.log('📊 [updateTestMarks] - Response Marks:', sanitizedMarks);
        console.log('📊 [updateTestMarks] - Total Score:', newTotalScore);
        console.log('📊 [updateTestMarks] - Percentage:', newPercentage);
        console.log('📊 [updateTestMarks] - Is Passed:', newPercentage >= 60);

        return {
            success: true,
            data: {
                response: updatedResponse,
                attempt: updatedAttempt,
                newTotalScore,
                newPercentage
            }
        };

    } catch (error) {
        console.error('💥 [updateTestMarks] Error occurred:');
        console.error('💥 [updateTestMarks] Error message:', error.message);
        console.error('💥 [updateTestMarks] Error stack:', error.stack);
        console.error('💥 [updateTestMarks] Error details:', {
            responseId,
            marksAwarded,
            explanation
        });

        return {
            success: false,
            message: 'Failed to update marks: ' + error.message
        };
    }
}