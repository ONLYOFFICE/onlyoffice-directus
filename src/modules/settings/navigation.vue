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

<template>
	<v-list nav v-if="pages">
		<v-list-item v-for="navItem in pages" :key="navItem.to" :active="navItem.uri == current" :to="navItem.to">
			<v-list-item-icon><v-icon :name="navItem.icon" :color="navItem.color" /></v-list-item-icon>
			<v-list-item-content>
				<v-text-overflow :text="navItem.label" />
			</v-list-item-content>
		</v-list-item>
	</v-list>
</template>


<script>
export default {
	name: "PageNavigation",
	inheritAttrs: false,
	props: {
		current: {
			type: String,
			default: null,
		},
		pages: {
			type: Array,
			default: [],
		}
	},
};
</script>