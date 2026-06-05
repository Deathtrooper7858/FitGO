import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Auth Header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const EDAMAM_APP_ID = Deno.env.get("EDAMAM_APP_ID");
    const EDAMAM_APP_KEY = Deno.env.get("EDAMAM_APP_KEY");
    
    if (!EDAMAM_APP_ID || !EDAMAM_APP_KEY) {
      console.error("[Edamam Proxy] Error: EDAMAM_APP_ID or EDAMAM_APP_KEY is not configured in Supabase secrets.");
      return new Response(
        JSON.stringify({ error: "Edamam API credentials are not configured in Supabase secrets." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body for query parameters
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (e) {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body", details: e.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const query = requestBody.query;
    if (!query) {
       return new Response(
        JSON.stringify({ error: "Missing 'query' parameter" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const url = `https://api.edamam.com/api/food-database/v2/parser?app_id=${EDAMAM_APP_ID}&app_key=${EDAMAM_APP_KEY}&ingr=${encodeURIComponent(query)}&nutrition-type=cooking`;
    
    console.log(`[Edamam Proxy] Forwarding request for query: ${query}`);

    const edamamResponse = await fetch(url, {
      method: "GET",
      headers: {
        "Accept": "application/json"
      }
    });

    const responseText = await edamamResponse.text();
    let edamamData;
    try {
      edamamData = JSON.parse(responseText);
    } catch (e) {
      edamamData = { error: "Non-JSON response from Edamam", raw: responseText };
    }

    if (!edamamResponse.ok) {
      console.error(`[Edamam Proxy] Edamam API error (${edamamResponse.status}):`, JSON.stringify(edamamData));
      return new Response(JSON.stringify(edamamData), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: edamamResponse.status,
      });
    }

    return new Response(JSON.stringify(edamamData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("[Edamam Proxy] Internal Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
