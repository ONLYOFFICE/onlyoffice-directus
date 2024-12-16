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

import * as constants from "../constants/constants";
import settings_fields from "./settings_fields";

export default {
    collection: constants.ONLYOFFICE_SETIINGS_COLLECTION_KEY,
    meta: {
        note: "ONLYOFFICE Settings",
        hidden: true,
        singleton: true,
    },
    fields: settings_fields,
    schema: {}
}