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
});
