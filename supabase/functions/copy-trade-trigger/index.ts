/**
 * Copy Trade Trigger Function
 * Automatically executes copy trades when a trader opens a position
 * Triggered by database events (pool_positions INSERT)
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the event data (from database trigger)
    const { record } = await req.json();
    const { wallet_address, contribute_id, shares, cost_basis } = record;

    if (!wallet_address || !contribute_id || !shares || !cost_basis) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Find all active copy trades for this trader
    const { data: copyTrades, error: copyTradesError } = await supabase
      .from("copy_trades")
      .select("*")
      .eq("copied_address", wallet_address.toLowerCase())
      .eq("active", true);

    if (copyTradesError) {
      throw copyTradesError;
    }

    if (!copyTrades || copyTrades.length === 0) {
      return new Response(
        JSON.stringify({ message: "No active copy trades found" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get contribute details to find contract_post_id
    const { data: contribute, error: contributeError } = await supabase
      .from("contributes")
      .select("contract_post_id, pool_enabled")
      .eq("id", contribute_id)
      .single();

    if (contributeError || !contribute || !contribute.pool_enabled || !contribute.contract_post_id) {
      return new Response(
        JSON.stringify({ message: "Contribute not available for copy trading" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const contractPostId = contribute.contract_post_id;
    const amount = BigInt(Math.floor(Number(cost_basis) * 1e18));

    // Execute copy trades for each copier
    const results = [];
    for (const copyTrade of copyTrades) {
      try {
        let copyAmount = amount;

        // Apply max amount limit if set
        if (copyTrade.max_amount_per_trade) {
          const maxAmount = BigInt(Math.floor(Number(copyTrade.max_amount_per_trade) * 1e18));
          copyAmount = copyAmount > maxAmount ? maxAmount : copyAmount;
        }

        // Log the copy trade execution (actual execution would be done via smart contract)
        // For now, we just log it - the frontend will handle the actual transaction
        results.push({
          copier: copyTrade.copier_address,
          amount: copyAmount.toString(),
          success: true,
        });

        // In production, you would call the smart contract here
        // await executeBuyTransaction(copyTrade.copier_address, contractPostId, copyAmount);
      } catch (error) {
        results.push({
          copier: copyTrade.copier_address,
          error: error instanceof Error ? error.message : "Unknown error",
          success: false,
        });
      }
    }

    return new Response(
      JSON.stringify({
        message: "Copy trades processed",
        results,
        total: copyTrades.length,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[copy-trade-trigger] Error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

