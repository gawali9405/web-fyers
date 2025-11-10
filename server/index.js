import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";

// Import Fyers API
import { fyersModel } from 'fyers-api-v3';
import crypto from 'crypto';

const app = express();

// Function to generate appIdHash in the format expected by Fyers API v3
const generateAppIdHash = (appId, appSecret) => {
  const data = `${appId}:${appSecret}`;
  const hash = crypto.createHash('sha256').update(data).digest('hex');
  return hash; // Return hex string directly as expected by Fyers API
};
const PORT = process.env.PORT || 4000;

// Load environment variables
const { 
  FYERS_APP_ID: APP_ID, 
  FYERS_SECRET_KEY: APP_SECRET, 
  FYERS_REDIRECT_URI: REDIRECT_URI, 
  FRONTEND_URL 
} = process.env;

// Log environment variables for debugging
console.log('APP_ID:', APP_ID);
console.log('REDIRECT_URI:', REDIRECT_URI);

// Initialize Fyers SDK
const fyers = new fyersModel();
fyers.setAppId(APP_ID);
fyers.setRedirectUrl(REDIRECT_URI);

// Generate auth URL with required parameters
const generateAuthUrl = (state = 'xyz123') => {
  return `https://api-t1.fyers.in/api/v3/generate-authcode?client_id=${APP_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&state=${state}`;
};

let accessToken = null;
let refreshToken = null;

// CORS setup
app.use(
  cors({
    origin: FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Security headers (basic)
app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; " +
    "font-src 'self' https://r2cdn.perplexity.ai; " +
    "connect-src 'self' https://api.fyers.in https://api-t1.fyers.in https://api-t2.fyers.in; " +
    "style-src 'self' 'unsafe-inline' https://r2cdn.perplexity.ai;"
  );
  next();
});

// ---- ROUTES ----

// 1️⃣ Login route → redirect to Fyers auth page
app.get("/login", (req, res) => {
  try {
    const authUrl = generateAuthUrl();
    console.log("[LOGIN] Redirecting user to Fyers:", authUrl);
    res.redirect(authUrl);
  } catch (err) {
    console.error("[LOGIN ERROR]", err);
    res.status(500).json({ error: "Failed to generate Fyers login URL" });
  }
});

// 2️⃣ Callback route → exchange auth_code for tokens
app.get("/callback", async (req, res) => {
  console.log("[CALLBACK] Query params:", req.query);

  const authCode = req.query.auth_code || req.query.code;
  if (!authCode) {
    console.warn("[CALLBACK] Missing auth_code!");
    return res.status(400).json({ error: "Missing auth_code" });
  }

  console.log("[CALLBACK] Attempting to exchange auth code for token...");
  
  try {
    const tokenParams = {
      secret_key: APP_SECRET,
      code: authCode,
      grant_type: "authorization_code"
    };
    
    console.log("[CALLBACK] Token request params:", {
      ...tokenParams,
      secret_key: '***' // Don't log the actual secret
    });
    
    // For Fyers API v3, we need to use the token endpoint directly
    const appIdHash = generateAppIdHash(APP_ID, APP_SECRET);
    console.log('[CALLBACK] Generated appIdHash:', appIdHash);
    
    // Use the fyersModel's generate_access_token method which handles the request format correctly
    const tokenResponse = await fyers.generate_access_token({
      client_id: APP_ID,
      secret_key: APP_SECRET,
      auth_code: authCode
    });
    console.log("[CALLBACK] Token response received:", {
      ...tokenResponse,
      access_token: tokenResponse?.access_token ? '***' : undefined,
      refresh_token: tokenResponse?.refresh_token ? '***' : undefined
    });

    if (!tokenResponse || !tokenResponse.access_token) {
      console.error("[CALLBACK] Invalid token response:", tokenResponse);
      return res.status(500).json({ 
        error: "Invalid response from Fyers",
        details: tokenResponse?.message || "No access token in response"
      });
    }

    accessToken = tokenResponse.access_token;
    refreshToken = tokenResponse.refresh_token;

    console.log("[CALLBACK] Token generated successfully");
    // Redirect to frontend with token
    res.redirect(`${FRONTEND_URL}/?access_token=${accessToken}`);
  } catch (err) {
    console.error("[CALLBACK ERROR] Failed to generate token:", {
      name: err.name,
      message: err.message,
      stack: err.stack,
      response: err.response?.data
    });
    res.status(500).json({ 
      error: "Failed to generate access token",
      details: {
        message: err.message,
        name: err.name,
        code: err.code
      }
    });
  }
});

// 3️⃣ Optional: fetch token from memory
app.get("/token", (req, res) => {
  if (!accessToken) {
    return res.status(401).json({ error: "No token available" });
  }
  res.json({ access_token: accessToken });
});

// 4️⃣ Generate token using fyersModel (alternative method)
app.get("/generate-token", async (req, res) => {
  const { code } = req.query;
  
  if (!code) {
    return res.status(400).json({ error: "Missing required parameter: code" });
  }

  try {
    const appIdHash = generateAppIdHash(APP_ID, APP_SECRET);
    console.log('[TOKEN GEN] Generated appIdHash:', appIdHash);
    
    // Use the fyersModel's generate_access_token method which handles the request format correctly
    const tokenResponse = await fyers.generate_access_token({
      client_id: APP_ID,
      secret_key: APP_SECRET,
      auth_code: code
    });

    if (!tokenResponse.access_token) {
      console.error("[TOKEN GEN] No access token in response:", tokenResponse);
      return res.status(500).json({ error: "Failed to generate access token" });
    }

    accessToken = tokenResponse.access_token;
    refreshToken = tokenResponse.refresh_token;
    
    console.log("[TOKEN GEN] Token generated successfully");
    res.json({
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: tokenResponse.expires_in || 86400
    });
  } catch (err) {
    console.error("[TOKEN GEN ERROR]", err);
    res.status(500).json({ 
      error: "Failed to generate token",
      details: err.message 
    });
  }
});

// 5️⃣ Health check
app.get("/", (req, res) => {
  res.send("Fyers backend is running!");
});

// ---- START SERVER ----
app.listen(PORT, () => {
  console.log(`✅ Fyers backend running at http://localhost:${PORT}`);
});