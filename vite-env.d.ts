/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_HE_BASE_URL: string;
  readonly VITE_SITE_MODE: "static" | "default";
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
