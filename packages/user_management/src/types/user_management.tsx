import { UserWithRoles } from "./firecms_user";
import { Role } from "./roles";
import { PermissionsBuilder } from "@firecms/core";

export type UserManagement<USER extends UserWithRoles = UserWithRoles> = {

    loading: boolean;

    /**
     * The user currently logged in, in the user management system.
     * This is the same user that is logged in the Authenticator, but with the roles
     * and permissions loaded.
     */
    loggedInUser: USER | undefined;

    users: USER[];
    saveUser: (user: USER) => Promise<USER>;
    deleteUser: (user: USER) => Promise<void>;

    roles: Role[];
    saveRole: (role: Role) => Promise<void>;
    deleteRole: (role: Role) => Promise<void>;

    /**
     * Maximum number of users that can be created.
     */
    usersLimit?: number;

    /**
     * Can the logged user edit roles?
     */
    canEditRoles?: boolean;

    /**
     * Include a button to create default roles, in case there are no roles in the system.
     */
    allowDefaultRolesCreation?: boolean;

    /**
     * Include the collection config permissions in the user management system.
     */
    includeCollectionConfigPermissions?: boolean;

    /**
     * Get a permissions builder that defines which operations can be performed by a user in a collection.
     * The permission builder generated should be based in the user roles and the collection config.
     */
    collectionPermissions: PermissionsBuilder;

};