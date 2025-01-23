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

import formats from "../assets/document-formats/onlyoffice-docs-formats.json"

interface DocumentFormat {
    name: string
    type: string
    actions: DocumentAction[]
    convert: string[]
    mime: string[]
}

enum DocumentAction {
    AutoConvert = "auto-convert",
    Edit = "edit",
    Fill = "fill",
    LossyEdit = "lossy-edit",
    View = "view",
}

function getFormatByExtension(fileExt: string): DocumentFormat {
    return formats.filter(format => format.name == fileExt)[0] as DocumentFormat;
}

export default {
    DocumentAction,
    getFormatByExtension
}
export type {
    DocumentFormat,
}
