// actions/tests/assignMultipleTestsToApplicant.js
'use server';

import { query } from '@/actions/db';

export async function assignMultipleTestsToApplicant(testIds, applicationId, testStartDate, testEndDate, assignedBy, orgId, proctoringSettings) {
    try {
        // Verify application belongs to organization - using correct schema
        const applicationCheckSql = `
            SELECT a.id, a.applicant_id, a.status as current_status, a.job_id,
                   j.title as job_title, u.first_name, u.last_name, u.email
            FROM applications a
            INNER JOIN jobs j ON a.job_id = j.id
            INNER JOIN users u ON a.applicant_id = u.id
            WHERE a.id = $1 AND j.org_id = $2
        `;
        const applicationCheck = await query(applicationCheckSql, [applicationId, orgId]);

        if (applicationCheck.rows.length === 0) {
            return { success: false, message: 'Application not found or access denied' };
        }

        const application = applicationCheck.rows[0];
        const applicantName = `${application.first_name} ${application.last_name}`;
        const jobTitle = application.job_title;

        // Verify all tests belong to organization and are active
        const testsCheckSql = `
            SELECT id, title, duration_minutes FROM tests 
            WHERE id = ANY($1) AND org_id = $2 AND is_active = true
        `;
        const testsCheck = await query(testsCheckSql, [testIds, orgId]);

        if (testsCheck.rows.length !== testIds.length) {
            const foundTestIds = testsCheck.rows.map(row => row.id);
            const missingTests = testIds.filter(id => !foundTestIds.includes(id));
            return {
                success: false,
                message: `Some tests not found, inactive, or access denied. Missing test IDs: ${missingTests.join(', ')}`
            };
        }

        const tests = testsCheck.rows;

        // Get recruiter name for logging
        const recruiterSql = `
            SELECT first_name, last_name FROM users WHERE id = $1 AND org_id = $2
        `;
        const recruiterResult = await query(recruiterSql, [assignedBy, orgId]);

        const recruiterName = recruiterResult.rows[0] ?
            `${recruiterResult.rows[0].first_name} ${recruiterResult.rows[0].last_name}` :
            'Unknown Recruiter';

        const assignments = [];
        const assignedTestTitles = [];

        // Process each test
        for (const test of tests) {
            const testId = test.id;
            const testTitle = test.title;
            const testDuration = test.duration_minutes;

            // Calculate minimum required time difference (test duration + 5 minutes buffer)
            const minTimeDifference = (testDuration + 5) * 60 * 1000;
            const startDate = new Date(testStartDate);
            const endDate = new Date(testEndDate);
            const actualTimeDifference = endDate - startDate;

            if (actualTimeDifference < minTimeDifference) {
                const requiredMinutes = Math.ceil(minTimeDifference / (60 * 1000));
                return {
                    success: false,
                    message: `Test window too short for "${testTitle}". For a ${testDuration}-minute test, you need at least ${requiredMinutes} minutes between start and end time.`
                };
            }

            // Check for existing assignment
            const existingAssignmentSql = `
                SELECT id, status FROM test_assignments 
                WHERE test_id = $1 AND application_id = $2
            `;
            const existingAssignment = await query(existingAssignmentSql, [testId, applicationId]);

            if (existingAssignment.rows.length > 0) {
                // Update existing assignment
                const updateSql = `
                    UPDATE test_assignments 
                    SET test_start_date = $1,
                        test_end_date = $2,
                        status = 'assigned',
                        is_proctored = $3,
                        proctoring_settings = $4,
                        updated_at = NOW(),
                        assigned_by = $5
                    WHERE test_id = $6 AND application_id = $7
                    RETURNING id
                `;
                const assignmentResult = await query(updateSql, [
                    testStartDate,
                    testEndDate,
                    proctoringSettings.isProctored,
                    JSON.stringify(proctoringSettings.proctoringSettings),
                    assignedBy,
                    testId,
                    applicationId
                ]);
                assignments.push({
                    id: assignmentResult.rows[0].id,
                    testId: testId,
                    testTitle: testTitle,
                    action: 'updated'
                });
            } else {
                // Create new assignment
                const insertSql = `
                    INSERT INTO test_assignments 
                    (test_id, application_id, assigned_by, test_start_date, test_end_date, status, assigned_at, is_proctored, proctoring_settings)
                    VALUES ($1, $2, $3, $4, $5, 'assigned', NOW(), $6, $7)
                    RETURNING id
                `;
                const assignmentResult = await query(insertSql, [
                    testId,
                    applicationId,
                    assignedBy,
                    testStartDate,
                    testEndDate,
                    proctoringSettings.isProctored,
                    JSON.stringify(proctoringSettings.proctoringSettings)
                ]);
                assignments.push({
                    id: assignmentResult.rows[0].id,
                    testId: testId,
                    testTitle: testTitle,
                    action: 'created'
                });
            }

            assignedTestTitles.push(testTitle);

            // Handle test attempts - check if exists first
            const attemptCheckSql = `
                SELECT id FROM test_attempts 
                WHERE test_id = $1 AND application_id = $2
            `;
            const attemptCheck = await query(attemptCheckSql, [testId, applicationId]);

            if (attemptCheck.rows.length === 0) {
                // Create new attempt record
                const attemptSql = `
                    INSERT INTO test_attempts 
                    (test_id, application_id, applicant_id, status, created_at)
                    VALUES ($1, $2, $3, 'not_started', NOW())
                `;
                await query(attemptSql, [testId, applicationId, application.applicant_id]);
            } else {
                // Update existing attempt
                const updateAttemptSql = `
                    UPDATE test_attempts 
                    SET updated_at = NOW(),
                        status = 'not_started'
                    WHERE test_id = $1 AND application_id = $2
                `;
                await query(updateAttemptSql, [testId, applicationId]);
            }
        }

        // Update application status to 'test_scheduled' if not already
        if (application.current_status !== 'test_scheduled') {
            const updateApplicationStatusSql = `
                UPDATE applications 
                SET status = 'test_scheduled', 
                    updated_at = CURRENT_TIMESTAMP 
                WHERE id = $1
            `;
            await query(updateApplicationStatusSql, [applicationId]);

            // Log application status change in application_status_history
            const applicationHistorySql = `
                INSERT INTO application_status_history 
                (application_id, old_status, new_status, performed_by, notes, performed_at)
                VALUES ($1, $2, $3, $4, $5, NOW())
            `;
            await query(applicationHistorySql, [
                applicationId,
                application.current_status,
                'test_scheduled',
                assignedBy,
                `${assignedTestTitles.length} test(s) assigned by ${recruiterName}: ${assignedTestTitles.join(', ')}`
            ]);
        } else {
            // Log that tests were added to existing test_scheduled application
            const applicationHistorySql = `
                INSERT INTO application_status_history 
                (application_id, old_status, new_status, performed_by, notes, performed_at)
                VALUES ($1, $2, $3, $4, $5, NOW())
            `;
            await query(applicationHistorySql, [
                applicationId,
                'test_scheduled',
                'test_scheduled',
                assignedBy,
                `Additional ${assignedTestTitles.length} test(s) assigned by ${recruiterName}: ${assignedTestTitles.join(', ')}`
            ]);
        }

        const updatedCount = assignments.filter(a => a.action === 'updated').length;
        const createdCount = assignments.filter(a => a.action === 'created').length;

        return {
            success: true,
            message: `Successfully assigned ${assignments.length} test(s) to ${applicantName}. ${createdCount} new assignment(s), ${updatedCount} rescheduled.`,
            assignmentCount: assignments.length,
            assignments: assignments,
            updatedCount: updatedCount,
            createdCount: createdCount
        };
    } catch (error) {
        console.error('Error assigning multiple tests to applicant:', error);
        return { success: false, message: 'Failed to assign tests' };
    }
}