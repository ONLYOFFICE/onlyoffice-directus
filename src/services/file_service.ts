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
import { PrimaryKey, File } from "@directus/types";
import { toArray } from "@directus/utils";
import { useEnv } from '@directus/env';

const env = useEnv();

export class FileService {
    private request: any;
    private getSchema: any;
    private filesServiceType: any;

    constructor(request: any, context: EndpointExtensionContext) {
        const { services, getSchema } = context;
        const { FilesService } = services;

        this.request = request;
        this.getSchema = getSchema;
        this.filesServiceType = FilesService;
    }

    async updateFile(fileId: string, fileUrl: string): Promise<void> {
        const service = new this.filesServiceType({
            schema: await this.getSchema(),
            accountability: this.request.accountability
        });

        const response = await fetch(new URL(fileUrl));
        if (!response.ok) throw new Error(`ONLYOFFICE Couldn't download file: ${response.status} ${response.statusText}`);

        let disk: string = toArray(env['STORAGE_LOCATIONS'] as string)[0]!;
        await service.uploadOne(response.body, { storage: disk }, fileId);
    }

    async createFile(data: Partial<File>, stream: any): Promise<PrimaryKey> {
        const service = new this.filesServiceType({
            schema: await this.getSchema(),
            accountability: this.request.accountability
        });
        
        let disk: string = toArray(env['STORAGE_LOCATIONS'] as string)[0]!;
        const payload: Partial<File> & { storage: string } = { ...data, storage: disk };
        
        return await service.uploadOne(stream, payload);
    }
}
