import { Env } from './types';

interface AIResponse {
  total_amount?: number;
  description?: string;
}

interface R2Response {
  url: string;
}

// Vision models in order of preference
const VISION_MODELS = [
  "openai/gpt-4-vision-preview",
  "anthropic/claude-3-haiku",
  "google/gemini-pro-vision",
];

export async function uploadToR2(
  file: ArrayBuffer,
  env: Env
): Promise<string> {
  try {
    // Generate a unique filename using timestamp and random string
    const timestamp = new Date().getTime();
    const randomString = Math.random().toString(36).substring(7);
    const filename = `bills/${timestamp}-${randomString}.jpg`;

    // Upload to R2
    await env.R2_BUCKET.put(filename, file, {
      httpMetadata: {
        contentType: 'image/jpeg',
      },
    });

    // Generate public URL
    const url = `https://${env.R2_BUCKET.name}.r2.dev/${filename}`;
    return url;
  } catch (error) {
    // Use error.toString() instead of console.error for Workers environment
    throw new Error(`Failed to upload image to R2: ${error}`);
  }
}

async function generateCloudinarySignature(
  params: Record<string, any>,
  apiSecret: string
): Promise<string> {
  const encoder = new TextEncoder();
  const data = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('&') + apiSecret;

  const buffer = await crypto.subtle.digest(
    'SHA-1',
    encoder.encode(data)
  );

  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function analyzeImageWithOpenRouter(
  imageBase64: string,
  model: string,
  env: Env
): Promise<AIResponse | null> {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': env.SITE_NAME,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'This is a receipt or bill image. Please extract and return ONLY the following information in JSON format: 1. total_amount (as a float), 2. description (brief description of what the bill is for based on items or merchant name). Return ONLY the JSON, no other text.'
              },
              {
                type: 'image',
                image: `data:image/jpeg;base64,${imageBase64}`
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    return JSON.parse(content) as AIResponse;
  } catch (error) {
    // Use error.toString() instead of console.error for Workers environment
    throw new Error(`Error with ${model}: ${error}`);
  }
}

export async function analyzeImageWithFallbacks(
  file: ArrayBuffer,
  env: Env
): Promise<AIResponse | null> {
  const imageBase64 = btoa(
    String.fromCharCode(...new Uint8Array(file))
  );

  // Try each model in sequence
  for (const model of VISION_MODELS) {
    try {
      const result = await analyzeImageWithOpenRouter(imageBase64, model, env);
      if (result && result.total_amount) {
        return result;
      }
    } catch (error) {
      // Use error.toString() instead of console.error for Workers environment
      throw new Error(`Error with ${model}: ${error}`);
    }
  }

  return null;
}

export async function processBillImage(
  file: ArrayBuffer,
  env: Env
): Promise<{
  imageUrl: string;
  amount?: number;
  description?: string;
}> {
  // Upload image to R2
  const imageUrl = await uploadToR2(file, env);

  // Analyze image with AI
  const analysis = await analyzeImageWithFallbacks(file, env);

  return {
    imageUrl,
    amount: analysis?.total_amount,
    description: analysis?.description,
  };
}
