/*
 * (c) Copyright Ascensio System SIA 2025
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

import { defineModule } from "@directus/extensions-sdk";
import SettingsComponent from "./settings.vue";

export default defineModule({
	id: "onlyoffice_module",
	name: "ONLYOFFICE",
	icon: "description",
	routes: [
		{
			path: "",
			props: true,
			component: SettingsComponent,
		},
	],
	preRegisterCheck(user, permissions) {
		const admin = user.admin_access;
		if (admin) return true;

		const access = permissions['onlyoffice_settings']?.['read']?.access;
		return access === 'partial' || access === 'full';
	}
});
