// sync_auth_users/index.ts
import { createClient } from "npm:@supabase/supabase-js@2.30.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

const PAGE_SIZE = 100; // adjust as needed
const UPSERT_BATCH = 50;

async function* listAllAuthUsers() {
  // supabase-js admin auth listUsers uses pagination via nextPageToken
  let page = 0;
  let resp = await supabase.auth.admin.listUsers({ perPage: PAGE_SIZE, page });
  while (resp.data && resp.data.length) {
    yield resp.data;
    page += 1;
    resp = await supabase.auth.admin.listUsers({ perPage: PAGE_SIZE, page });
    if (resp.error) throw resp.error;
    if (!resp.data || resp.data.length === 0) break;
  }
}

async function batchUpsertUsers(rows: any[]) {
  // upsert in batches using the table RPC
  const { data, error } = await supabase
    .from("users")
    .upsert(rows, { onConflict: "id" })
    .select("id");
  if (error) throw error;
  return data;
}

Deno.serve(async (req: Request) => {
  try {
    let inserted = 0;
    let updated = 0;
    for await (const page of listAllAuthUsers()) {
      // transform and chunk
      const upsertRows = page.map((u: any) => {
        const email = u.email ?? "";
        const username = (u.raw_user_meta_data && (u.raw_user_meta_data as any).username) || (email ? email.split("@")[0] : null);
        return {
          id: u.id,
          email,
          username,
          created_at: u.created_at ?? new Date().toISOString(),
          updated_at: u.updated_at ?? new Date().toISOString()
        };
      });

      // chunked upserts
      for (let i = 0; i < upsertRows.length; i += UPSERT_BATCH) {
        const chunk = upsertRows.slice(i, i + UPSERT_BATCH);
        const res = await batchUpsertUsers(chunk);
        // best-effort counting: res returns rows; we treat them as updated/inserted collectively
        if (Array.isArray(res)) {
          // can't reliably differentiate insert vs update; approximate
          updated += res.length;
        }
      }
    }

    return new Response(JSON.stringify({ ok: true, inserted: 0, updated }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("sync error:", err);
    return new Response(JSON.stringify({ error: err.message || String(err) }), { status: 500 });
  }
});