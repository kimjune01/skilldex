/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_NAME?: string;
  readonly VITE_APP_TAGLINE?: string;
  readonly VITE_APP_LOGO_URL?: string;
  readonly VITE_APP_FAVICON_URL?: string;
  readonly VITE_APP_PRIMARY_COLOR?: string;
  readonly VITE_APP_SUPPORT_EMAIL?: string;
  readonly VITE_APP_WEBSITE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
