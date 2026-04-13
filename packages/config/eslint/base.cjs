module.exports = {
  root: false,
  env: {
    browser: true,
    es2023: true,
    node: true
  },
  extends: ["next/core-web-vitals", "next/typescript"],
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module"
  },
  rules: {
    "no-console": ["warn", { "allow": ["warn", "error"] }]
  }
};
