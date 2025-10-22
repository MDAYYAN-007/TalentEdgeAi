'use server';

import { getCurrentUser } from './auth-utils';
import { redirect } from 'next/navigation';

export async function protectPage() {
    const user = await getCurrentUser();

    if (!user) {
        redirect('/signin');
    }

    return user;
}