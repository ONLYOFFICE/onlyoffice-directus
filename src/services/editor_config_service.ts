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
import formats from "../assets/document-formats/onlyoffice-docs-formats.json"
import { ItemPermissions } from "@directus/types";
import jwt from "jsonwebtoken";
import { JwtUtils } from "./jwt_utils";

export class EditorConfigService {
    private request: any;
    private jwtUtils: JwtUtils;
    private getSchema: any;
    private fileServiceType: any;
    private usersServiceType: any;
    private settingsServiceType: any;
    private permissionsServiceType: any;

    constructor(request: any, context: EndpointExtensionContext, jwtUtils: JwtUtils) {
        const { services, getSchema } = context;
        const { FilesService, UsersService, SettingsService, PermissionsService } = services;

        this.request = request;
        this.jwtUtils = jwtUtils;
        this.getSchema = getSchema;
        this.fileServiceType = FilesService;
        this.usersServiceType = UsersService;
        this.settingsServiceType = SettingsService;
        this.permissionsServiceType = PermissionsService;
    }

    public async getConfig(fileId: string, editorAction: EditorActionType, editorType: EditorType, settings: any) {
        if (this.request.accountability?.user == null) throw new Error("No user");

        const schema = await this.getSchema();
        const filesService = new this.fileServiceType({
            schema: schema,
            accountability: this.request.accountability
        });
        const usersService = new this.usersServiceType({
            schema: schema
        });
        const settingsService = new this.settingsServiceType({
            schema: schema
        });
        const permissionsService = new this.permissionsServiceType({
            schema: schema,
            accountability: this.request.accountability
        });

        const data = await filesService.readOne(fileId) || null;
        const user = await usersService.readOne(this.request.accountability.user);
        const directusSettings = await settingsService.readSingleton({});

        if (!data) throw new Error("Missing file id");

        const baseUrl = `${this.request.protocol}://${this.request.get("host")}`;

        const fileExt = this.getFileExtension(data.filename_download);
        const format = formats.filter(format => format.name == fileExt)[0];

        if (!format) throw new Error("Unknown format");

        const userRights: ItemPermissions = await permissionsService.getItemPermissions("directus_files", fileId);
        const isEdit = editorAction == EditorActionType.Edit && format.actions.includes("edit") && userRights.update.access;

        const ooToken = jwt.sign({
            user: user.id
        },
            settings.directus_jwt_secret,
            {
                expiresIn: "10m"
            });

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
                "url": `${baseUrl}/onlyoffice/file/${data.id}?oo_token=${ooToken}`,
                "documentType": format.type,
            },
            "editorConfig": {
                "callbackUrl": isEdit ? `${baseUrl}/onlyoffice/file/${data.id}/callback` : null,
                "lang": user.language || directusSettings.default_language,
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

        if (directusSettings.default_appearance != "auto") {
            config.editorConfig.customization.uiTheme = `default-${directusSettings.default_appearance}`;
        }

        config.token = this.jwtUtils.sign(config);

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