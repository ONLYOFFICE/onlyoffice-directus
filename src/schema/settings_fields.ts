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

export default [
    {
        field: "id",
        type: "integer",
        meta: {
            hidden: true,
            interface: "numeric",
            readonly: true,
        },
        schema: {
            is_primary_key: true,
            has_auto_increment: true,
        },
    },
    {
        field: "doc_server_public_url",
        type: "string",
        meta: {
            special: null,
            interface: "input",
        },
        schema: {
            is_nullable: false,
        },
    },
    {
        field: "doc_server_jwt_secret",
        type: "string",
        meta: {
            special: null,
            interface: "input",
            options: {
                masked: true,
            }
        },
        schema: {
            is_nullable: true
        }
    },
    {
        field: "doc_server_jwt_header",
        type: "string",
        meta: {
            special: null,
            interface: "input",
        },
        schema: {
            is_nullable: true
        }
    },
    {
        field: "directus_jwt_secret",
        type: "string",
        meta: {
            special: null,
            hidden: true,
            required: true,
            interface: "input",
            options: {
                masked: true,
            }
        },
        schema: {
            is_nullable: false,
            default_value: "secret"
        }
    },
    {
        field: "version",
        type: "string",
        meta: {
            special: null,
            hidden: true,
            readonly: true,
            interface: "input",
        },
        schema: {
            is_nullable: true,
            default_value: "1.0.0"
        }
    }
];