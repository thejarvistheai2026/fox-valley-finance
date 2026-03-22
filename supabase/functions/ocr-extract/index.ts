/**
 * Fox Valley Finance Tracker - OCR Extract Edge Function
 * 
 * Receives receipt images (base64 or storage URL), calls Claude API for extraction,
 * and returns structured receipt data.
 * 
 * Handles Ontario HST (split 5/13 federal, 8/13 provincial) and Quebec GST/QST.
 * Includes retry logic and error handling.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// CORS headers for browser clients
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Claude API configuration
const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";
const CLAUDE_MODEL = "claude-3-sonnet-20240229"; // Using Sonnet for good accuracy/cost balance

// Maximum retry attempts
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 2000;

/**
 * Interface for the extraction result
 */
interface ExtractionResult {
  vendor_name: string | null;
  date: string | null; // YYYY-MM-DD format
  subtotal: number | null;
  gst_amount: number | null;
  pst_amount: number | null;
  tax_total: number | null;
  total: number | null;
  vendor_ref: string | null;
  tax_province: "ON" | "QC" | null;
  confidence: "high" | "medium" | "low" | "failed";
}

/**
 * Main request handler
 */
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get API key from environment
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY not configured");
    }

    // Parse request body
    const body = await req.json();
    const { image, storagePath, mimeType = "image/jpeg" } = body;

    // Validate input - need either base64 image or storage path
    if (!image && !storagePath) {
      return new Response(
        JSON.stringify({
          error: "Missing required field: provide either 'image' (base64) or 'storagePath'",
          result: getEmptyResult("failed"),
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get image data (either from base64 or fetch from storage)
    let imageData: string;
    let actualMimeType: string = mimeType;

    if (image) {
      // Base64 image provided directly
      imageData = image;
    } else if (storagePath) {
      // Fetch from Supabase Storage
      const storageResult = await fetchFromStorage(storagePath);
      if (!storageResult.success) {
        return new Response(
          JSON.stringify({
            error: storageResult.error,
            result: getEmptyResult("failed"),
          }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      imageData = storageResult.data!;
      actualMimeType = storageResult.mimeType || mimeType;
    } else {
      throw new Error("Unexpected state: no image data");
    }

    // Call Claude API with retry logic
    const result = await extractReceiptData(imageData, actualMimeType, apiKey);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("OCR extraction failed:", error);
    
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
        result: getEmptyResult("failed"),
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

/**
 * Fetch image from Supabase Storage
 */
async function fetchFromStorage(storagePath: string): Promise<{ 
  success: boolean; 
  data?: string; 
  mimeType?: string;
  error?: string;
}> {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return { success: false, error: "Supabase credentials not configured" };
    }

    // Fetch file from storage using service role key
    const response = await fetch(`${supabaseUrl}/storage/v1/object/documents/${storagePath}`, {
      headers: {
        "Authorization": `Bearer ${supabaseServiceKey}`,
      },
    });

    if (!response.ok) {
      return { success: false, error: `Failed to fetch from storage: ${response.statusText}` };
    }

    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    
    return {
      success: true,
      data: base64,
      mimeType: blob.type,
    };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Storage fetch failed" 
    };
  }
}

/**
 * Call Claude API to extract receipt data with retry logic
 */
async function extractReceiptData(
  base64Image: string, 
  mimeType: string, 
  apiKey: string,
  attempt: number = 0
): Promise<{ result: ExtractionResult }> {
  try {
    // Build the Claude API request
    const prompt = buildExtractionPrompt();

    const response = await fetch(CLAUDE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 1000,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt,
              },
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: mimeType as "image/jpeg" | "image/png" | "image/webp" | "image/gif",
                  data: base64Image,
                },
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Claude API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.content?.[0]?.text || "";

    // Parse the JSON response from Claude
    const result = parseClaudeResponse(content);
    
    return { result };

  } catch (error) {
    console.error(`Attempt ${attempt + 1} failed:`, error);
    
    // Retry logic
    if (attempt < MAX_RETRIES) {
      console.log(`Retrying in ${RETRY_DELAY_MS}ms...`);
      await sleep(RETRY_DELAY_MS);
      return extractReceiptData(base64Image, mimeType, apiKey, attempt + 1);
    }
    
    // All retries exhausted - return failed result
    return { result: getEmptyResult("failed") };
  }
}

/**
 * Build the extraction prompt for Claude
 */
function buildExtractionPrompt(): string {
  return `You are a receipt/invoice data extractor for Canadian documents.

Extract the following fields from the attached image and return valid JSON only:

{
  "vendor_name": string | null,
  "date": "YYYY-MM-DD" | null,
  "subtotal": number | null,
  "gst_amount": number | null,
  "pst_amount": number | null,
  "tax_total": number | null,
  "total": number | null,
  "vendor_ref": string | null,
  "tax_province": "ON" | "QC" | null,
  "confidence": "high" | "medium" | "low"
}

TAX HANDLING RULES:

1. ONTARIO (ON):
   - Look for a single "HST" line
   - HST is 13% total (5% federal GST + 8% provincial)
   - Split HST: gst_amount = HST × 5/13, pst_amount = HST × 8/13
   - Example: HST = $130.00 → gst_amount = $50.00, pst_amount = $80.00
   - Set tax_province to "ON"

2. QUEBEC (QC):
   - Look for separate "GST" and "QST" lines
   - GST is 5% federal
   - QST is 9.975% provincial
   - Set gst_amount to the GST amount
   - Set pst_amount to the QST amount
   - Set tax_province to "QC"

3. If you see both GST and PST/HST separately:
   - Likely Ontario with separate lines
   - gst_amount = GST amount
   - pst_amount = PST amount
   - tax_province = "ON"

VENDOR_REF:
- This is the invoice number, receipt number, or transaction number printed on the document
- Look for: "Invoice #", "Receipt #", "Transaction #", "Order #", "Bill #", etc.
- Extract just the number/reference, not the label

CONFIDENCE RULES:
- "high": All numeric fields clearly visible, vendor name clear, date clear
- "medium": Most fields visible but some unclear or had to infer
- "low": Many fields unclear, illegible, or partially visible

IMPORTANT:
- Return ONLY the JSON object, no markdown formatting, no backticks
- Use null for any field that is not visible or legible
- Do not guess amounts - if unclear, use null
- Dates must be in YYYY-MM-DD format
- Amounts should be numbers (not strings), without $ symbol
- If total tax is shown but not broken down, and province is ON, calculate the split
- If province cannot be determined from tax format, use null for tax_province`;
}

/**
 * Parse Claude's response into structured data
 */
function parseClaudeResponse(content: string): ExtractionResult {
  try {
    // Extract JSON from response (in case there's extra text)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Validate and normalize the result
    const result: ExtractionResult = {
      vendor_name: normalizeString(parsed.vendor_name),
      date: normalizeDate(parsed.date),
      subtotal: normalizeAmount(parsed.subtotal),
      gst_amount: normalizeAmount(parsed.gst_amount),
      pst_amount: normalizeAmount(parsed.pst_amount),
      tax_total: null,
      total: normalizeAmount(parsed.total),
      vendor_ref: normalizeString(parsed.vendor_ref),
      tax_province: normalizeProvince(parsed.tax_province),
      confidence: normalizeConfidence(parsed.confidence),
    };

    // Calculate tax_total from gst + pst if both present
    if (result.gst_amount !== null && result.pst_amount !== null) {
      result.tax_total = roundToCents(result.gst_amount + result.pst_amount);
    } else if (parsed.tax_total !== null && parsed.tax_total !== undefined) {
      result.tax_total = normalizeAmount(parsed.tax_total);
    }

    // Auto-calculate missing subtotal if we have total and tax
    if (result.subtotal === null && result.total !== null && result.tax_total !== null) {
      result.subtotal = roundToCents(result.total - result.tax_total);
    }

    // Auto-calculate missing total if we have subtotal and tax
    if (result.total === null && result.subtotal !== null && result.tax_total !== null) {
      result.total = roundToCents(result.subtotal + result.tax_total);
    }

    return result;

  } catch (error) {
    console.error("Failed to parse Claude response:", error);
    console.error("Raw content:", content);
    return getEmptyResult("low");
  }
}

/**
 * Normalize string fields
 */
function normalizeString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const str = String(value).trim();
  if (str === "" || str.toLowerCase() === "null") return null;
  return str;
}

/**
 * Normalize date to YYYY-MM-DD format
 */
function normalizeDate(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const str = String(value).trim();
  if (str === "") return null;

  // Check if already in YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }

  // Try to parse various formats
  const date = new Date(str);
  if (isNaN(date.getTime())) {
    return null;
  }

  // Convert to YYYY-MM-DD
  return date.toISOString().split("T")[0];
}

/**
 * Normalize amount to number with 2 decimal places
 */
function normalizeAmount(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  
  if (typeof value === "number") {
    if (isNaN(value) || value < 0) return null;
    return roundToCents(value);
  }

  // Parse string amounts (remove $, commas, etc.)
  const str = String(value)
    .replace(/[$,\s]/g, "") // Remove $, commas, spaces
    .replace(/\([^)]*\)/g, ""); // Remove parenthetical content like (CAD)

  const num = parseFloat(str);
  if (isNaN(num) || num < 0) return null;
  
  return roundToCents(num);
}

/**
 * Round to 2 decimal places (cents)
 */
function roundToCents(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Normalize province to ON or QC
 */
function normalizeProvince(value: unknown): "ON" | "QC" | null {
  if (value === null || value === undefined) return null;
  const str = String(value).toUpperCase().trim();
  
  if (str === "ON" || str === "ONTARIO" || str === "ONT" || str === "O.N.") {
    return "ON";
  }
  if (str === "QC" || str === "QUEBEC" || str === "QUE" || str === "Q.C.") {
    return "QC";
  }
  return null;
}

/**
 * Normalize confidence level
 */
function normalizeConfidence(value: unknown): "high" | "medium" | "low" | "failed" {
  if (value === null || value === undefined) return "low";
  const str = String(value).toLowerCase().trim();
  
  if (str === "high") return "high";
  if (str === "medium") return "medium";
  if (str === "failed") return "failed";
  return "low";
}

/**
 * Get empty result for failed extractions
 */
function getEmptyResult(confidence: "high" | "medium" | "low" | "failed"): ExtractionResult {
  return {
    vendor_name: null,
    date: null,
    subtotal: null,
    gst_amount: null,
    pst_amount: null,
    tax_total: null,
    total: null,
    vendor_ref: null,
    tax_province: null,
    confidence,
  };
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
