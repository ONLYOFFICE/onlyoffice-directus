/*
 * Smoke tests for the ONLYOFFICE Directus extension.
 *
 * They run against the BUILT bundle (dist/api.js + dist/assets) with Directus
 * services mocked in-process, so neither Directus nor ONLYOFFICE Docs is needed.
 * They cover the server side of the main user scenarios: editor config
 * (view/edit/embedded), file creation from templates, file download for Docs,
 * save callback and settings. UI and real Docs interaction are covered by the
 * manual checklist in HANDOVER.md.
 *
 * Run: pnpm test:smoke   (builds first)
 */

import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createServer } from "node:http";
import { Readable, Writable } from "node:stream";
import { randomUUID } from "node:crypto";
import path from "node:path";
import jwt from "jsonwebtoken";

const root = path.resolve(import.meta.dirname, "..");
const dist = path.join(root, "dist");
const pkg = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));

process.env.STORAGE_LOCATIONS ??= "local";

// Test-only secrets, generated per run.
const DOC_SECRET = randomUUID();
const DIRECTUS_SECRET = randomUUID();
const JWT_HEADER = "AuthorizationJwt";

const FILE_ID = "11111111-1111-1111-1111-111111111111";
const USER_ID = "22222222-2222-2222-2222-222222222222";

// ---------------------------------------------------------------- mocks ---

function createState() {
	return {
		settings: {
			id: 1,
			doc_server_public_url: "https://docs.example.test",
			doc_server_jwt_secret: DOC_SECRET,
			doc_server_jwt_header: JWT_HEADER,
			directus_jwt_secret: DIRECTUS_SECRET,
			version: pkg.version,
		},
		directusSettings: { default_language: "en-US", default_appearance: "auto" },
		user: { id: USER_ID, first_name: "Test", last_name: "User", language: "en-US", avatar: null, status: "active", role: "role-1" },
		file: {
			id: FILE_ID,
			title: "Report",
			filename_download: "Report.docx",
			type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
			uploaded_on: "2025-01-01T00:00:00.000Z",
			modified_on: "2025-01-02T10:20:30.000Z",
		},
		canUpdate: true,
		uploads: [],
	};
}

let state = createState();

async function drain(stream) {
	const chunks = [];
	for await (const chunk of stream) chunks.push(Buffer.from(chunk));
	return Buffer.concat(chunks);
}

class Base {
	constructor(a, b) {
		this.options = typeof a === "string" ? b : a;
	}
}

const services = {
	CollectionsService: class extends Base {
		async readOne() { return { collection: "onlyoffice_settings" }; }
		async createOne() { }
	},
	FieldsService: class extends Base {
		async readAll() { return []; }
		async createField() { }
	},
	ItemsService: class extends Base {
		async readSingleton() { return state.settings; }
		async updateOne(id, data) { Object.assign(state.settings, data); return id; }
	},
	SettingsService: class extends Base {
		async readSingleton() { return state.directusSettings; }
	},
	UsersService: class extends Base {
		async readOne() { return state.user; }
	},
	RolesService: class extends Base {
		async readOne(id) { return { id, parent: null }; }
	},
	AccessService: class extends Base {
		async readByQuery() { return [{ policy: "policy-1" }]; }
	},
	PoliciesService: class extends Base {
		async readByQuery() { return [{ admin_access: false, app_access: true }]; }
	},
	PermissionsService: class extends Base {
		async getItemPermissions() { return { update: { access: state.canUpdate } }; }
	},
	FilesService: class extends Base {
		async readOne() { return state.file; }
		async uploadOne(stream, payload, id) {
			const data = await drain(stream);
			const sourcePath = stream.path ?? null;
			state.uploads.push({ payload, id, size: data.length, sourcePath, accountability: this.options.accountability });
			return id ?? "33333333-3333-3333-3333-333333333333";
		}
	},
	AssetsService: class extends Base {
		async getAsset() {
			return { stream: Readable.from([Buffer.from("file-content")]), file: state.file, stat: { size: 12 } };
		}
	},
};

const context = { services, getSchema: async () => ({}) };

function makeRequest({ params = {}, query = {}, body = {}, headers = {}, accountability = { user: USER_ID } } = {}) {
	const logs = [];
	return {
		params, query, body, headers, accountability,
		schema: {},
		protocol: "http",
		get: (name) => (name.toLowerCase() === "host" ? "directus.example.test" : undefined),
		log: { info: (m) => logs.push(m), error: (e) => logs.push(e) },
		logs,
	};
}

function makeResponse() {
	const chunks = [];
	const res = new Writable({
		write(chunk, _enc, cb) { chunks.push(Buffer.from(chunk)); cb(); },
	});
	Object.assign(res, {
		statusCode: 200,
		headers: {},
		body: undefined,
		headersSent: false,
		status(code) { this.statusCode = code; return this; },
		setHeader(k, v) { this.headers[k.toLowerCase()] = v; },
		removeHeader(k) { delete this.headers[k.toLowerCase()]; },
		attachment() { },
		json(data) { this.body = data; this.emit("done"); return this; },
		send(data) { this.body = data; this.emit("done"); return this; },
	});
	res.on("finish", () => { res.body = Buffer.concat(chunks); res.emit("done"); });
	return res;
}

const routes = new Map();

async function call(method, routePath, req) {
	const handler = routes.get(`${method} ${routePath}`);
	assert.ok(handler, `route ${method} ${routePath} is registered`);
	const res = makeResponse();
	const done = new Promise((resolve) => res.once("done", resolve));
	await handler(req, res);
	await done;
	return res;
}

function editorConfigFrom(html) {
	const match = html.match(/JSON\.parse\('(.*)'\);/);
	assert.ok(match, "editor page embeds config");
	return JSON.parse(match[1]);
}

// ---------------------------------------------------------------- setup ---

let docServer;
let docServerUrl;

before(async () => {
	assert.ok(existsSync(path.join(dist, "api.js")), "dist/api.js exists - run `pnpm build` first");
	const bundle = await import(new URL(`file://${path.join(dist, "api.js").replace(/\\/g, "/")}`).href);
	const endpoint = bundle.endpoints.find((e) => e.name === "onlyoffice");
	assert.ok(endpoint, "bundle exports the 'onlyoffice' endpoint");

	const router = {
		get: (p, h) => routes.set(`GET ${p}`, h),
		post: (p, h) => routes.set(`POST ${p}`, h),
	};
	endpoint.config(router, context);

	// Fake Docs file storage for the save callback.
	docServer = createServer((_req, res) => res.end("edited-content"));
	await new Promise((resolve) => docServer.listen(0, "127.0.0.1", resolve));
	docServerUrl = `http://127.0.0.1:${docServer.address().port}/cache/edited.docx`;
});

after(() => docServer?.close());

// ---------------------------------------------------------------- tests ---

test("build output: bundle entries and file templates are present", () => {
	for (const p of Object.values(pkg["directus:extension"].path)) {
		assert.ok(existsSync(path.join(root, p)), `${p} exists`);
	}
	for (const lang of ["default", "en-US", "ru-RU", "de-DE"]) {
		for (const ext of ["docx", "xlsx", "pptx", "pdf"]) {
			const file = path.join(dist, "assets", "document-templates", lang, `new.${ext}`);
			assert.ok(existsSync(file), `template ${lang}/new.${ext} is copied to dist`);
		}
	}
});

test("endpoint registers all routes", () => {
	assert.deepEqual([...routes.keys()].sort(), [
		"GET /editor/:file_id",
		"GET /file/:file_id",
		"GET /settings",
		"POST /file",
		"POST /file/:file_id/callback",
	]);
});

test("editor: embedded view config is signed and points at Docs", async () => {
	state = createState();
	const res = await call("GET", "/editor/:file_id", makeRequest({ params: { file_id: FILE_ID }, query: { embed: "1" } }));
	const html = String(res.body);

	assert.match(html, /src="https:\/\/docs\.example\.test\/web-apps\/apps\/api\/documents\/api\.js"/);
	const config = editorConfigFrom(html);
	assert.equal(config.type, "embedded");
	assert.equal(config.editorConfig.mode, "view");
	assert.equal(config.editorConfig.callbackUrl, null);
	assert.equal(config.document.fileType, "docx");
	assert.equal(config.document.documentType, "word");
	assert.ok(!config.document.key.includes(":"), "document key has no ':'");
	assert.equal(config.document.key, `${FILE_ID}_2025-01-02T10-20-30.000Z`);

	const signed = jwt.verify(config.token, DOC_SECRET);
	assert.equal(signed.document.key, config.document.key);

	const ooToken = new URL(config.document.url).searchParams.get("oo_token");
	assert.equal(jwt.verify(ooToken, DIRECTUS_SECRET).user, USER_ID);
});

test("editor: edit mode only with update permission", async () => {
	state = createState();
	let res = await call("GET", "/editor/:file_id", makeRequest({ params: { file_id: FILE_ID }, query: { edit: "1" } }));
	let config = editorConfigFrom(String(res.body));
	assert.equal(config.type, "desktop");
	assert.equal(config.editorConfig.mode, "edit");
	assert.equal(config.editorConfig.callbackUrl, `http://directus.example.test/onlyoffice/file/${FILE_ID}/callback`);

	state.canUpdate = false;
	res = await call("GET", "/editor/:file_id", makeRequest({ params: { file_id: FILE_ID }, query: { edit: "1" } }));
	config = editorConfigFrom(String(res.body));
	assert.equal(config.editorConfig.mode, "view");
});

test("editor: Directus dark appearance is passed as uiTheme", async () => {
	state = createState();
	state.directusSettings.default_appearance = "dark";
	const res = await call("GET", "/editor/:file_id", makeRequest({ params: { file_id: FILE_ID } }));
	assert.equal(editorConfigFrom(String(res.body)).editorConfig.customization.uiTheme, "default-dark");
});

test("editor: anonymous request is rejected", async () => {
	state = createState();
	const res = await call("GET", "/editor/:file_id", makeRequest({ params: { file_id: FILE_ID }, accountability: { user: null } }));
	assert.equal(res.body.error, 1);
});

for (const ext of ["docx", "xlsx", "pptx", "pdf"]) {
	test(`create file: new .${ext} from the user's language template`, async () => {
		state = createState();
		state.user.language = "de-DE";
		const res = await call("POST", "/file", makeRequest({ body: { filename: "Plan", filetype: ext } }));
		assert.equal(res.body.error, 0, JSON.stringify(res.body));
		assert.equal(state.uploads.length, 1);
		const { payload, sourcePath, size } = state.uploads[0];
		assert.equal(payload.filename_download, `Plan.${ext}`);
		assert.equal(payload.title, "Plan");
		assert.equal(payload.storage, "local");
		assert.ok(size > 0, "template content uploaded");
		assert.match(String(sourcePath).replace(/\\/g, "/"), new RegExp(`document-templates/de-DE/new\\.${ext}$`));
	});
}

test("create file: unknown language falls back to default template", async () => {
	state = createState();
	state.user.language = "xx-XX";
	const res = await call("POST", "/file", makeRequest({ body: { filename: "Plan", filetype: "docx" } }));
	assert.equal(res.body.error, 0);
	assert.match(String(state.uploads[0].sourcePath).replace(/\\/g, "/"), /document-templates\/default\/new\.docx$/);
});

test("create file: unknown format is rejected", async () => {
	state = createState();
	const res = await call("POST", "/file", makeRequest({ body: { filename: "Plan", filetype: "nope" } }));
	assert.equal(res.body.error, 1);
	assert.equal(state.uploads.length, 0);
});

test("download for Docs: valid oo_token + JWT header streams the file", async () => {
	state = createState();
	const ooToken = jwt.sign({ user: USER_ID }, DIRECTUS_SECRET, { expiresIn: "10m" });
	const docToken = jwt.sign({ url: "x" }, DOC_SECRET);
	const res = await call("GET", "/file/:file_id", makeRequest({
		params: { file_id: FILE_ID },
		query: { oo_token: ooToken },
		headers: { [JWT_HEADER.toLowerCase()]: `Bearer ${docToken}` },
		accountability: null,
	}));
	assert.equal(res.statusCode, 200);
	assert.equal(String(res.body), "file-content");
	assert.match(res.headers["content-disposition"], /filename="utf-8''Report\.docx"/);
});

test("download for Docs: bad oo_token is rejected with 401", async () => {
	state = createState();
	const docToken = jwt.sign({ url: "x" }, DOC_SECRET);
	const res = await call("GET", "/file/:file_id", makeRequest({
		params: { file_id: FILE_ID },
		query: { oo_token: jwt.sign({ user: USER_ID }, "wrong-secret") },
		headers: { [JWT_HEADER.toLowerCase()]: `Bearer ${docToken}` },
		accountability: null,
	}));
	assert.equal(res.statusCode, 401);
	assert.equal(res.body.error, 1);
});

test("save callback: status 2 downloads the result and overwrites the file", async () => {
	state = createState();
	const payload = { key: "k", status: 2, url: docServerUrl, actions: [{ type: 0, userid: USER_ID }] };
	const res = await call("POST", "/file/:file_id/callback", makeRequest({
		params: { file_id: FILE_ID },
		body: { token: jwt.sign(payload, DOC_SECRET) },
		accountability: null,
	}));
	assert.equal(res.body.error, 0, JSON.stringify(res.body));
	assert.equal(state.uploads.length, 1);
	assert.equal(state.uploads[0].id, FILE_ID);
	assert.equal(state.uploads[0].size, "edited-content".length);
	assert.equal(state.uploads[0].accountability.user, USER_ID, "saved on behalf of the editing user");
});

test("save callback: status 1 (editing) does not touch the file", async () => {
	state = createState();
	const res = await call("POST", "/file/:file_id/callback", makeRequest({
		params: { file_id: FILE_ID },
		body: { token: jwt.sign({ key: "k", status: 1 }, DOC_SECRET) },
		accountability: null,
	}));
	assert.equal(res.body.error, 0);
	assert.equal(state.uploads.length, 0);
});

test("save callback: invalid JWT is rejected and nothing is saved", async () => {
	state = createState();
	const res = await call("POST", "/file/:file_id/callback", makeRequest({
		params: { file_id: FILE_ID },
		body: { token: jwt.sign({ key: "k", status: 2, url: docServerUrl }, "wrong-secret") },
		accountability: null,
	}));
	assert.equal(res.body.error, 1);
	assert.notEqual(res.statusCode, 200);
	assert.equal(state.uploads.length, 0);
});

test("settings: endpoint returns stored settings", async () => {
	state = createState();
	const res = await call("GET", "/settings", makeRequest());
	assert.equal(res.body.doc_server_public_url, "https://docs.example.test");
	assert.equal(res.body.version, pkg.version);
});
