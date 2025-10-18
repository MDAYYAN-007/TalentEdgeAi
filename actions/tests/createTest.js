// actions/tests/createTest.js
'use server';

import { query } from '@/actions/db';

export async function createTest(testData, questions, authData, allowedUsers = []) {
    try {
        await query('BEGIN');

        // Calculate total marks
        const totalMarks = questions.reduce((sum, question) => sum + parseInt(question.marks), 0);

        // Prepare allowed users array - always include creator and OrgAdmin by default
        const defaultAllowedUsers = [
            authData.userId,
        ];

        const finalAllowedUsers = [...new Set([...defaultAllowedUsers, ...allowedUsers])];

        // Insert test
        const testSql = `
            INSERT INTO tests (
                org_id, created_by, title, description, 
                duration_minutes, total_marks, passing_marks,
                instructions,
                allowed_users
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
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
            testData.instructions,
            JSON.stringify(finalAllowedUsers)
        ]);

        const test = testResult.rows[0];

        // Insert questions (your existing code remains the same)
        for (let i = 0; i < questions.length; i++) {
            const question = questions[i];
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
                optionsJson,
                question.correctAnswer || null,
                correctOptionsJson,
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