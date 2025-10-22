'use server';

import { query } from '@/actions/db';

export async function getOrganizationDashboardData(orgId) {
    try {
        // Get organization basic stats
        const statsResult = await query(`
            SELECT 
                COUNT(*) as total_jobs,
                COUNT(CASE WHEN status = 'Active' THEN 1 END) as active_jobs,
                COUNT(CASE WHEN status = 'Draft' THEN 1 END) as draft_jobs,
                COUNT(CASE WHEN status = 'Closed' THEN 1 END) as closed_jobs
            FROM jobs 
            WHERE org_id = $1
        `, [orgId]);

        // Get application statistics
        const applicationsResult = await query(`
            SELECT 
                COUNT(*) as total_applications,
                COUNT(CASE WHEN a.status = 'submitted' THEN 1 END) as submitted,
                COUNT(CASE WHEN a.status = 'shortlisted' THEN 1 END) as shortlisted,
                COUNT(CASE WHEN a.status = 'test_scheduled' THEN 1 END) as test_scheduled,
                COUNT(CASE WHEN a.status = 'interview_scheduled' THEN 1 END) as interview_scheduled,
                COUNT(CASE WHEN a.status = 'rejected' THEN 1 END) as rejected,
                COUNT(CASE WHEN a.status = 'hired' THEN 1 END) as hired
            FROM applications a
            JOIN jobs j ON a.job_id = j.id
            WHERE j.org_id = $1
        `, [orgId]);

        // Get recent applications with applicant name from application_data
        const recentAppsResult = await query(`
            SELECT 
                a.id,
                a.application_data->>'name' as applicant_name,
                a.application_data->>'email' as applicant_email,
                a.status,
                a.applied_at,
                a.resume_score,
                j.title as job_title,
                j.department
            FROM applications a
            JOIN jobs j ON a.job_id = j.id
            WHERE j.org_id = $1
            ORDER BY a.applied_at DESC
            LIMIT 10
        `, [orgId]);

        // Get team members count
        const teamResult = await query(`
            SELECT COUNT(*) as team_members
            FROM users 
            WHERE org_id = $1 AND role IN ('HR', 'SeniorHR', 'OrgAdmin')
        `, [orgId]);

        // Get recent job postings
        const recentJobsResult = await query(`
            SELECT 
                id,
                title,
                department,
                job_type,
                work_mode,
                status,
                created_at
            FROM jobs 
            WHERE org_id = $1
            ORDER BY created_at DESC
            LIMIT 5
        `, [orgId]);

        const statsRow = statsResult.rows[0];
        const appsRow = applicationsResult.rows[0];
        const teamRow = teamResult.rows[0];

        return {
            success: true,
            data: {
                stats: {
                    total_jobs: parseInt(statsRow.total_jobs) || 0,
                    active_jobs: parseInt(statsRow.active_jobs) || 0,
                    draft_jobs: parseInt(statsRow.draft_jobs) || 0,
                    closed_jobs: parseInt(statsRow.closed_jobs) || 0,
                    total_applications: parseInt(appsRow.total_applications) || 0,
                    submitted_applications: parseInt(appsRow.submitted) || 0,
                    shortlisted_applications: parseInt(appsRow.shortlisted) || 0,
                    test_scheduled: parseInt(appsRow.test_scheduled) || 0,
                    interview_scheduled: parseInt(appsRow.interview_scheduled) || 0,
                    rejected_applications: parseInt(appsRow.rejected) || 0,
                    hired_applications: parseInt(appsRow.hired) || 0,
                    team_members: parseInt(teamRow.team_members) || 0
                },
                recentApplications: recentAppsResult.rows,
                recentJobs: recentJobsResult.rows
            }
        };

    } catch (error) {
        console.error('Error fetching organization dashboard data:', error);
        return {
            success: false,
            error: 'Failed to fetch organization dashboard data'
        };
    }
}