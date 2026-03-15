module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:import/errors",
    "plugin:import/warnings",
    "plugin:import/typescript",
    "google",
    "plugin:@typescript-eslint/recommended",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: ["tsconfig.json", "tsconfig.dev.json"],
    sourceType: "module",
  },
  ignorePatterns: [
    "/lib/**/*", // Ignore built files.
  ],
  plugins: [
    "@typescript-eslint",
    "import",
  ],
  rules: {
    // Modern Enterprise Overrides
    "quotes": "off", // Allow both single and double quotes
    "max-len": "off", // Disable the archaic 80-character limit
    "comma-dangle": "off", // Don't fail builds over a missing comma at the end of an array
    "@typescript-eslint/no-explicit-any": "off", // Allow 'any' types for unpredictable Graph API payloads
    "object-curly-spacing": "off",
    "indent": "off"
  },
};
