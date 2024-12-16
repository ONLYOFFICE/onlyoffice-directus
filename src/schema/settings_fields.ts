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
    }
];