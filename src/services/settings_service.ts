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
        //  else {
        //     await collectionsService.updateOne(constants.ONLYOFFICE_SETIINGS_COLLECTION_KEY, {});
        // }

        return new this.itemsServiceType(constants.ONLYOFFICE_SETIINGS_COLLECTION_KEY, {
            schema: await this.getSchema(),
            accountability: checkRights ? this.request.accountability : null
        });
    }
}