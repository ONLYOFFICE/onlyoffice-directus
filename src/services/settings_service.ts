import { EndpointExtensionContext } from "@directus/extensions";
import settings_collection from "../schema/settings_collection";
import * as constants from "../constants/constants";

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

    async getSettings(): Promise<any> {
        try {
            return (await this.getService()).readSingleton({});
        }
        catch (error) {
            this.request.error(error);
            return null;
        }
    }

    private async getService() {
        const collectionsService = new this.collectionsServiceType({
            schema: await this.getSchema(),
            accountability: this.request.accountability
        });

        const data = await collectionsService.readOne(constants.ONLYOFFICE_SETIINGS_COLLECTION_KEY);

        if (data == null) {
            await collectionsService.createOne(settings_collection);
        }
        //  else {
        //     await collectionsService.updateOne(constants.ONLYOFFICE_SETIINGS_COLLECTION_KEY, {});
        // }

        return new this.itemsServiceType(constants.ONLYOFFICE_SETIINGS_COLLECTION_KEY, {
            schema: await this.getSchema(),
            accountability: this.request.accountability
        });
    }
}