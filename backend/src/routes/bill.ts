import { Hono } from 'hono';
import { Env, Variables } from '../types';

export const billRouter = new Hono<{ Bindings: Env, Variables: Variables }>();

// Add request logging middleware
billRouter.use('*', async (c, next) => {
  const start = Date.now();
  console.log(`[${new Date().toISOString()}] 🔄 ${c.req.method} ${c.req.path} - Request started`);
  
  await next();
  
  const ms = Date.now() - start;
  console.log(`[${new Date().toISOString()}] ✅ ${c.req.method} ${c.req.path} - Completed in ${ms}ms`);
});

interface FormDataFile {
  type: string;
  arrayBuffer(): Promise<ArrayBuffer>;
}

// OpenRouter free models in order of preference
const MODELS = [
  'google/gemini-2.5-pro-exp-03-25:free',
  'qwen/qwen2.5-vl-32b-instruct:free'
];

function verbose(message: string, ...args: any[]) {
  console.log(`[${new Date().toISOString()}] ${message}`, ...args);
}

async function callOpenRouterWithModel(
  model: string,
  base64Image: string,
  apiKey: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
    verbose(`⚠️ Aborting request for model ${model} due to timeout (10s)`);
  }, 10000);

  try {
    verbose(`🚀 Starting API call to OpenRouter with model: ${model}`);
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://xpense-app.pages.dev',
        'X-Title': 'Xpense App'
      },
      body: JSON.stringify({
        model: model,
        max_tokens: 500,
        temperature: 0.5,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Extract the following details from this bill image: title (a short description of what was purchased), amount (just the number), category (one of: Food, Rent, Utilities, Transportation, Entertainment, Shopping, Other), and a brief description. Format as JSON.'
            },
            {
              type: 'image',
              image: base64Image
            }
          ]
        }]
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      verbose(`❌ API call failed for model ${model}. Status: ${response.status}, Response:`, errorText);
      let errorMessage;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error?.message || errorJson.message || 'API request failed';
      } catch {
        errorMessage = `API request failed with status ${response.status}`;
      }
      return { success: false, error: errorMessage };
    }

    verbose(`✅ Successfully got response from model: ${model}`);
    const responseText = await response.text();
    verbose(`📝 Raw response from ${model}:`, responseText);
    
    let data;
    try {
      data = JSON.parse(responseText);
      if (!data.choices?.[0]?.message?.content) {
        throw new Error('Invalid response format');
      }
      return { success: true, data };
    } catch (e) {
      verbose(`❌ Failed to parse JSON response from ${model}:`, e);
      return { success: false, error: 'Invalid JSON response from API' };
    }
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        verbose(`⏰ Timeout reached for model: ${model}`);
        return { success: false, error: 'Request timed out after 10 seconds' };
      }
      verbose(`❌ Error with model ${model}:`, error.message);
      return { success: false, error: error.message };
    }
    verbose(`❌ Unknown error with model ${model}:`, error);
    return { success: false, error: 'Unknown error occurred' };
  }
}

billRouter.post('/analyze', async (c) => {
  try {
    verbose('📄 Starting bill analysis...');
    const formData = await c.req.formData();
    const fileData = formData.get('file');
    
    if (!fileData || typeof fileData === 'string') {
      verbose('❌ No valid file provided');
      return c.json({ error: 'No valid file provided' }, 400);
    }

    verbose('🔄 Converting file to base64...');
    const file = fileData as FormDataFile;
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const base64 = btoa(String.fromCharCode.apply(null, [...uint8Array]));
    const base64Image = `data:${file.type};base64,${base64}`;
    verbose('✅ File converted successfully');

    // Try each model in sequence until one succeeds
    let lastError = '';
    for (const model of MODELS) {
      verbose(`🤖 Attempting analysis with model: ${model}`);
      const result = await callOpenRouterWithModel(
        model,
        base64Image,
        c.env.OPENROUTER_API_KEY
      );

      if (result.success && result.data) {
        let extractedData;
        try {
          verbose(`🔍 Parsing response from model: ${model}`);
          const content = result.data.choices[0].message.content;
          verbose(`📝 Content to parse: ${content}`);
          extractedData = JSON.parse(content);
          
          if (!extractedData.title || !extractedData.amount || !extractedData.category) {
            throw new Error('Missing required fields in response');
          }
        } catch (e) {
          verbose(`❌ Failed to parse response from ${model}:`, e);
          continue; // Try next model if parsing fails
        }

        verbose(`✅ Successfully extracted data using model: ${model}`);
        return c.json({
          title: extractedData.title,
          amount: extractedData.amount,
          category: extractedData.category,
          description: extractedData.description || '',
          model: model
        });
      }

      lastError = result.error || 'Unknown error';
      verbose(`❌ Model ${model} failed:`, lastError);
    }

    verbose('❌ All models failed. Last error:', lastError);
    return c.json({ 
      error: 'All models failed to analyze the bill',
      lastError 
    }, 400);
  } catch (error) {
    verbose('❌ Error analyzing bill:', error);
    return c.json({ error: 'Failed to analyze bill' }, 400);
  }
});