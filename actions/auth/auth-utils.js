'use server';

export async function getCurrentUser() {
    try {
        // Import dynamically to avoid circular dependencies
        const { verifyAuth } = await import('./auth');
        const { success, user } = await verifyAuth();

        if (success) {
            return user;
        }
        return null;
    } catch (error) {
        return null;
    }
}

