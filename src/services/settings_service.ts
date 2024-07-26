import { EndpointExtensionContext } from "@directus/extensions";
import settings_collection from "../schema/settings_collection";
import * as constants from "../constants/constants";

export class SettingsService {
    private request: any;
    private getSchema: any;
    private itemsServiceType: any;
    private collectionsServiceType: any;

    private collectionsService: any;
    private itemsService: any;

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
            await this.init();
            return this.itemsService.readSingleton({});
        }
        catch (error) {
            // ToDo: log
            return null;
        }
    }

    private async init() {
        if (this.itemsService != null) return;

        try {
            this.collectionsService = new this.collectionsServiceType({
                schema: await this.getSchema(),
                accountability: this.request.accountability
            });

            const data = await this.collectionsService.readOne(constants.ONLYOFFICE_SETIINGS_COLLECTION_KEY);

            if (data == null) {
                await this.collectionsService.createOne(settings_collection);
            }

            this.itemsService = new this.itemsServiceType(constants.ONLYOFFICE_SETIINGS_COLLECTION_KEY, {
                schema: await this.getSchema(),
                accountability: this.request.accountability
            });
        }
        catch (error) {
            // ToDo: log
        }
    }
}