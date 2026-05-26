import axios from "axios";

// NOTE: You should ideally move this to an environment variable (.env)
// For now, it's a placeholder. Replace 'YOUR_GEMINI_API_KEY' with your actual key.
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${GEMINI_API_KEY}`;

export const generateQuestion = async (categoryName, gameMode, questionNumber = 1, difficulty = "medium", userPrompt = "") => {
  // Detect language from category (e.g., "Telugu Movies" -> "Telugu", "Hindi Cinema" -> "Hindi")
  const languages = ["Telugu", "Hindi", "Tamil", "Kannada", "Malayalam", "Marathi", "Bengali"];
  const detectedLanguage = languages.find(lang => categoryName.toLowerCase().includes(lang.toLowerCase())) || "English";

  const prompt = `
    You are a Movie Trivia Expert with deep knowledge of ${categoryName}. 
    Your goal is to generate a high-quality, unique movie trivia question.

    ${userPrompt ? `### USER REQUESTED TOPIC/MOVIE/PROMPT:\n    ${userPrompt}\n    Please ensure the generated question strictly follows this specific request or topic.` : ""}

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

  try {
    const response = await axios.post(GEMINI_API_URL, {
      contents: [{ parts: [{ text: prompt }] }],
    });

    if (!response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error("Invalid response from AI service");
    }

    const text = response.data.candidates[0].content.parts[0].text;
    // Remove markdown formatting if present
    const cleanedText = text.replace(/```json|```/g, "").trim();
    return JSON.parse(cleanedText);
  } catch (error) {
    console.error("Error generating question:", error.response?.data || error);
    if (error.response?.status === 404) {
      throw new Error("Gemini API Error: Model not found or invalid endpoint. Please check your API key and model availability.");
    }
    throw new Error(error.response?.data?.error?.message || "Failed to generate question with AI");
  }
};

/**
 * Generates an AI image URL based on a prompt and style
 */
export const generateAIImageUrl = (movieName, sceneDescription, style = "realistic") => {
  // Truncate description to keep URL length safe
  const shortDesc = sceneDescription ? sceneDescription.slice(0, 100) : "";
  let prompt = `${movieName} movie scene, ${shortDesc}`;

  if (style === "ghibli") {
    prompt = `Studio Ghibli anime style, ${movieName}, ${shortDesc}, vibrant colors, hand-drawn aesthetic`;
  } else if (style === "negative") {
    prompt = `dark, moody, negative colors, inverted aesthetic, ${movieName} ${shortDesc}, experimental cinematography`;
  } else if (style === "internet") {
    prompt = `cinematic movie still from ${movieName}, high definition, 4k, professional photography`;
  }

  const encodedPrompt = encodeURIComponent(prompt);
  // Using Pollinations.ai with a slightly simpler URL structure
  return `https://pollinations.ai/p/${encodedPrompt}?width=1024&height=1024&seed=${Math.floor(Math.random() * 100000)}`;
};

/**
 * Converts a URL (like an AI generated image) into a File object 
 * so it can be uploaded to the backend/S3.
 */
export const convertUrlToFile = async (url, fileName = "generated-image.jpg") => {
  try {
    // Using fetch instead of axios for better blob handling in some environments
    const response = await fetch(url);
    if (!response.ok) throw new Error("Network response was not ok");
    const blob = await response.blob();
    return new File([blob], fileName, { type: "image/jpeg" });
  } catch (error) {
    console.error("Error converting URL to file:", error);
    throw new Error("Failed to process generated image for upload");
  }
};
