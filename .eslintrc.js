module.exports = {
  root: true,
  env: {
    browser: true,
    node: true, // Enabled for node config files like this
    es6: true,
  },
  extends: ["eslint:recommended", "prettier", "plugin:prettier/recommended"],
  plugins: ["prettier"],
  parserOptions: {
    parser: "babel-eslint",
    ecmaVersion: 2018,
    sourceType: "module",
  },
  rules: {
    "prettier/prettier": "error",
    "no-unused-vars": "error",
    "no-console": "error",
    "no-debugger": "error",
    "comma-dangle": ["error", "only-multiline"],
  },
};
