import { createDojoConfig } from "@dojoengine/core";

import manifest from "../contract/manifest_dev.json";

export const dojoConfig = createDojoConfig({
  manifest,
  rpcUrl: "https://127.0.0.1:5050",

});
