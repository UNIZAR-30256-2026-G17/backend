const js = require("@eslint/js");
const jest = require("eslint-plugin-jest");
const n = require("eslint-plugin-n");
const prettier = require("eslint-config-prettier");
const globals = require("globals");

module.exports = [
  js.configs.recommended,
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "commonjs",
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
    plugins: {
      jest: jest,
      n: n,
    },
    rules: {
      ...n.configs.recommended.rules,
      ...jest.configs.recommended.rules,
      ...prettier.rules,
      "no-console": "warn",
      "n/no-unsupported-features/es-syntax": "off",
      "jest/expect-expect": "warn",
      "jest/no-disabled-tests": "warn",
    },
  },
  {
    files: ["test/**/*.js", "eslint.config.js"],
    rules: {
      "n/no-unpublished-require": "off",
      "n/no-extraneous-require": "off",
    },
  },
  {
    ignores: ["node_modules/", "logs/", "coverage/", ".env"],
  },
];
