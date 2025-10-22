'use server';

import { query } from '@/actions/db';

export async function getUserDashboardData(userId, userRole) {
    try {
        let stats = {};
        let recentApplications = [];
        let upcomingInterviews = [];
        let pendingTests = [];
        let recommendedJobs = [];
        let organizationData = null;

        // Get basic user applications count and stats
        const appsResult = await query(`
            SELECT 
                COUNT(*) as total_applications,
                COUNT(CASE WHEN status = 'submitted' THEN 1 END) as submitted,
                COUNT(CASE WHEN status = 'shortlisted' THEN 1 END) as shortlisted,
                COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected,
                COUNT(CASE WHEN status = 'test_scheduled' THEN 1 END) as test_scheduled,
                COUNT(CASE WHEN status = 'interview_scheduled' THEN 1 END) as interview_scheduled
            FROM applications 
            WHERE applicant_id = $1
        `, [userId]);

        if (appsResult.rows.length > 0) {
            const row = appsResult.rows[0];
            stats.totalApplications = parseInt(row.total_applications) || 0;
            stats.submitted = parseInt(row.submitted) || 0;
            stats.shortlisted = parseInt(row.shortlisted) || 0;
            stats.rejected = parseInt(row.rejected) || 0;
            stats.testScheduled = parseInt(row.test_scheduled) || 0;
            stats.interviewScheduled = parseInt(row.interview_scheduled) || 0;
        }

        // Get recent applications (last 5)
        const recentAppsResult = await query(`
            SELECT 
                a.id,
                a.status,
                a.applied_at,
                a.resume_score,
                j.title as job_title,
                j.job_type,
                j.work_mode,
                j.location,
                o.company_name,
                o.industry
            FROM applications a
            JOIN jobs j ON a.job_id = j.id
            JOIN organizations o ON j.org_id = o.id
            WHERE a.applicant_id = $1
            ORDER BY a.applied_at DESC
            LIMIT 5
        `, [userId]);

        recentApplications = recentAppsResult.rows.map(row => ({
            id: row.id,
            job_title: row.job_title,
            company_name: row.company_name,
            status: row.status,
            applied_at: row.applied_at,
            resume_score: row.resume_score,
            job_type: row.job_type,
            work_mode: row.work_mode,
            location: row.location,
            industry: row.industry
        }));

        // Get upcoming interviews
        const interviewsResult = await query(`
            SELECT 
                i.id,
                i.scheduled_at,
                i.status,
                i.interview_type,
                i.meeting_link,
                i.duration_minutes,
                j.title as job_title,
                o.company_name
            FROM interviews i
            JOIN applications a ON i.application_id = a.id
            JOIN jobs j ON a.job_id = j.id
            JOIN organizations o ON j.org_id = o.id
            WHERE i.applicant_id = $1 
            AND i.scheduled_at > NOW() 
            AND i.status IN ('scheduled', 'confirmed')
            ORDER BY i.scheduled_at ASC
            LIMIT 5
        `, [userId]);

        upcomingInterviews = interviewsResult.rows.map(row => ({
            id: row.id,
            scheduled_at: row.scheduled_at,
            status: row.status,
            interview_type: row.interview_type,
            meeting_link: row.meeting_link,
            duration_minutes: row.duration_minutes,
            job_title: row.job_title,
            company_name: row.company_name
        }));

        // Get pending tests for the user - with fallback if tests table doesn't exist
        let testsResult = { rows: [] };
        try {
            testsResult = await query(`
                SELECT 
                    ta.id,
                    ta.status,
                    ta.assigned_at,
                    ta.test_start_date,
                    ta.test_end_date,
                    j.title as job_title,
                    o.company_name
                FROM test_assignments ta
                JOIN applications a ON ta.application_id = a.id
                JOIN jobs j ON a.job_id = j.id
                JOIN organizations o ON j.org_id = o.id
                WHERE a.applicant_id = $1 
                AND ta.status IN ('assigned', 'in_progress')
                ORDER BY ta.test_start_date ASC
                LIMIT 5
            `, [userId]);
        } catch (testError) {
            console.log('Tests query failed, continuing without test data:', testError.message);
        }

        pendingTests = testsResult.rows.map(row => ({
            id: row.id,
            status: row.status,
            assigned_at: row.assigned_at,
            test_start_date: row.test_start_date,
            test_end_date: row.test_end_date,
            job_title: row.job_title,
            company_name: row.company_name
        }));

        stats.totalTests = pendingTests.length;

        // Get recommended jobs - using only columns that exist in your schema
        const jobsResult = await query(`
            SELECT 
                j.id,
                j.title,
                j.job_type,
                j.work_mode,
                j.location,
                j.experience_level,
                j.min_salary,
                j.max_salary,
                j.currency,
                j.job_description,
                j.required_skills,
                j.created_at,
                o.company_name,
                o.industry,
                o.headquarters_location
            FROM jobs j
            JOIN organizations o ON j.org_id = o.id
            WHERE j.status = 'Active'
            ORDER BY j.created_at DESC
            LIMIT 8
        `);

        recommendedJobs = jobsResult.rows.map(row => ({
            id: row.id,
            title: row.title,
            job_type: row.job_type,
            work_mode: row.work_mode,
            location: row.location,
            experience_level: row.experience_level,
            min_salary: row.min_salary,
            max_salary: row.max_salary,
            currency: row.currency,
            job_description: row.job_description,
            required_skills: row.required_skills,
            company_name: row.company_name,
            industry: row.industry,
            headquarters_location: row.headquarters_location,
            created_at: row.created_at
        }));

        // For organization users (HR, SeniorHR, OrgAdmin), get organization stats
        if (['HR', 'SeniorHR', 'OrgAdmin'].includes(userRole)) {
            const orgResult = await query(`
                SELECT 
                    o.id,
                    o.company_name,
                    o.industry,
                    o.company_size,
                    o.headquarters_location,
                    (SELECT COUNT(*) FROM jobs WHERE org_id = o.id AND status = 'Active') as active_jobs,
                    (SELECT COUNT(*) FROM jobs WHERE org_id = o.id AND status = 'Draft') as draft_jobs,
                    (SELECT COUNT(*) FROM jobs WHERE org_id = o.id AND status = 'Closed') as closed_jobs,
                    (SELECT COUNT(*) FROM applications a 
                     JOIN jobs j ON a.job_id = j.id 
                     WHERE j.org_id = o.id) as total_applications,
                    (SELECT COUNT(*) FROM users WHERE org_id = o.id AND role IN ('HR', 'SeniorHR')) as team_members
                FROM organizations o
                JOIN users u ON o.id = u.org_id
                WHERE u.id = $1
            `, [userId]);

            if (orgResult.rows.length > 0) {
                const orgRow = orgResult.rows[0];
                organizationData = {
                    id: orgRow.id,
                    company_name: orgRow.company_name,
                    industry: orgRow.industry,
                    company_size: orgRow.company_size,
                    headquarters_location: orgRow.headquarters_location,
                    active_jobs: parseInt(orgRow.active_jobs) || 0,
                    draft_jobs: parseInt(orgRow.draft_jobs) || 0,
                    closed_jobs: parseInt(orgRow.closed_jobs) || 0,
                    total_applications: parseInt(orgRow.total_applications) || 0,
                    team_members: parseInt(orgRow.team_members) || 0
                };
            }
        }

        return {
            success: true,
            data: {
                stats,
                recentApplications,
                upcomingInterviews,
                pendingTests,
                recommendedJobs,
                organizationData
            }
        };

    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        return {
            success: false,
            error: 'Failed to fetch dashboard data',
            data: {
                stats: {
                    totalApplications: 0,
                    submitted: 0,
                    shortlisted: 0,
                    rejected: 0,
                    testScheduled: 0,
                    interviewScheduled: 0,
                    totalTests: 0
                },
                recentApplications: [],
                upcomingInterviews: [],
                pendingTests: [],
                recommendedJobs: [],
                organizationData: null
            }
        };
    }
}