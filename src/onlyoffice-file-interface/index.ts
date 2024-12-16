import { defineInterface } from '@directus/extensions-sdk';
import InterfaceComponent from './interface.vue';

export default defineInterface({
	id: 'onlyoffice-file-interface',
	name: 'ONLYOFFICE Editor',
	icon: 'edit_document',
	description: 'Shows ONLYOFFICE Editor',
	component: InterfaceComponent,
	options: null,
	types: ['uuid'],
	localTypes: ['file']
});
