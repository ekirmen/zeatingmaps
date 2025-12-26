/**
 * RLS Helper Functions
 * Client-side permission checking utilities
 */

import { supabase } from '../supabaseClient';

/**
 * Role levels mapping
 */
export const ROLE_LEVELS = {
    super_admin: 100,
    admin: 80,
    manager: 60,
    support: 40,
    viewer: 20,
};

/**
 * Get current user's profile with role and permissions
 */
export async function getCurrentUserProfile() {
    try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return null;
        }

        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (profileError) {
            console.error('[RLS] Error fetching profile:', profileError);
            return null;
        }

        return profile;
    } catch (error) {
        console.error('[RLS] Error getting current user profile:', error);
        return null;
    }
}

/**
 * Check if user has a specific role
 */
export async function hasRole(requiredRole) {
    const profile = await getCurrentUserProfile();
    if (!profile) return false;

    return profile.role === requiredRole;
}

/**
 * Check if user has minimum role level
 */
export async function hasRoleLevel(requiredLevel) {
    const profile = await getCurrentUserProfile();
    if (!profile) return false;

    const userLevel = ROLE_LEVELS[profile.role] || 0;
    return userLevel >= requiredLevel;
}

/**
 * Check if user has a specific permission
 */
export async function hasPermission(permission) {
    const profile = await getCurrentUserProfile();
    if (!profile) return false;

    // Super admin has all permissions
    if (profile.role === 'super_admin') return true;

    // Check custom permissions
    const permissions = profile.permisos || {};
    return permissions[permission] === true;
}

/**
 * Check if user can edit a resource
 */
export function canUserEdit(user, resource) {
    if (!user) return false;

    const userLevel = ROLE_LEVELS[user.role] || 0;

    // Super admin and admin can edit everything
    if (userLevel >= 80) return true;

    // Manager can edit within their tenant
    if (userLevel >= 60 && user.tenant_id === resource.tenant_id) return true;

    // User can edit their own resources
    if (resource.user_id === user.id) return true;

    return false;
}

/**
 * Check if user can delete a resource
 */
export function canUserDelete(user, resource) {
    if (!user) return false;

    const userLevel = ROLE_LEVELS[user.role] || 0;

    // Only admin and above can delete
    if (userLevel >= 80 && user.tenant_id === resource.tenant_id) return true;

    return false;
}

/**
 * Check if user can view a resource
 */
export function canUserView(user, resource) {
    if (!user) return false;

    const userLevel = ROLE_LEVELS[user.role] || 0;

    // Super admin can view everything
    if (userLevel >= 100) return true;

    // Users can view resources in their tenant
    if (user.tenant_id === resource.tenant_id) return true;

    // Users can view their own resources
    if (resource.user_id === user.id) return true;

    return false;
}

/**
 * Get user's accessible tenant IDs
 */
export async function getAccessibleTenants() {
    const profile = await getCurrentUserProfile();
    if (!profile) return [];

    const userLevel = ROLE_LEVELS[profile.role] || 0;

    // Super admin can access all tenants
    if (userLevel >= 100) {
        const { data, error } = await supabase
            .from('tenants')
            .select('id');

        if (error) {
            console.error('[RLS] Error fetching tenants:', error);
            return [];
        }

        return data.map(t => t.id);
    }

    // Other users can only access their tenant
    return profile.tenant_id ? [profile.tenant_id] : [];
}

/**
 * Filter resources by user permissions
 */
export function filterByPermissions(user, resources, action = 'view') {
    if (!user || !resources) return [];

    const userLevel = ROLE_LEVELS[user.role] || 0;

    // Super admin can access everything
    if (userLevel >= 100) return resources;

    // Filter based on action
    return resources.filter(resource => {
        switch (action) {
            case 'view':
                return canUserView(user, resource);
            case 'edit':
                return canUserEdit(user, resource);
            case 'delete':
                return canUserDelete(user, resource);
            default:
                return false;
        }
    });
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated() {
    const { data: { user } } = await supabase.auth.getUser();
    return !!user;
}

/**
 * Get user's role display name
 */
export function getRoleDisplayName(role) {
    const roleNames = {
        super_admin: 'Super Administrador',
        admin: 'Administrador',
        manager: 'Gerente',
        support: 'Soporte',
        viewer: 'Visualizador',
    };

    return roleNames[role] || role;
}

/**
 * Get role color for UI
 */
export function getRoleColor(role) {
    const colors = {
        super_admin: 'red',
        admin: 'orange',
        manager: 'blue',
        support: 'purple',
        viewer: 'green',
    };

    return colors[role] || 'default';
}

export default {
    ROLE_LEVELS,
    getCurrentUserProfile,
    hasRole,
    hasRoleLevel,
    hasPermission,
    canUserEdit,
    canUserDelete,
    canUserView,
    getAccessibleTenants,
    filterByPermissions,
    isAuthenticated,
    getRoleDisplayName,
    getRoleColor,
};
