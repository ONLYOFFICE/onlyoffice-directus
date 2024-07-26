<template>
	<private-view title="ONLYOFFICE Settings">
		<div v-if="!hasPermission" class="panel-error">
			<v-notice type="danger" icon="warning">You do not have permissions to {{ collection }}</v-notice>
		</div>
		<v-form v-if="fieldData" :fields="fieldData" v-model="formData" />
		<v-button v-if="Object.keys(formData).length > 0" @click="submitForm()">Save</v-button>
		<v-button v-else secondary>Save</v-button>
	</private-view>
</template>

<script lang="ts">
import { ref, watch, defineComponent } from "vue";
import { useApi, useCollection, useStores } from "@directus/extensions-sdk";
import * as constants from "../constants/constants";
import settings_fields from "../schema/settings_fields";

export default defineComponent({
	props: {
		collection: {
			type: String,
			default: constants.ONLYOFFICE_SETIINGS_COLLECTION_KEY,
		},
		fields: {
			type: Array,
			default: settings_fields,
		},
		responseFormat: {
			type: String,
			default: '',
		},
	},

	setup(props) {
		const { useFieldsStore, usePermissionsStore } = useStores();
		const fieldsStore = useFieldsStore();
		const permissionsStore = usePermissionsStore();
		const hasPermission = permissionsStore.hasPermission(props.collection, "create");
		console.log("perm = " + hasPermission);
		const api = useApi();
		const { primaryKeyField } = useCollection(props.collection);
		const formData = ref({});
		const fieldData = ref([]);

		const formResponse = ref({});
		const formError = ref({});
		const responseDialog = ref(false);

		function getFields() {
			console.log("get fields = " + hasPermission);
			fieldData.value = [];

			props.fields.forEach((field) => {
				fieldData.value.push(fieldsStore.getField(props.collection, field));
			});

			console.log("got fields", fieldData);
		}

		getFields();

		watch([() => props.collection, () => props.fields, () => props.responseFormat], getFields);
	
		return {
			hasPermission,
			primaryKeyField,
			formData,
			fieldData,
			formResponse,
			formError,
			responseDialog,
		};
	},
});
</script>
