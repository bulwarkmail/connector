import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
  {
    rules: {
      // The instance list lives in localStorage and nowhere else. A cookie
      // would be sent to the server on every request, which is exactly the
      // thing this site promises not to do (README.md, "What is stored").
      "no-restricted-properties": [
        "error",
        {
          object: "document",
          property: "cookie",
          message:
            "The connector stores nothing in cookies - use src/lib/instances.ts (localStorage).",
        },
      ],
    },
  },
]);

export default eslintConfig;
