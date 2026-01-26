export const ADMIN_EMAILS = [
    'waltercito.94@gmail.com',
    'damarisapg@gmail.com'
];

/**
 * Checks if a given email belongs to a hardcoded list of admins.
 * This is a fallback/safety net mechanisms until RBAC via database profiles is fully established.
 */
export function isHardcodedAdmin(email: string | undefined | null): boolean {
    if (!email) return false;
    return ADMIN_EMAILS.includes(email);
}

/**
 * Validates strictly if an action is authorized for a specific user email.
 * @throws Error if not authorized
 */
export function requireAdmin(email: string | undefined | null) {
    if (!isHardcodedAdmin(email)) {
        throw new Error('No autorizado: Requiere privilegios de administrador.');
    }
}
