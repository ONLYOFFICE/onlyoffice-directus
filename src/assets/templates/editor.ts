function getEditorTemplate(config: any, settings: any) {
    const editorTemplate = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${config.document.title} - ONLYOFFICE</title>
            <style>
                * {
                    margin: 0;
                    padding: 0;
                }
                
                html, body {
                    height: 100%;
                    width: 100%;
                }
            </style>
        </head>
        <body>
            <div id="placeholder" style="height: 100%"></div>
            <script type="text/javascript" src="${sanitizeUrl(settings.doc_server_public_url)}web-apps/apps/api/documents/api.js"></script>
            <script type="text/javascript">
                const config = JSON.parse('${JSON.stringify(config)}');
                console.debug("Editor Config", Object.assign({}, config));
                window.docEditor = new DocsAPI.DocEditor("placeholder", config);
            </script>
        </body>
        </html>
    `;

    return editorTemplate;
}

function sanitizeUrl(url: string) {
    if (!url) return url;
    if (url.endsWith("/")) return url;
    return url + "/";
}

export default getEditorTemplate;