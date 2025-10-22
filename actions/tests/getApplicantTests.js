// actions/tests/getApplicantTests.js - Fixed version
'use server';

import { query } from '@/actions/db';

export async function getApplicantTests(userId) {
    try {
        console.log('🔍 Fetching tests for user:', userId);

        const correctedQuery = `
            SELECT 
                ta.id as assignment_id,
                ta.test_id,
                ta.application_id,
                ta.status as assignment_status,
                ta.assigned_at,
                ta.test_start_date,
                ta.test_end_date,
                ta.is_proctored,
                ta.proctoring_settings,
                
                t.title as test_title,
                t.description as test_description,
                t.duration_minutes,
                t.total_marks,
                t.passing_percentage as passing_marks,
                t.instructions,
                t.is_active,
                
                j.title as job_title,
                j.department,
                j.location,
                
                o.company_name,
                o.industry,
                
                a.status as application_status,
                a.applied_at,
                
                -- Get test attempt data if exists
                ta2.id as attempt_id,
                ta2.started_at,
                ta2.submitted_at,
                ta2.status as attempt_status,
                ta2.total_score,
                ta2.percentage,
                ta2.is_passed,
                ta2.is_evaluated,
                ta2.violation_score
                
            FROM test_assignments ta
            JOIN tests t ON ta.test_id = t.id
            JOIN applications a ON ta.application_id = a.id
            JOIN jobs j ON a.job_id = j.id
            JOIN organizations o ON j.org_id = o.id
            LEFT JOIN test_attempts ta2 ON ta.test_id = ta2.test_id 
                AND ta.application_id = ta2.application_id 
                AND ta2.applicant_id = $1
            WHERE a.applicant_id = $1
            ORDER BY ta.assigned_at DESC
        `;

        const result = await query(correctedQuery, [userId]);
        
        console.log('📊 Query result:', result);
        
        // Extract rows from the result object
        const tests = result.rows || result || [];
        console.log('📊 Found test assignments:', tests.length);
        console.log('📊 Sample test:', tests[0]);

        // Check if tests is an array before mapping
        if (!Array.isArray(tests)) {
            console.error('❌ Expected array but got:', typeof tests, tests);
            return {
                success: true,
                tests: []
            };
        }

        return {
            success: true,
            tests: result.rows
        };

    } catch (error) {
        console.error('❌ Error fetching applicant tests:', error);
        return {
            success: false,
            message: 'Failed to fetch tests: ' + error.message,
            tests: []
        };
    }
}