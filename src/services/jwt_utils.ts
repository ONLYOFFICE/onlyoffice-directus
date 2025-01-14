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

import jwt from "jsonwebtoken";

export class JwtUtils {
    private settings: any;

    constructor(settings: any) {
        this.settings = settings;
    }

    public sign(payload: any): string {
        return this.isJwtEnabled()
            ? jwt.sign(payload, this.getJwtSecret(), this.getDefaultJwtOptions())
            : "";
    }

    public verifyHeaders(headers: any) {
        if (!this.isJwtEnabled()) return;

        let header = headers[this.getJwtHeader()];
        if (header) header = header.substring("Bearer ".length);
        jwt.verify(header, this.getJwtSecret());
    }

    public verifyBody(body: any): any {
        if (!this.isJwtEnabled()) return body;

        return jwt.verify(body.token, this.getJwtSecret());
    }

    private isJwtEnabled(): boolean {
        return !!this.settings.doc_server_jwt_secret;
    }

    private getJwtSecret(): string {
        return this.settings.doc_server_jwt_secret;
    }

    private getJwtHeader(): string {
        return this.settings.doc_server_jwt_header
            ? this.settings.doc_server_jwt_header.toLowerCase()
            : "authorization";
    }

    private getDefaultJwtOptions(): jwt.SignOptions {
        return {
            expiresIn: "10m"
        };
    }
}