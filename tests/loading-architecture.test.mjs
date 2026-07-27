import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("keeps Supabase loading bounded and outside the root layout", async () => {
  const [
    rootLayout,
    storeLayout,
    serverRepository,
    browserClient,
    requestTimeout,
  ] = await Promise.all([
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/(store)/layout.tsx", import.meta.url), "utf8"),
    readFile(
      new URL("../features/catalog/server-repository.ts", import.meta.url),
      "utf8",
    ),
    readFile(new URL("../lib/supabase/client.ts", import.meta.url), "utf8"),
    readFile(
      new URL("../lib/supabase/request-timeout.ts", import.meta.url),
      "utf8",
    ),
  ]);

  assert.doesNotMatch(rootLayout, /loadPublicCatalog/);
  assert.match(storeLayout, /loadPublicCatalog/);
  assert.match(serverRepository, /process\.env\.NODE_ENV === "development"/);
  assert.match(serverRepository, /abortSignal\(signal\)/);
  assert.match(browserClient, /if \(browserClient\)/);
  assert.match(browserClient, /browserClient = createBrowserClient/);
  assert.match(requestTimeout, /Promise\.race/);
  assert.match(requestTimeout, /controller\.abort\(\)/);
});
