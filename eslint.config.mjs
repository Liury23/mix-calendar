import obsidianmd from "eslint-plugin-obsidianmd";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["main.js", "node_modules/", "release/"],
  },
  ...tseslint.configs.recommendedTypeChecked,
  ...obsidianmd.configs.recommended,
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // zh-first bilingual UI: the rule naive-lowercases English fragments and
      // would corrupt moment format hints ("YYYY-MM-DD" → "yyyy-mm-dd"),
      // path placeholders ("01-Daily" → "01-daily") and bilingual labels.
      "obsidianmd/ui/sentence-case": "off",
      "obsidianmd/ui/sentence-case-json": "off",
    },
  }
);
