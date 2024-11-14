import stylisticTs from '@stylistic/eslint-plugin';
import importPlugin from 'eslint-plugin-import';
import parser from '@typescript-eslint/parser';

export default [{
    files: ["**/*.ts"],

    plugins: {
        '@stylistic/ts': stylisticTs,
        'import': importPlugin,
    },

    languageOptions: {
      parser,
      parserOptions: {
          project: "./tsconfig.json",
      },
    },
    rules: {
        "import/no-deprecated": "warn",
        "no-use-before-define": "off",
        '@stylistic/ts/semi': 'error',
        "@typescript-eslint/no-empty-function": "off",
        // "@typescript-eslint/member-ordering": "error",
        // "@typescript-eslint/no-misused-new": "error",
        // "@typescript-eslint/no-non-null-assertion": "error",
        // "@typescript-eslint/prefer-function-type": "error",
        // "@typescript-eslint/type-annotation-spacing": "error",
        // "@typescript-eslint/unified-signatures": "error",
        "arrow-body-style": "error",
        "comma-dangle": ["error", "always-multiline"],
        camelcase: "off",
        "constructor-super": "error",
        curly: "error",
        "dot-notation": "off",
        "eol-last": "error",
        eqeqeq: ["error", "smart"],
        "guard-for-in": "error",
        "id-blacklist": "off",
        "id-match": "off",
        "import/no-deprecated": "warn",

        "max-len": ["error", {
            code: 140,
        }],

        "no-bitwise": "error",
        "no-caller": "error",

        "no-console": ["error", {
            allow: ["warn"],
        }],

        "no-debugger": "error",
        "no-empty": "off",
        "no-eval": "error",
        "no-fallthrough": "error",
        "no-new-wrappers": "error",
        "no-shadow": "off",
        "no-throw-literal": "error",
        "no-trailing-spaces": "error",
        "no-undef-init": "error",
        "no-underscore-dangle": "off",
        "no-unused-expressions": "error",
        "no-unused-labels": "error",
        "no-unused-vars": ["error", {
          "vars": "all",
          "args": "none",
          "caughtErrors": "all",
          "ignoreRestSiblings": false,
          "reportUsedIgnorePattern": false
        }],
        "no-var": "error",
        "prefer-const": "error",
        radix: "error",
        "spaced-comment": "error",
        "promise/param-names": "off",
        "newline-before-return": "error",
        "@stylistic/ts/indent": ["error", 2],
        "@typescript-eslint/class-name-casing": "off",
    },
}];
