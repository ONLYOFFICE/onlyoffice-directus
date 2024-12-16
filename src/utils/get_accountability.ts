/*
 * (c) Copyright Ascensio System SIA 2024
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { EndpointExtensionContext } from "@directus/extensions";
import { Accountability } from "@directus/types";

export async function getAccountability(
    context: EndpointExtensionContext,
	userId?: string | null,
): Promise<Accountability> {
	if (!userId) {
		throw new Error("Missing user id");
	}

    const { services, getSchema } = context;
    const { UsersService, RolesService, AccessService, PoliciesService } = services;

    const schema = await getSchema();
    const usersService = new UsersService({
        schema: schema
    });
    const rolesService = new RolesService({
        schema: schema
    });
    const accessService = new AccessService({
        schema: schema
    });
    const policiesService = new PoliciesService({
        schema: schema
    });

    const user = await usersService.readOne(userId);

    if (user == null || user.status != "active") {
        throw new Error("User is not active");
    }

    const accountability = {
        user: user.id,
        role: user.role,
        roles: ([] as string[]),
        admin: false,
        app: false,
        ip: null,
        userAgent: "ONLYOFFICE"
    };

    accountability.roles = await fetchRolesTree(user.role, rolesService);

    const access = await fetchGlobalAccess(accountability.user, accountability.roles, accessService, policiesService);
    
    accountability.admin = access.admin;
    accountability.app = access.app;

	return accountability;
}

async function fetchRolesTree(start: string | null, rolesService: any): Promise<string[]> {
	if (!start) return [];

	let parent: string | null = start;
	const roles: string[] = [];

	while (parent) {
		const role: any = await rolesService.readOne(parent);

		if (!role) {
			break;
		}

		roles.push(role.id);

		if (role.parent && roles.includes(role.parent) === true) {
			roles.reverse();
            throw new Error("Infinite role loop");
		}

		parent = role.parent;
	}

	roles.reverse();

	return roles;
}

async function fetchGlobalAccess(userId: string, roleIds: string[] | null, accessService: any, policiesService: any): Promise<any> {
    const rolePolicies = await fetchRolePolicies(roleIds, accessService);
    const userPolicies = await fetchUserPolicies(userId, accessService);

    const uniquePolicies = [...new Set(rolePolicies.concat(userPolicies))];

    const queryResult = await policiesService.readByQuery({
        fields: ["admin_access", "app_access"],
        filter: { id: { _in: uniquePolicies } },
    });

    const result = {
        app: false,
        admin: false,
    }

    for (const { admin_access, app_access } of queryResult) {
        result.admin ||= admin_access;
        result.app ||= app_access;
    }

    return result;
}

async function fetchRolePolicies(roleIds: string[] | null, accessService: any): Promise<string[]> {
    if (!roleIds || !roleIds.length) return [];

    const queryResult = await accessService.readByQuery({
        fields: ["policy"],
        filter: { role: { _in: roleIds } },
    });

    return queryResult.map((q: { policy: string; }) => q.policy);
}

async function fetchUserPolicies(userId: string | null, accessService: any): Promise<string[]> {
    if (!userId) return [];

    const queryResult = await accessService.readByQuery({
        fields: ["policy"],
        filter: { role: { _eq: userId } },
    });

    return queryResult.map((q: { policy: string; }) => q.policy);
}