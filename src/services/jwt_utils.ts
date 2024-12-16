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