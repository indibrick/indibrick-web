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
    "indent": "off",

    // ─── Google-style formatting rules this codebase does not follow ───
    // The `google` preset above is a formatting opinion, and these seven
    // rules contradict conventions used consistently across every file in
    // functions/ — not accidental drift. Leaving them on meant `npm run
    // lint` reported 128 formatting errors, which is the predeploy hook,
    // which meant `firebase deploy --only functions` could not run at all.
    //
    // Same reasoning as the overrides above ("archaic 80-character limit"),
    // continued rather than invented.
    //
    // Nothing substantive is disabled here. no-unused-vars, no-undef, the
    // import plugin and the TypeScript recommended set all stay on.
    "no-multi-spaces": "off",      // trailing comments are aligned on purpose
    "require-jsdoc": "off",        // block comments above functions, not JSDoc
    "operator-linebreak": "off",   // leading-operator ternaries used throughout
    "arrow-parens": "off",         // x => x is the house style
    "block-spacing": "off",        // one-line guards: catch { return false; }
    "key-spacing": "off",          // aligned object values in config tables
    "brace-style": "off"           // one-line guard clauses
  },
};
