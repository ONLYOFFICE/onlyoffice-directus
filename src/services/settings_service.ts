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

import { EndpointExtensionContext } from "@directus/extensions";
import settings_collection from "../schema/settings_collection";
import * as constants from "../constants/constants";
import { randomUUID } from "node:crypto";

export class SettingsService {
    private request: any;
    private getSchema: any;
    private itemsServiceType: any;
    private collectionsServiceType: any;

    constructor(request: any, context: EndpointExtensionContext) {
        const { services, getSchema } = context;
        const { ItemsService, CollectionsService } = services;

        this.request = request;
        this.getSchema = getSchema;
        this.collectionsServiceType = CollectionsService;
        this.itemsServiceType = ItemsService;
    }

    async getSettings(checkRights: boolean = false): Promise<any> {
        try {
            return (await this.getService(checkRights)).readSingleton({});
        }
        catch (error) {
            this.request.log.error(error);
            return null;
        }
    }

    private async getService(checkRights: boolean) {
        const collectionsService = new this.collectionsServiceType({
            schema: await this.getSchema(),
            accountability: checkRights ? this.request.accountability : null
        });

        let data: any = null;
        try {
            data = await collectionsService.readOne(constants.ONLYOFFICE_SETIINGS_COLLECTION_KEY);
        } catch { }

        if (data == null) {
            settings_collection.fields.filter(f => f.field == "directus_jwt_secret")[0].schema.default_value = randomUUID();
            await collectionsService.createOne(settings_collection);
        }

        // ToDo: add version number to settings field; collectionsService.updateOne doesn't update fields; have to call fieldsService for that

        return new this.itemsServiceType(constants.ONLYOFFICE_SETIINGS_COLLECTION_KEY, {
            schema: await this.getSchema(),
            accountability: checkRights ? this.request.accountability : null
        });
    }
}