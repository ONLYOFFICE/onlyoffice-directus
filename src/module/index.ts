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
	options: [
		{
			field: 'responseFormat',
			name: 'Response',
			type: 'string',
			meta: {
				interface: 'system-display-template',
				options: {
					collectionField: 'collection',
					placeholder: '{{ field }}',
				},
				width: 'full',
			},
		},
	],
	minWidth: 12,
	minHeight: 8,
	skipUndefinedKeys: ['responseFormat'],
});
