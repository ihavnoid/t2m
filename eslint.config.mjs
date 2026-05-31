import js from "@eslint/js";
import globals from "globals";

export default [
    js.configs.recommended,
    {
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: "module",
            globals: {
                ...globals.browser,
                ...globals.jquery,
                ...globals.node,
                Kinetic: "readonly",
                d3: "readonly",
                difflib: "readonly",
                __serverBase__: "readonly",
                globals: "readonly",
                confirm: "readonly",
                alert: "readonly",
                EventSource: "readonly",
            },
        },
        rules: {
            "no-unused-vars": "warn",
            "no-undef": "error",
            "no-constant-condition": "warn",
        },
    },
];
