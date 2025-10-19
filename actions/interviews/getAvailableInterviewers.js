'use server';

import { query } from '@/actions/db';

export async function getAvailableInterviewers(organizationId) {
  const result = await query(
    `
      SELECT u.id, u.email, CONCAT(u.first_name, ' ', u.last_name) AS name, u.role
      FROM users u
      WHERE u.org_id = $1 AND u.role IN ('SeniorHR','HR','OrgAdmin')
    `,
    [organizationId]
  );

  if (result.error) {
    console.error('Error fetching available interviewers:', result.error);
    return { success: false, message: 'Failed to fetch interviewers' };
  }

  return { success: true, interviewers: result.rows };
}