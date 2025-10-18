'use server';

import { query } from '@/actions/db';

export async function createTest(testData, questions, authData) {
    try {
        await query('BEGIN');

        // Calculate total marks
        const totalMarks = questions.reduce((sum, question) => sum + parseInt(question.marks), 0);

        // Insert test
        const testSql = `
            INSERT INTO tests (
                org_id, created_by, title, description, 
                duration_minutes, total_marks, passing_marks, 
                is_proctored, proctoring_settings, instructions
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *
        `;

        const testResult = await query(testSql, [
            authData.orgId,
            authData.userId,
            testData.title,
            testData.description,
            testData.durationMinutes,
            totalMarks,
            testData.passingMarks,
            testData.isProctored || false,
            JSON.stringify(testData.proctoringSettings || {}), // Convert to JSON string
            testData.instructions
        ]);

        const test = testResult.rows[0];

        // Insert questions
        for (let i = 0; i < questions.length; i++) {
            const question = questions[i];

            // Prepare JSON data for database
            const optionsJson = question.options ? JSON.stringify(question.options) : null;
            const correctOptionsJson = question.correctOptions ? JSON.stringify(question.correctOptions) : null;

            const questionSql = `
                INSERT INTO test_questions (
                    test_id, question_type, question_text, question_image_url, 
                    marks, options, correct_answer, correct_options, 
                    explanation, difficulty_level, order_index
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            `;

            await query(questionSql, [
                test.id,
                question.questionType,
                question.questionText,
                question.questionImageUrl || null,
                question.marks,
                optionsJson, // Use the JSON string
                question.correctAnswer || null,
                correctOptionsJson, // Use the JSON string
                question.explanation || null,
                question.difficultyLevel || 'medium',
                i
            ]);
        }

        await query('COMMIT');
        return { success: true, test, message: 'Test created successfully!' };

    } catch (error) {
        await query('ROLLBACK');
        console.error('Error creating test:', error);
        return { success: false, message: 'Failed to create test: ' + error.message };
    }
}