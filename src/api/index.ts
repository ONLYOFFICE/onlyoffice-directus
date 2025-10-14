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

import { defineEndpoint } from "@directus/extensions-sdk";
import getEditorTemplate from "../assets/templates/editor";
import { SettingsService as OnlyofficeSettingsService } from "../services/settings_service";
import { EditorConfigService, EditorActionType, EditorType } from "../services/editor_config_service";
import { toArray } from "@directus/utils";
import { useEnv } from '@directus/env';
import { getAccountability } from "../utils/get_accountability";
import jwt from "jsonwebtoken";
import { JwtUtils } from "../services/jwt_utils";
import { PrimaryKey, File } from "@directus/types";
import format_utils from "../utils/format_utils";
import { encodeFilename } from "../utils/encode_filename";
import path from "path";
import { createReadStream, existsSync, open, readFile, ReadStream } from "fs";

interface CreateFileData {
	filename: string;
	filetype: string;
}

const env = useEnv();

export default defineEndpoint((router, context) => {
	const { services } = context;
	const { AssetsService, FilesService } = services;

	router.get("/editor/:file_id", async (request, response) => {
		response.setHeader("Content-Security-Policy", `default-src: 'self'`);

		try {
			const settingsService = new OnlyofficeSettingsService(request, context);
			const settings = await settingsService.getSettings();
			const jwtUtils = new JwtUtils(settings);
			const editorConfig = new EditorConfigService(request, context, jwtUtils);
		
			const config = await editorConfig.getConfig(request.params.file_id, request.query.edit ? EditorActionType.Edit : EditorActionType.View, request.query.embed ? EditorType.Embedded : EditorType.Desktop, settings);
			response.send(getEditorTemplate(config, settings));
		} catch (error) {
			request.log.error(error);
			response.json({ "error": 1, "message": error.message });
		}
	});

	router.post("/file", async (request, response) => {
		let stream: ReadStream | null = null;
		try {
			const body = request.body as CreateFileData;
			const format = format_utils.getFormatByExtension(body.filetype);
			if (!format) throw new Error(`Unknown format: .${body.filetype}`);

			// ToDo: pass language
			const templatePath = path.join(import.meta.dirname, `assets/document-templates/default/new.${format.name}`);
			if (!existsSync(templatePath)) throw new Error(`Missing file template for .${format.name}`);
			stream = createReadStream(templatePath);

			const key = await createFile(request, { title: body.filename, type: format.mime[0], filename_download: `${body.filename}.${format.name}` }, stream);
			response.json({ "error": 0, "message": "success", "key": key });
		} catch (error) {
			request.log.error(error);
			response.json({ "error": 1, "message": error.message });
		} finally {
			try {
				stream?.close();
			} catch { }
		}
	});

	router.get("/file/:file_id", async (request, response) => {
		try {
			const settings = await new OnlyofficeSettingsService(request, context).getSettings();
			const jwtUtils = new JwtUtils(settings);

			let userId = null;
			try {
				jwtUtils.verifyHeaders(request.headers);
				userId = jwt.verify(request.query.oo_token, settings.directus_jwt_secret).user;
			} catch (error) {
				response.status(401);
				throw error;
			}

			request.accountability = await getAccountability(context, userId);

			const service = new AssetsService({
				schema: request.schema,
				accountability: request.accountability
			});

			const { stream, file, stat } = await service.getAsset(request.params.file_id, null, null);
			const filename = encodeFilename(file.filename_download || file.title);
			response.attachment(file.filename_download);
			response.setHeader("Content-Type", file.type);
			response.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

			stream
				.on("error", (error: any) => {
					console.error(error, `Couldn"t stream file ${file.id} to the client`);

					if (!response.headersSent) {
						response.removeHeader("Content-Type");
						response.removeHeader("Content-Disposition");
						response.removeHeader("Cache-Control");

						response.status(500).json({
							errors: [
								{
									message: "An unexpected error occurred.",
									extensions: {
										code: "INTERNAL_SERVER_ERROR",
									},
								},
							],
						});
					} else {
						response.end();
					}
				})
				.pipe(response);
		} catch (error) {
			request.log.error(error);
			response.json({ "error": 1, "message": error.message });
		}
	});

	router.post("/file/:file_id/callback", async (request, response) => {

		// ToDo: JWT

		try {
			let body = request.body;
			request.log.info(`ONLYOFFICE Callback POST\n${JSON.stringify(body, null, 2)}`);

			const settings = await new OnlyofficeSettingsService(request, context).getSettings();
			const jwtUtils = new JwtUtils(settings);

			try {
				body = jwtUtils.verifyBody(body);
			} catch (error) {
				response.status(401);
				throw error;
			}

			switch (body.status) {
				case 1: // editing in progress
					break;
				case 2: // must save
				case 3: // corrupted
					if (body.actions && body.actions.length > 0) {
						const userId = body.actions[0].userid;
						request.accountability = await getAccountability(context, userId);
					}
					await updateFile(request, request.params.file_id, body.url);
					break;
				case 4: // no changes
					break;
				case 6: // force save
				case 7: // force save error
					break;
				default:
					throw new Error(`ONLYOFFICE sent incorrect status ${body.status}`);
			}
			response.json({ "error": 0, "message": "success" });
		} catch (error) {
			request.log.error(error);
			response.statusCode = 500;
			response.json({ "error": 1, "message": error.message },);
		}
	});

	router.get("/settings", async (request, response) => {
		try {
			const settingsService = new OnlyofficeSettingsService(request, context);
			response.json(await settingsService.getSettings(true));
		} catch (error) {
			request.log.error(error);
			response.statusCode = 500;
			response.json({ "error": 1, "message": error.message },);
		}
	});
	
	// ToDo: move to file service

	async function updateFile(request: any, fileId: string, fileUrl: string) {
		const service = new FilesService({
			schema: request.schema,
			accountability: request.accountability
		});

		const response = await fetch(new URL(fileUrl));
		if (!response.ok) throw new Error(`ONLYOFFICE Couldn't download file: ${response.status} ${response.statusText}`);

		let disk: string = toArray(env['STORAGE_LOCATIONS'] as string)[0]!;
		await service.uploadOne(response.body, { storage: disk }, fileId);
	}

	async function createFile(request: any, data: Partial<File>, stream: any): Promise<PrimaryKey> {
		const service = new FilesService({
			schema: request.schema,
			accountability: request.accountability
		});
		
		let disk: string = toArray(env['STORAGE_LOCATIONS'] as string)[0]!;
		const payload: Partial<File> & { storage: string } = { ...data, storage: disk };
		
		return await service.uploadOne(stream, payload);
	}
});
