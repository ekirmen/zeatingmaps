import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "jsr:@supabase/supabase-js@^2";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

function handleOptions() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return handleOptions();
  }

  try {
    const authHeader = req.headers.get("Authorization") || "";

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      {
        global: {
          headers: { Authorization: authHeader },
        },
      },
    );

    const { operation = "PUT", path = "/", data } = await req.json();
    console.log("[firebase-direct] Request", { operation, path, data });

    // Fetch Firebase credentials stored in the settings table
    const { data: settings, error: settingsErr } = await supabaseClient
      .from("settings")
      .select("key, value")
      .in("key", ["firebase-db-url", "firebase-secret-key"]);

    if (settingsErr) {
      throw new Error(settingsErr.message);
    }

    const creds = Object.fromEntries(
      settings?.map((s: { key: string; value: string }) => [s.key, s.value]) || []
    );

    const dbUrl = creds["firebase-db-url"];
    const secret = creds["firebase-secret-key"];

    if (!dbUrl || !secret) {
      throw new Error("Missing Firebase configuration in settings table");
    }

    const normalizedUrl = dbUrl.endsWith("/") ? dbUrl.slice(0, -1) : dbUrl;
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    const url = `${normalizedUrl}${normalizedPath}.json?auth=${secret}`;
    console.log("[firebase-direct] Sending", operation, "to", url);
    if (data) console.log("[firebase-direct] Payload", data);

    const firebaseRes = await fetch(url, {
      method: operation,
      headers: { "Content-Type": "application/json" },
      body: operation === "DELETE" ? undefined : JSON.stringify(data),
    });

    const firebaseJson = await firebaseRes.json();
    console.log("[firebase-direct] Firebase response", firebaseJson);

    return new Response(
      JSON.stringify({
        success: firebaseRes.ok,
        status: firebaseRes.status,
        firebase: firebaseJson,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("firebase-direct error", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 },
    );
  }
});
