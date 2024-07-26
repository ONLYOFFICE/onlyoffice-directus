function getEditorTemplate(settings: any) {
    const editorTemplate = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Document</title>
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
                window.docEditor = new DocsAPI.DocEditor("placeholder", {
                    "document": {
                        "fileType": "docx",
                        "key": "E7FAFC9C22A8",
                        "title": "Example Document Title.docx",
                        "url": "https://github.com/ONLYOFFICE/document-templates/raw/master/sample/sample.docx"
                    },
                    "documentType": "word",
                    "editorConfig": {
                    },
                    "height": "100%",
                    "width": "100%"
                });
            </script>
        </body>
        </html>
    `;

    return editorTemplate;
}

function sanitizeUrl(url: string) {
    if (url.endsWith("/")) return url;
    return url + "/";
}

export default getEditorTemplate;