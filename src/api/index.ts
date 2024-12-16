import { defineEndpoint } from "@directus/extensions-sdk";
import getEditorTemplate from "../assets/templates/editor";
import { SettingsService as OnlyofficeSettingsService } from "../services/settings_service";
import { EditorConfigService, EditorActionType, EditorType } from "../services/editor_config_service";
import { toArray } from "@directus/utils";
import { useEnv } from '@directus/env';
import { getAccountability } from "../utils/get_accountability";

const env = useEnv();

export default defineEndpoint((router, context) => {
	const { services } = context;
	const { AssetsService, FilesService } = services;

	router.get("/editor/:file_id", async (request, response) => {
		response.setHeader("Content-Security-Policy", `default-src: 'self'`);

		const settingsService = new OnlyofficeSettingsService(request, context);
		const editorConfig = new EditorConfigService(request, context);

		try {
			const config = await editorConfig.getConfig(request.params.file_id, request.query.edit ? EditorActionType.Edit : EditorActionType.View, request.query.embed ? EditorType.Embedded : EditorType.Desktop);
			response.send(getEditorTemplate(config, await settingsService.getSettings()));
		} catch (error) {
			request.log.error(error);
			response.json({ "error": 1, "message": error.message });
		}
	});

	router.get("/file/:file_id", async (request, response) => {

		// ToDo: JWT

		// if (req.accountability?.user == null) { 
		// 	res.status(403); 
		// 	return response.send(`You don"t have permission to access this.`); 
		// } 

		// # proxy https://docs.directus.io/extensions/app-composables.html#useapi

		try {
			const service = new AssetsService({
				schema: request.schema,
			});

			const { stream, file, stat } = await service.getAsset(request.params.file_id, null, null);
			response.attachment(file.filename_download);
			response.setHeader("Content-Type", file.type);
			response.setHeader("Content-Disposition", `attachment; filename="${file.filename_download || file.title}"`);

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
			const body = request.body;
			request.log.info(`ONLYOFFICE Callback POST\n${JSON.stringify(body, null, 2)}`);

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
});
