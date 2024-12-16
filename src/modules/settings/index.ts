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
