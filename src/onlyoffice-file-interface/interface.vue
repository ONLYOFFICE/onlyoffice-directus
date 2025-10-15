/*
* (c) Copyright Ascensio System SIA 2025
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
* http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/

<template>
	<div v-if="fileId">
		<iframe :src="`/onlyoffice/editor/${fileId}?embed=1`"></iframe>
		<v-button target="_blank" :href="`/onlyoffice/editor/${fileId}?edit=1`" :outlined="true" class="margin-right">
			Open in a new tab
			<VIcon name="open_in_new" />
		</v-button>
		<v-button @click="openForm()" :outlined="true">
			Replace file
		</v-button>
	</div>
	<div v-else>
		<v-button @click="openForm()" :outlined="true">
			Replace file
		</v-button>
	</div>

	<v-dialog v-model="createDialog" @esc="createDialog = false" keep-behind>
		<v-sheet class="sheet">
			<v-notice v-if="createDialogNotice.message" type="danger" icon="warning">{{createDialogNotice}}</v-notice>

			<v-form v-model="createFileData" :fields="fields" class="gap">

			</v-form>

			<v-divider class="divider" />

			<div class="field">
				<div class="field-label type-label">Or Upload file</div>
				<component :is="FileComponent" v-bind="attrs" />
			</div>

			<div class="dialog-buttons">
				<v-button @click="createDialog = false" class="margin-top secondary margin-right">Cancel</v-button>
				<v-button @click="submitForm()" class="margin-top">{{ !!fileId ? "Replace" : "Create" }}</v-button>
			</div>
		</v-sheet>
	</v-dialog>
</template>

<script lang="ts">
import { useApi, useExtensions } from "@directus/extensions-sdk";
import { DeepPartial, Field, PrimaryKey } from "@directus/types";
import { computed, ref, defineComponent } from 'vue';

interface CreateFileData {
	filename: string;
	filetype: string;
}

interface CreateFileResponse {
	error: number;
	message: string;
	key: PrimaryKey;
}

interface CreateFileNotice {
	message: string;
}

function useForm() {
	const fields = computed<DeepPartial<Field>[]>(() => [
		{
			field: 'filename',
			name: '$t:Name',
			type: 'string',
			meta: {
				interface: 'input',
				options: {
					placeholder: '$t:Enter file name',
				},
			},
		},
		{
			field: 'filetype',
			name: '$t:Choose ONLYOFFICE file type',
			type: 'string',
			meta: {
				interface: 'select-dropdown',
				options: {
					choices: [
						{
							text: "Document",
							value: "docx",
						},
						{
							text: "Spreadsheet",
							value: "xlsx",
						},
						{
							text: "Presentation",
							value: "pptx",
						},
						{
							text: "PDF",
							value: "pdf",
						}
					],
				},
			},
		},
	]);

	return { fields };
}

export default defineComponent({
	props: {
		value: {
			type: String,
			default: null,
		}
	},
	watch: {
		value: function (newValue, oldValue) {
			// probably used default file input, close popup
			this.createDialog = false;
			this.fileId = newValue;
		}
	},
	setup(props, { attrs, emit }) {
		const { interfaces } = useExtensions();
		const FileComponent = interfaces.value.find((i) => i.id === "file")?.component;

		const api = useApi();

		const createDialog = ref(false);
		const createDialogNotice = ref({} as CreateFileNotice);
		const createFileData = ref({} as CreateFileData);

		const fileId = ref(props.value);

		const { fields } = useForm();

		function submitForm() {
			if (!createFileData.value.filename || !createFileData.value.filetype) {
				return;
			}

			api
				.post(`/onlyoffice/file`, createFileData.value)
				.then((response) => {
					if (response.status != 200) throw new Error(response.statusText);

					const body = (response.data as CreateFileResponse);

					if (body.error == 0) {
						fileId.value = body.key.toString();
						emit('input', fileId.value);
						createDialog.value = false;
						return;
					}

					createDialogNotice.value.message = (response.data as CreateFileResponse).message;
				})
				.catch((error) => {
					createDialogNotice.value.message = error;
				});
		}

		function openForm() {
			createFileData.value.filename = "";
			createFileData.value.filetype = "";
			createDialogNotice.value.message = "";
			createDialog.value = true;
		}

		return {
			attrs,
			FileComponent,
			createDialog,
			createDialogNotice,
			createFileData,
			openForm,
			submitForm,
			fields,
			fileId,
		};
	},
});
</script>

<style lang="css" scoped>
iframe {
	border: 0;
	width: 100%;
	height: 50vh;
}

.margin-right {
	margin-right: 5px;
}

.gap {
	gap: 16px 12px;
}

.divider {
	margin-top: 16px;
	margin-bottom: 16px;
}

.field-label {
	margin-bottom: 8px;
}

.margin-top {
	margin-top: 16px;
}

.sheet {
	width: 50%;
}

.dialog-buttons {
	display: flex;
	justify-content: end;
}
</style>

<style>
:deep(.v-drawer.container.right) {
	z-index: 1000 !important;
}
</style>
