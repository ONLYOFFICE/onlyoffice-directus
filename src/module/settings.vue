<template>
	<private-view title="ONLYOFFICE Settings">
		<div v-if="!hasPermission" class="panel-error">
			<v-notice type="danger" icon="warning">You do not have permissions to {{ collection }}</v-notice>
		</div>

		<div v-else>
			<v-form v-if="fieldData" v-model="formData" :fields="fieldData" />
			<v-button class="v-button-save" v-if="Object.keys(formData).length > 0" @click="submitForm()">Save</v-button>
			<v-button class="v-button-save" v-else secondary>Save</v-button>

			<v-dialog v-model="responseDialog" @esc="responseDialog = false">
				<v-sheet>
					<v-notice v-if="formResponse[primaryKeyField.field]" type="success" icon="done">Saved</v-notice>
					<v-notice v-else-if="formError" type="danger" icon="warning">Error saving settings</v-notice>
					<v-notice v-else type="danger" icon="warning">No Response</v-notice>
					<blockquote v-if="formResponse[primaryKeyField.field]" class="form-response">
						<span>Settings have been saved successfully</span>
					</blockquote>
					<blockquote v-else-if="formError" class="">
						{{ formError }}
					</blockquote>

					<v-button @click="responseDialog = false">Done</v-button>
				</v-sheet>
			</v-dialog>
		</div>
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
		width: String,
		height: String,
	},

	setup(props) {
		const { useFieldsStore, usePermissionsStore } = useStores();
		const fieldsStore = useFieldsStore();
		const permissionsStore = usePermissionsStore();
		const hasPermission = permissionsStore.hasPermission(props.collection, "create");
		const api = useApi();
		const { primaryKeyField } = useCollection(props.collection);
		const formData = ref({});
		const fieldData = ref([]);

		const formResponse = ref({});
		const formError = ref({});
		const responseDialog = ref(false);

		function submitForm() {
			if (!formData.value.id) {
				formData.value.id = 1;
			}

			api
				.patch(`/items/${props.collection}`, formData.value)
				.then((response) => {
					formResponse.value = response.data.data;
					responseDialog.value = true;
				})
				.catch((error) => {
					formError.value = error;
					responseDialog.value = true;
				});
		}

		function getFields() {
			fieldData.value = [];

			props.fields.forEach((field) => {
				fieldData.value.push(fieldsStore.getField(props.collection, field.field));
			});
		}

		function getValues() {
			api
				.get("/onlyoffice/settings")
				.then((response) => {
					formData.value = response.data;
				})
				.catch((error) => {
					console.error("Error while getting ONLYOFFICE settings", error);
					formData.value = {};
				});
		}

		getFields();
		getValues();

		watch([() => props.collection, () => props.fields, () => props.responseFormat], getFields);
	
		return {
			hasPermission,
			primaryKeyField,
			formData,
			fieldData,
			formResponse,
			formError,
			responseDialog,
			submitForm,
		};
	},
});
</script>

<style scoped>
.v-form, .v-button-save {
	padding: calc(var(--content-padding) * 3) var(--content-padding) var(--content-padding);
	padding-bottom: 0;

	@media (min-width: 600px) {
		padding: var(--content-padding);
		padding-bottom: 0;
	}
}

.v-sheet blockquote {
	margin-top: 16px;
	margin-bottom: 16px;
}

</style>