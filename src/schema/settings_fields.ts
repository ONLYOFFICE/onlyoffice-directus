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
            special: null
        },
        schema: {
            is_nullable : false,
        },
    }
];