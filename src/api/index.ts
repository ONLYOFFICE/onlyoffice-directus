import { defineEndpoint } from "@directus/extensions-sdk";
import editorTemplate from "../assets/templates/editor";
import { SettingsService } from "../services/settings_service";

export default defineEndpoint((router, context) => {
	const { services, getSchema } = context;
	const { FilesService, CollectionsService } = services;

	router.get("/", async (request, response) => {
		const settingsService = new SettingsService(request, context);
		
		response.json(await settingsService.getSettings());
	});

	router.get("/editor", async (request, response) => {
		response.setHeader("Content-Security-Policy", "default-src: *"); // ToDo: strict CSP

		response.send(editorTemplate);
	});

	router.get("/file/:file_id", async (request, response) => {
		// if (req.accountability?.user == null) { 
		// 	res.status(403); 
		// 	return response.send(`You don"t have permission to access this.`); 
		// } 

		// # proxy https://docs.directus.io/extensions/app-composables.html#useapi

		try {
			const filesService = new FilesService({
				schema: await getSchema(),
				accountability: request.accountability
			  });
	
			const data = await filesService.readOne(request.params.file_id) || null;

			  console.log("0");
			  console.log(Object.keys(data));

			if (Buffer.isBuffer(data)) {
				return response.end(data);
			} else if (data) {
				return response.json(data);
			} else {
				return response.status(204).end();
			}
		} catch (error) {
			response.json({"error": 1, "message": error.message});
		}
	});
});
