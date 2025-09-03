import type { Config } from "@react-router/dev/config";

export default {
  // SPA mode is better for Puter-based applications
  // as all APIs are client-side (auth, storage, AI)
  ssr: false,
} satisfies Config;
