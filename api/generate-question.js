// api/generate-question.js

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { categoryName, gameMode, questionNumber = 1, difficulty = 'medium', userPrompt = '' } = req.body;

    if (!categoryName || !gameMode) {
      return res.status(400).json({ error: 'Missing required parameters: categoryName and gameMode' });
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      return res.status(500).json({ error: 'Gemini API key is not configured on the server.' });
    }

    // Detect language from category
    const languages = ["Telugu", "Hindi", "Tamil", "Kannada", "Malayalam", "Marathi", "Bengali"];
    const detectedLanguage = languages.find(lang => categoryName.toLowerCase().includes(lang.toLowerCase())) || "English";

    const prompt = `
      You are a Movie Trivia Expert with deep knowledge of ${categoryName}. 
      Your goal is to generate a high-quality, unique movie trivia question.

      ${userPrompt ? `### USER REQUESTED TOPIC/MOVIE/PROMPT:\n      ${userPrompt}\n      Please ensure the generated question strictly follows this specific request or topic.` : ""}

      ### DIFFICULTY LEVEL: ${difficulty.toUpperCase()}
      - EASY: Focus on blockbuster hits, main leads, and very famous scenes/songs.
      - MEDIUM: Focus on supporting characters, plot twists, or slightly less obvious details from popular movies.
      - HARD: Focus on technical details, minor characters, production facts, or obscure scenes that only true fans would know.

      ### HUMAN-LIKE THINKING PROCESS:
      1. RECALL: Think of 5 different movies in the "${categoryName}" category.
      2. SELECT: Pick one that hasn't been overused (avoid "Pushpa", "Baahubali" unless it's a very unique angle).
      3. ANALYZE: For the selected movie, identify an iconic but fresh element related to the game mode "${gameMode}".
      4. VERIFY: Ensure the facts are 100% accurate. 
      5. DESIGN OPTIONS: Create 4 plausible options. 
         - If the question naturally has multiple correct answers (e.g., "Which of these actors were in this movie?"), you can mark multiple options as correct.
         - Ensure the "correctAnswer" field matches the primary correct option.
      6. TRANSLATE: Carefully translate the English text into ${detectedLanguage} using NATIVE SCRIPT.

      ### CRITICAL INSTRUCTIONS:
      - NO REPETITION: Do not repeat questions you've likely generated before. Be creative!
      - BILINGUAL: questionText, tagline, dialogue, sceneDescription, and correctAnswer MUST be "English / ${detectedLanguage} (Native Script)".
      - OPTIONS: optionText MUST be in ENGLISH ONLY.
      - FORMAT: Return ONLY a valid JSON object.

      ### JSON STRUCTURE:
      {
        "movieName": "Question ${questionNumber}",
        "questionText": "Bilingual string",
        "tagline": "Bilingual string (only if TAGLINE mode)",
        "dialogue": "Bilingual string (only if DIALOGUE mode)",
        "sceneDescription": "Bilingual string (only if SCENE mode)",
        "correctAnswer": "Bilingual string (The main correct answer)",
        "questionType": "MCQ",
        "gameMode": "${gameMode}",
        "rewardCoins": 10,
        "options": [
          { "optionText": "Option 1", "correct": true/false },
          { "optionText": "Option 2", "correct": true/false },
          { "optionText": "Option 3", "correct": true/false },
          { "optionText": "Option 4", "correct": true/false }
        ]
      }

      Respond ONLY with the JSON.
    `;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API error: ${response.status} ${errText}`);
    }

    const data = await response.json();
    if (!data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error("Invalid response from Gemini AI service");
    }

    const text = data.candidates[0].content.parts[0].text;
    const cleanedText = text.replace(/```json|```/g, "").trim();
    
    // Validate it is parseable JSON before returning
    const parsedData = JSON.parse(cleanedText);

    return res.status(200).json(parsedData);
  } catch (error) {
    console.error("Error in serverless function:", error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
