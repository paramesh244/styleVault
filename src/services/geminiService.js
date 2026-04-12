import { GoogleGenerativeAI } from '@google/generative-ai';
import { getSetting } from '../db';

let genAI = null;
let model = null;

// Priority: .env file > IndexedDB stored key
export async function getApiKey() {
  const envKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (envKey && envKey.trim() && envKey !== 'paste_your_key_here') {
    return { key: envKey.trim(), source: 'env' };
  }
  const storedKey = await getSetting('gemini_api_key');
  if (storedKey) {
    return { key: storedKey, source: 'stored' };
  }
  return { key: null, source: null };
}

async function getModel() {
  if (model) return model;
  const { key: apiKey } = await getApiKey();
  if (!apiKey) throw new Error('API key not set. Please add your Gemini API key in Settings or .env file.');
  genAI = new GoogleGenerativeAI(apiKey);
  model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  return model;
}

// Reset model when API key changes
export function resetModel() {
  genAI = null;
  model = null;
}

// Validate API key by making a simple request
export async function validateApiKey(apiKey) {
  try {
    const testAI = new GoogleGenerativeAI(apiKey);
    const testModel = testAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await testModel.generateContent('Say "hello" in one word.');
    const text = result.response.text();
    return text.length > 0;
  } catch (err) {
    console.error('API key validation failed:', err);
    return false;
  }
}

// ===== Phase 1: Analyze Clothing Image =====
export async function analyzeClothing(imageDataUrl) {
  const m = await getModel();

  // Extract base64 data from data URL
  const base64Data = imageDataUrl.split(',')[1];
  const mimeType = imageDataUrl.split(';')[0].split(':')[1];

  const prompt = `You are Aura AI — a world-class fashion analyst with deep expertise in textiles, color theory, garment construction, and contemporary style trends across streetwear, haute couture, business fashion, and athleisure.

TASK: Analyze the clothing item in this image with expert-level precision. Examine every visible detail — stitching, hardware, labels, fabric texture, drape, and silhouette.

Return ONLY a valid JSON object (no markdown, no code fences, no commentary):

{
  "name": "A specific, descriptive name for this item (e.g., 'Slim-Fit Navy Pinstripe Oxford Button-Down' rather than just 'Blue Shirt')",
  "type": "EXACTLY one of: tops, bottoms, dresses, outerwear, shoes, accessories",
  "subType": "Specific garment type (e.g., henley, chinos, peacoat, chelsea boots, crossbody bag). Be precise.",
  "colors": ["Primary color first, then accent colors. Use specific fashion color names like 'burgundy', 'slate gray', 'ivory', 'olive' — NOT generic terms like 'red' or 'green'. Max 4 colors."],
  "pattern": "EXACTLY one of: solid, striped, plaid, checkered, floral, printed, graphic, textured, abstract, geometric, paisley, houndstooth, camo, tie-dye, color-block, ombre, animal-print, or other",
  "material": "Primary material with confidence (e.g., '100% cotton twill', 'cotton-polyester blend', 'premium leather', 'merino wool knit'). Assess from texture and drape visible in the image.",
  "formality": "EXACTLY one of: very casual, casual, smart casual, business casual, business, formal, black tie",
  "fit": "EXACTLY one of: slim, regular, relaxed, oversized, tailored, cropped, flared, skinny, straight, a-line",
  "seasons": ["Array of appropriate seasons from: spring, summer, fall, winter. Consider fabric weight, color palette, and layering potential."],
  "occasions": ["Array from: everyday, work, date night, party, wedding, workout, outdoor adventure, travel, beach, brunch, job interview, concert. List ALL that genuinely apply."],
  "versatility": "A number from 1 to 10 rating how many different outfits and styles this piece can work with. A plain white t-shirt = 9, a sequin gown = 2.",
  "pairsWith": ["Suggest 4-6 specific complementary items that would pair well with this piece (e.g., 'dark wash straight jeans', 'white minimalist sneakers', 'camel wool overcoat')"],
  "careInstructions": "Educated guess on care based on material (e.g., 'Machine wash cold, tumble dry low. Iron on medium if needed.')",
  "description": "A rich 2-3 sentence description covering: the garment's silhouette and fit, standout design details (buttons, stitching, collar style, hardware), overall aesthetic vibe, and what kind of person/style it suits. Write like a premium fashion editorial."
}`;

  const result = await m.generateContent([
    prompt,
    {
      inlineData: {
        data: base64Data,
        mimeType: mimeType,
      },
    },
  ]);

  const responseText = result.response.text();

  // Parse JSON from response, handling possible markdown wrapping
  let jsonStr = responseText;
  const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1];
  }
  const braceMatch = jsonStr.match(/\{[\s\S]*\}/);
  if (braceMatch) {
    jsonStr = braceMatch[0];
  }

  try {
    return JSON.parse(jsonStr);
  } catch (err) {
    console.error('Failed to parse AI response:', responseText);
    throw new Error('AI returned invalid format. Please try again.');
  }
}

// ===== Phase 2: Suggest Outfits =====
export async function suggestOutfits(allClothing, userRequest) {
  const m = await getModel();

  // Build a text-only description of all clothing (no images = fewer tokens)
  const wardrobeDescription = allClothing
    .map(
      (item) =>
        `[ID:${item.id}] ${item.name || 'Unnamed'} — Type: ${item.type}/${item.subType || '?'}, Colors: ${(item.colors || []).join(', ')}, Pattern: ${item.pattern || '?'}, Material: ${item.material || '?'}, Formality: ${item.formality || '?'}, Fit: ${item.fit || '?'}, Seasons: ${(item.seasons || []).join(', ')}, Occasions: ${(item.occasions || []).join(', ')}, Versatility: ${item.versatility || '?'}/10, Description: ${item.description || 'N/A'}`
    )
    .join('\n');

  const prompt = `You are Aura AI — an elite personal stylist with mastery in color theory, silhouette harmony, texture mixing, and trend-forward fashion. You think like a stylist for top-tier fashion magazines.

YOUR CLIENT'S FULL WARDROBE:
${wardrobeDescription}

CLIENT'S REQUEST: "${userRequest}"

YOUR MISSION: Curate 3 exceptional outfit combinations from the wardrobe above. Each outfit should feel intentional, cohesive, and elevated — not just "matching."

STYLING PRINCIPLES TO FOLLOW:
• Color harmony — use complementary, analogous, or monochromatic palettes with intention
• Texture contrast — mix smooth with textured (e.g., silk + denim, leather + knit)
• Proportion play — balance oversized with fitted, cropped with high-waisted
• Formality consistency — don't mix black-tie with streetwear unless deliberately
• Seasonal awareness — respect fabric weights and layering needs
• Occasion fit — every outfit must genuinely suit the requested occasion

OUTFIT COMPOSITION RULES:
• Minimum: top + bottom, OR a dress/jumpsuit
• Include outerwear if weather/occasion warrants it
• Include shoes and accessories when available in the wardrobe
• Reference items by their [ID:X] number

Return ONLY valid JSON (no markdown, no code fences):
{
  "outfits": [
    {
      "name": "A creative, evocative outfit name that captures the vibe (e.g., 'Metropolitan Edge', 'Sunset Riviera', 'Power Move')",
      "itemIds": ["id1", "id2", "id3"],
      "reasoning": "A detailed 2-3 sentence explanation of WHY these items work together — mention specific color relationships, texture interplay, and how the combination suits the occasion. Reference specific items by name.",
      "styleNotes": "Practical styling tip — how to wear it (e.g., 'Cuff the sleeves twice for a relaxed look. Tuck the front of the shirt for a French tuck. Layer the chain necklace over the crewneck.')",
      "colorStory": "Explain the color palette narrative (e.g., 'A tonal earth palette — warm camel meets deep olive with ivory as a breathing point')",
      "confidence": 8,
      "missingPieces": ["Specific items that would complete or elevate this look that aren't in the wardrobe (e.g., 'A brown leather belt would tie the earth tones together')"]
    }
  ],
  "generalAdvice": "Broader style insight for the client — wardrobe gaps to fill, styling habits to adopt, or trend tips specific to their collection. Be specific and actionable, not generic."
}

IMPORTANT: 
- "confidence" is a score from 1-10 on how well-suited this outfit is for the request.
- "missingPieces" should be genuinely useful shopping suggestions, not filler.
- Make each outfit DISTINCT in mood, color palette, and formality level.
- Item IDs must be strings matching the [ID:X] values exactly.`;

  const result = await m.generateContent(prompt);
  const responseText = result.response.text();

  let jsonStr = responseText;
  const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1];
  }
  const braceMatch = jsonStr.match(/\{[\s\S]*\}/);
  if (braceMatch) {
    jsonStr = braceMatch[0];
  }

  try {
    return JSON.parse(jsonStr);
  } catch (err) {
    console.error('Failed to parse AI response:', responseText);
    throw new Error('AI returned invalid format. Please try again.');
  }
}

// ===== Follow-up Chat =====
export async function chatFollowUp(wardrobeDescription, previousSuggestions, userMessage) {
  const m = await getModel();

  const prompt = `You are StyleVault AI — a warm, knowledgeable personal stylist having a natural conversation with your client. You combine deep fashion expertise with approachable charm.

WARDROBE CONTEXT:
${wardrobeDescription}

PREVIOUS OUTFIT SUGGESTIONS:
${JSON.stringify(previousSuggestions, null, 2)}

CLIENT'S FOLLOW-UP: "${userMessage}"

RESPONSE GUIDELINES:
• Be conversational, warm, and confident — like a friend who happens to be a fashion expert
• Reference specific items from their wardrobe by NAME (never mention IDs)
• If they ask for alternatives, suggest specific swaps with reasoning
• If they mention weather, adjust recommendations for temperature and conditions
• If they want to shop, suggest specific items with descriptions (type, color, style)
• Use 1-2 relevant emojis naturally, not excessively
• Keep the response concise (2-4 paragraphs max) but packed with actionable advice
• If suggesting changes, explain what improves and why
• End with a proactive suggestion or question to keep the conversation going

Do NOT wrap your response in JSON — respond in natural, well-formatted plain text with line breaks between thoughts.`;

  const result = await m.generateContent(prompt);
  return result.response.text();
}
