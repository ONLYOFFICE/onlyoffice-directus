import * as constants from "../constants/constants";
import settings_fields from "./settings_fields";

export default {
    collection: constants.ONLYOFFICE_SETIINGS_COLLECTION_KEY,
    meta: {
        note: "ONLYOFFICE Settings",
        hidden: true,
        singleton: true,
    },
    fields: settings_fields,
    schema: {}
}