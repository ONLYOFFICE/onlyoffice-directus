import { EndpointExtensionContext } from "@directus/extensions";
import formats from "../assets/document-formats/onlyoffice-docs-formats.json"

export class EditorConfigService {
    private request: any;
    private getSchema: any;
    private fileServiceType: any;
    private usersServiceType: any;
    private settingsServiceType: any;

    constructor(request: any, context: EndpointExtensionContext) {
        const { services, getSchema } = context;
        const { FilesService, UsersService, SettingsService } = services;

        this.request = request;
        this.getSchema = getSchema;
        this.fileServiceType = FilesService;
        this.usersServiceType = UsersService;
        this.settingsServiceType = SettingsService;
    }

    public async getConfig(fileId: string, editorAction: EditorActionType, editorType: EditorType) {
        if (this.request.accountability?.user == null) throw new Error("No user");

        const schema = await this.getSchema();
        const filesService = new this.fileServiceType({
            schema: schema
        });
        const usersService = new this.usersServiceType({
            schema: schema
        });
        const settingsService = new this.settingsServiceType({
            schema: schema
        });

        const data = await filesService.readOne(fileId) || null;
        const user = await usersService.readOne(this.request.accountability.user);
        const settings = await settingsService.readSingleton({});

        if (!data) throw new Error("Missing file id");

        const baseUrl = `${this.request.protocol}://${this.request.get("host")}`;

        const fileExt = this.getFileExtension(data.filename_download);
        const format = formats.filter(format => format.name == fileExt)[0];

        if (!format) throw new Error("Unknown format");

        const isEdit = editorAction == EditorActionType.Edit && format.actions.includes("edit"); // ToDo: && enough rights to edit

        const config = {
            "document": {
                "fileType": fileExt,
                "info": {
                    "uploaded": data.uploaded_on
                },
                "key": `${data.id}_${data.modified_on}`,
                "permissions": {
                    "edit": isEdit
                },
                "title": data.title,
                "url": `${baseUrl}/onlyoffice/file/${data.id}`,
                "documentType": format.type,
            },
            "editorConfig": {
                "callbackUrl": isEdit ? `${baseUrl}/onlyoffice/file/${data.id}/callback` : null,
                "lang": user.language || settings.default_language,
                "mode": isEdit ? "edit" : "view",
                "user": {
                    "id": user.id,
                    "name": `${user.first_name} ${user.last_name}`,
                    "image": user.avatar ? `${baseUrl}/assets/${user.avatar}` : null
                },
                "customization": {
                    "uiTheme": "",
                }
            },
            "token": "",
            "type": this.getEditorType(editorType)
        };

        if (settings.default_appearance != "auto") {
            config.editorConfig.customization.uiTheme = `default-${settings.default_appearance}`;
        }

        return config;
    }

    private getFileExtension(filename: string) {
        return filename.substring(filename.lastIndexOf(".") + 1);
    }

    private getEditorType(type: EditorType) {
        switch (type) {
            case EditorType.Embedded:
                return "embedded";
            case EditorType.Desktop:
            default:
                return "desktop";
        }
    }
}

export enum EditorActionType {
    View = 1,
    Edit = 2,
}

export enum EditorType {
    Desktop = 1,
    Embedded = 2
}