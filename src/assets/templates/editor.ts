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

                if (!config.editorConfig.customization.uiTheme) {
                    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                        config.editorConfig.customization.uiTheme = "default-dark";
                    }
                }

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