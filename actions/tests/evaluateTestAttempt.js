'use server';

import { query } from '@/actions/db';
import { evaluateWithAI } from './evaluateWithAI';

export async function evaluateTestAttempt(attemptId) {
    console.log('🔍 [evaluateTestAttempt] Starting evaluation for attemptId:', attemptId);

    try {
        // 1. Get test attempt details
        console.log('📋 [Step 1] Fetching test attempt details...');
        const attemptSql = `
            SELECT ta.*, t.passing_percentage, t.total_marks
            FROM test_attempts ta
            JOIN tests t ON ta.test_id = t.id
            WHERE ta.id = $1
        `;
        const attemptResult = await query(attemptSql, [attemptId]);
        console.log('📋 [Step 1] Query result:', attemptResult.rows.length, 'rows found');

        if (attemptResult.rows.length === 0) {
            console.log('❌ [Step 1] Test attempt not found');
            return { success: false, message: 'Test attempt not found' };
        }

        const attempt = attemptResult.rows[0];
        console.log('📋 [Step 1] Attempt details:', {
            id: attempt.id,
            test_id: attempt.test_id,
            application_id: attempt.application_id,
            applicant_id: attempt.applicant_id,
            status: attempt.status,
            passing_percentage: attempt.passing_percentage,
            total_marks: attempt.total_marks
        });

        // 2. Get all responses for this attempt
        console.log('📝 [Step 2] Fetching test responses with correct_options...');
        const responsesSql = `
            SELECT 
                tr.*, 
                tq.question_type, 
                tq.marks, 
                tq.correct_options,
                tq.correct_answer,
                tq.options,
                tq.question_text
            FROM test_responses tr
            JOIN test_questions tq ON tr.question_id = tq.id
            WHERE tr.attempt_id = $1
        `;
        const responsesResult = await query(responsesSql, [attemptId]);
        const responses = responsesResult.rows;
        console.log('📝 [Step 2] Found', responses.length, 'responses');

        if (responses.length === 0) {
            console.log('❌ [Step 2] No responses found for this attempt');
            return { success: false, message: 'No responses found for this attempt' };
        }

        let totalScore = 0;
        let totalPossibleMarks = 0;
        const evaluatedQuestions = [];
        const aiEvaluationQueue = [];

        // 3. Evaluate each response
        console.log('⚡ [Step 3] Starting evaluation of each response...');
        for (let i = 0; i < responses.length; i++) {
            const response = responses[i];
            console.log(`\n📄 [Response ${i + 1}] Evaluating Question ${response.question_id}:`, {
                question_type: response.question_type,
                selected_options: response.selected_options,
                correct_options: response.correct_options,
                marks: response.marks
            });

            totalPossibleMarks += parseFloat(response.marks);
            let marksAwarded = 0;
            let isAutoGraded = true;
            let aiFeedback = null;
            let explanation = null;
            let aiConfidence = null;

            switch (response.question_type) {
                case 'mcq_single':
                    console.log('🔘 [MCQ Single] Evaluating...');
                    console.log('🔘 Selected:', response.selected_options);
                    console.log('🔘 Correct Options:', response.correct_options);

                    if (response.selected_options && response.selected_options.length > 0 && response.correct_options) {
                        if (response.selected_options[0] === response.correct_options[0]) {
                            marksAwarded = parseFloat(response.marks);
                            explanation = 'Correct answer selected';
                            console.log('✅ [MCQ Single] CORRECT - Marks awarded:', marksAwarded);
                        } else {
                            explanation = `Incorrect. Selected: ${response.selected_options[0]}, Expected: ${response.correct_options[0]}`;
                            console.log('❌ [MCQ Single] INCORRECT - Selected:', response.selected_options[0], 'Expected:', response.correct_options[0]);
                        }
                    } else {
                        explanation = 'Missing selected options or correct options';
                        console.log('❌ [MCQ Single] Missing selected_options or correct_options');
                    }
                    break;

                case 'mcq_multiple':
                    console.log('🔘🔘 [MCQ Multiple] Evaluating...');
                    console.log('🔘🔘 Selected:', response.selected_options);
                    console.log('🔘🔘 Correct Options:', response.correct_options);

                    if (response.selected_options && response.correct_options) {
                        const selected = new Set(response.selected_options);
                        const correct = new Set(response.correct_options);

                        console.log('🔘🔘 Selected Set:', [...selected]);
                        console.log('🔘🔘 Correct Set:', [...correct]);

                        // Calculate correct and incorrect selections
                        const correctSelections = [...selected].filter(opt => correct.has(opt)).length;
                        const incorrectSelections = [...selected].filter(opt => !correct.has(opt)).length;
                        const totalCorrectOptions = correct.size;

                        console.log('🔘🔘 Correct selections:', correctSelections);
                        console.log('🔘🔘 Incorrect selections:', incorrectSelections);
                        console.log('🔘🔘 Total correct options:', totalCorrectOptions);

                        if (totalCorrectOptions > 0) {
                            // Method 1: Proportional marking with penalty for wrong answers
                            const marksPerOption = parseFloat(response.marks) / totalCorrectOptions;
                            const baseScore = correctSelections * marksPerOption;

                            // Penalize for incorrect selections (deduct marks for wrong answers)
                            const penalty = incorrectSelections * marksPerOption;

                            marksAwarded = Math.max(0, baseScore - penalty);

                            console.log('🔘🔘 Marks per option:', marksPerOption);
                            console.log('🔘🔘 Base score:', baseScore);
                            console.log('🔘🔘 Penalty:', penalty);
                            console.log('🔘🔘 Final marks awarded:', marksAwarded);

                            explanation = `Selected ${correctSelections}/${totalCorrectOptions} correct options`;
                            if (incorrectSelections > 0) {
                                explanation += `, ${incorrectSelections} incorrect options (penalty applied)`;
                            }

                            // Round to 2 decimal places for cleaner display
                            marksAwarded = Math.round(marksAwarded * 100) / 100;
                        } else {
                            explanation = 'No correct options defined';
                            console.log('❌ [MCQ Multiple] No correct options defined');
                        }

                        console.log('✅ [MCQ Multiple] Marks awarded:', marksAwarded);
                    } else {
                        explanation = 'Missing selected options or correct options';
                        console.log('❌ [MCQ Multiple] Missing selected_options or correct_options');
                    }
                    break;

                case 'text':
                case 'coding':
                    console.log(`🤖 [${response.question_type.toUpperCase()}] Queueing for AI evaluation`);
                    marksAwarded = 0;
                    isAutoGraded = false;
                    aiFeedback = 'Pending AI evaluation';
                    explanation = 'Queued for AI evaluation';

                    // Add to AI evaluation queue
                    aiEvaluationQueue.push({
                        responseId: response.id,
                        questionType: response.question_type,
                        marks: response.marks
                    });
                    break;

                default:
                    console.log('❓ [Unknown Question Type]', response.question_type);
                    marksAwarded = 0;
                    explanation = 'Unknown question type';
            }

            // Update response with evaluation (for non-AI questions)
            if (response.question_type !== 'text' && response.question_type !== 'coding') {
                console.log(`💾 [Response ${i + 1}] Updating database with marks: ${marksAwarded}`);
                const updateResponseSql = `
                    UPDATE test_responses 
                    SET marks_awarded = $1, 
                        is_auto_graded = $2,
                        ai_feedback = $3,
                        explanation = $4,
                        ai_confidence_score = $5
                    WHERE id = $6
                `;
                await query(updateResponseSql, [
                    marksAwarded,
                    isAutoGraded,
                    aiFeedback,
                    explanation,
                    aiConfidence,
                    response.id
                ]);
                console.log(`💾 [Response ${i + 1}] Database updated successfully`);
            }

            totalScore += marksAwarded;
            evaluatedQuestions.push({
                questionId: response.question_id,
                marksAwarded,
                possibleMarks: parseFloat(response.marks),
                isAutoGraded,
                questionType: response.question_type,
                responseId: response.id
            });

            console.log(`📊 [Response ${i + 1}] Running totals - Score: ${totalScore}, Possible: ${totalPossibleMarks}`);
        }

        // 4. Process AI evaluations for text and coding questions
        if (aiEvaluationQueue.length > 0) {
            console.log(`\n🤖 [Step 3.5] Processing ${aiEvaluationQueue.length} AI evaluations...`);

            for (const aiItem of aiEvaluationQueue) {
                try {
                    console.log(`🤖 Evaluating response ${aiItem.responseId} (${aiItem.questionType})...`);

                    const aiResult = await evaluateWithAI(aiItem.responseId);

                    if (aiResult.success) {
                        const aiData = aiResult.data;
                        totalScore += aiData.marksAwarded;

                        // Update the evaluated questions array
                        const questionIndex = evaluatedQuestions.findIndex(q => q.responseId === aiItem.responseId);
                        if (questionIndex !== -1) {
                            evaluatedQuestions[questionIndex].marksAwarded = aiData.marksAwarded;
                            evaluatedQuestions[questionIndex].isAutoGraded = false;
                            evaluatedQuestions[questionIndex].aiFeedback = aiData.aiFeedback;
                            evaluatedQuestions[questionIndex].aiConfidence = aiData.confidence;
                        }

                        console.log(`✅ [AI Evaluation] Response ${aiItem.responseId} - Score: ${aiData.marksAwarded}/${aiItem.marks}`);
                    } else {
                        console.log(`❌ [AI Evaluation] Failed for response ${aiItem.responseId}:`, aiResult.message);

                        // Mark as failed AI evaluation but don't add to score
                        const questionIndex = evaluatedQuestions.findIndex(q => q.responseId === aiItem.responseId);
                        if (questionIndex !== -1) {
                            evaluatedQuestions[questionIndex].aiFeedback = 'AI evaluation failed';
                            evaluatedQuestions[questionIndex].explanation = 'Failed to get AI evaluation';
                        }
                    }

                    // Add delay to avoid rate limiting
                    await new Promise(resolve => setTimeout(resolve, 1000));

                } catch (error) {
                    console.error(`💥 [AI Evaluation] Error for response ${aiItem.responseId}:`, error);
                }
            }

            console.log('🤖 [Step 3.5] AI evaluations completed');
        }

        // 5. Calculate percentage and pass status
        console.log('\n📈 [Step 4] Calculating final results...');
        console.log('📈 Total Score:', totalScore);
        console.log('📈 Total Possible Marks:', totalPossibleMarks);

        const percentage = totalPossibleMarks > 0 ? (totalScore / totalPossibleMarks) * 100 : 0;
        const isPassed = percentage >= attempt.passing_percentage;

        console.log('📈 Percentage:', percentage);
        console.log('📈 Passing Marks Required:', attempt.passing_percentage);
        console.log('📈 Is Passed?', isPassed);

        // 6. Update test attempt with results
        console.log('💾 [Step 5] Updating test attempt in database...');
        const updateAttemptSql = `
            UPDATE test_attempts 
            SET total_score = $1,
                percentage = $2,
                is_passed = $3,
                "is_evaluated" = true
            WHERE id = $4
        `;
        await query(updateAttemptSql, [
            totalScore,
            percentage,
            isPassed,
            attemptId
        ]);
        console.log('💾 [Step 5] Test attempt updated successfully');

        // 7. Count questions that need AI evaluation (those that failed)
        const needsAIEvaluation = evaluatedQuestions.filter(q =>
            (q.questionType === 'text' || q.questionType === 'coding') &&
            q.marksAwarded === 0 &&
            (!q.aiFeedback || q.aiFeedback.includes('failed') || q.aiFeedback.includes('Pending'))
        ).length;

        const aiEvaluated = evaluatedQuestions.filter(q =>
            (q.questionType === 'text' || q.questionType === 'coding') &&
            q.marksAwarded > 0
        ).length;

        console.log('🤖 [Step 6] AI evaluation summary:', {
            totalAIQuestions: aiEvaluationQueue.length,
            successfullyEvaluated: aiEvaluated,
            needsManualReview: needsAIEvaluation
        });

        const finalResult = {
            success: true,
            data: {
                totalScore,
                totalPossibleMarks,
                percentage: Math.round(percentage * 100) / 100,
                isPassed,
                evaluatedQuestions: evaluatedQuestions.length,
                needsAIEvaluation,
                aiEvaluated,
                passingMarks: attempt.passing_percentage,
                autoGradedScore: totalScore,
                autoGradedPercentage: Math.round(percentage * 100) / 100,
                mcqEvaluated: evaluatedQuestions.filter(q => q.questionType.includes('mcq')).length,
                aiQuestions: aiEvaluationQueue.length
            }
        };

        console.log('🎉 [evaluateTestAttempt] Evaluation completed successfully:', finalResult);
        return finalResult;

    } catch (error) {
        console.error('💥 [evaluateTestAttempt] Error evaluating test attempt:', error);
        console.error('💥 Error stack:', error.stack);
        return {
            success: false,
            message: 'Failed to evaluate test attempt: ' + error.message
        };
    }
}