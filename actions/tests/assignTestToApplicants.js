'use server';

import { query } from '@/actions/db';

export async function assignTestToApplicants(testId, applicationIds, testStartDate, testEndDate, assignedBy, orgId, proctoringSettings) {
    try {
        const testCheckSql = `
            SELECT id, duration_minutes, title FROM tests 
            WHERE id = $1 AND org_id = $2 AND is_active = true
        `;
        const testCheck = await query(testCheckSql, [testId, orgId]);

        if (testCheck.rows.length === 0) {
            return { success: false, message: 'Test not found or inactive' };
        }

        const testDuration = testCheck.rows[0].duration_minutes;
        const testTitle = testCheck.rows[0].title;

        const minTimeDifference = (testDuration + 5) * 60 * 1000;
        const startDate = new Date(testStartDate);
        const endDate = new Date(testEndDate);
        const actualTimeDifference = endDate - startDate;

        if (actualTimeDifference < minTimeDifference) {
            const requiredMinutes = Math.ceil(minTimeDifference / (60 * 1000));
            return {
                success: false,
                message: `Test window too short. For a ${testDuration}-minute test, you need at least ${requiredMinutes} minutes between start and end time.`
            };
        }

        const applicationsCheckSql = `
            SELECT a.id, a.applicant_id, a.status as current_status
            FROM applications a
            INNER JOIN jobs j ON a.job_id = j.id
            WHERE a.id = ANY($1) AND j.org_id = $2
        `;
        const applicationsCheck = await query(applicationsCheckSql, [applicationIds, orgId]);

        if (applicationsCheck.rows.length !== applicationIds.length) {
            return { success: false, message: 'Some applications not found or access denied' };
        }

        const recruiterSql = `
            SELECT first_name, last_name FROM users WHERE id = $1 AND org_id = $2
        `;
        const recruiterResult = await query(recruiterSql, [assignedBy, orgId]);

        const recruiterName = recruiterResult.rows[0] ?
            `${recruiterResult.rows[0].first_name} ${recruiterResult.rows[0].last_name}` :
            'Unknown Recruiter';

        const existingAssignmentsSql = `
            SELECT application_id FROM test_assignments 
            WHERE test_id = $1 AND application_id = ANY($2)
        `;
        const existingAssignments = await query(existingAssignmentsSql, [testId, applicationIds]);
        const existingApplicationIds = existingAssignments.rows.map(row => row.application_id);

        const assignments = [];

        for (const applicationId of applicationIds) {
            const application = applicationsCheck.rows.find(app => app.id === applicationId);

            if (application) {
                if (existingApplicationIds.includes(applicationId)) {
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
                    assignments.push(assignmentResult.rows[0].id);
                } else {
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
                    assignments.push(assignmentResult.rows[0].id);
                }

                const attemptCheckSql = `
                    SELECT id FROM test_attempts 
                    WHERE test_id = $1 AND application_id = $2
                `;
                const attemptCheck = await query(attemptCheckSql, [testId, applicationId]);

                if (attemptCheck.rows.length === 0) {
                    const attemptSql = `
                        INSERT INTO test_attempts 
                        (test_id, application_id, applicant_id, status, created_at)
                        VALUES ($1, $2, $3, 'not_started', NOW())
                    `;
                    await query(attemptSql, [testId, applicationId, application.applicant_id]);
                } else {
                    const updateAttemptSql = `
                        UPDATE test_attempts 
                        SET updated_at = NOW(),
                            status = 'not_started'
                        WHERE test_id = $1 AND application_id = $2
                    `;
                    await query(updateAttemptSql, [testId, applicationId]);
                }
            }
        }

        const updateApplicationStatusSql = `
            UPDATE applications 
            SET status = 'test_scheduled', 
                updated_at = CURRENT_TIMESTAMP 
            WHERE id = ANY($1)
        `;
        await query(updateApplicationStatusSql, [applicationIds]);

        const applicationHistorySql = `
            INSERT INTO application_status_history 
            (application_id, old_status, new_status, performed_by, notes, performed_at)
            SELECT 
                id, 
                status, 
                'test_scheduled', 
                $1, 
                $2,
                NOW()
            FROM applications 
            WHERE id = ANY($3)
        `;
        await query(applicationHistorySql, [
            assignedBy,
            `Test "${testTitle}" assigned by ${recruiterName}`,
            applicationIds
        ]);

        return {
            success: true,
            message: `Test assigned to ${assignments.length} applicant(s) successfully`,
            assignmentCount: assignments.length
        };
    } catch (error) {
        console.error('Error assigning test to applicants:', error);
        return { success: false, message: 'Failed to assign test' };
    }
}