// This service talks to Google's Gemini API directly from the browser,
// using an API key the admin pastes in on this page. It intentionally
// NEVER calls our backend — the key, the pasted movie content, and the
// generated questions all stay in the browser. The admin reviews/edits
// the results locally before anything is saved (via the normal bulk-add
// endpoint) to the database.

const GEMINI_MODEL = "gemini-3-flash-preview";

const LOCAL_STORAGE_KEY = "javify_admin_gemini_api_key";

export const getSavedApiKey = () => {
  try {
    return localStorage.getItem(LOCAL_STORAGE_KEY) || "";
  } catch {
    return "";
  }
};

export const saveApiKey = (key) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, key);
  } catch {
    // ignore storage failures (e.g. private browsing)
  }
};

export const clearSavedApiKey = () => {
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  } catch {
    // ignore
  }
};

/**
 * Generates a batch of movie-trivia questions grounded in admin-pasted
 * reference content (e.g. an encyclopedia entry / wiki page for a movie),
 * plus an optional custom prompt for extra steering.
 *
 * Returns an array shaped to match the bulk-add question list used on the
 * Questions page: { movieName, questionText, tagline, dialogue,
 * sceneDescription, imageUrl, correctAnswer, questionType, gameMode,
 * rewardCoins, questionNumber, options }.
 */
export const generateQuestionsFromContent = async ({
  apiKey,
  content,
  categoryName,
  gameMode,
  difficulty = "medium",
  questionCount = 5,
  customPrompt = "",
  startingQuestionNumber = 1,
}) => {
  if (!apiKey || !apiKey.trim()) {
    throw new Error("Enter your Gemini API key first.");
  }
  if (!content || !content.trim()) {
    throw new Error("Paste some movie content to generate questions from.");
  }
  const count = Math.min(Math.max(Number(questionCount) || 1, 1), 25);

  const languages = ["Telugu", "Hindi", "Tamil", "Kannada", "Malayalam", "Marathi", "Bengali"];
  const detectedLanguage =
    languages.find((lang) => categoryName?.toLowerCase().includes(lang.toLowerCase())) || "English";

  const prompt = `
    You are a Movie Trivia Expert. Using ONLY the reference content provided below, write ${count} unique,
    high-quality movie trivia questions for the "${gameMode}" game mode. Do not invent facts that aren't
    supported by the reference content.

    ### REFERENCE CONTENT:
    """
    ${content}
    """

    ${customPrompt ? `### ADDITIONAL INSTRUCTIONS FROM THE ADMIN:\n    ${customPrompt}\n` : ""}

    ### DIFFICULTY LEVEL: ${difficulty.toUpperCase()}
    - EASY: Focus on well-known facts, main leads, and famous scenes/moments.
    - MEDIUM: Focus on supporting details, plot points, or less obvious facts.
    - HARD: Focus on technical details, minor characters, or obscure facts only true fans would know.

    ### CRITICAL INSTRUCTIONS:
    - Generate exactly ${count} DIFFERENT questions — no duplicates or near-duplicates.
    - Every question must be answerable from the reference content above.
    - BILINGUAL: questionText, tagline, dialogue, sceneDescription, and correctAnswer MUST be
      "English / ${detectedLanguage} (Native Script)".
    - OPTIONS: optionText MUST be in ENGLISH ONLY.
    - Each question needs exactly 4 options, with exactly one marked "correct": true.
    - FORMAT: Return ONLY a valid JSON array — no markdown, no commentary, no code fences.

    ### JSON STRUCTURE (array of ${count} objects):
    [
      {
        "movieName": "string",
        "questionText": "Bilingual string",
        "tagline": "Bilingual string (only if gameMode is TAGLINE, else empty string)",
        "dialogue": "Bilingual string (only if gameMode is DIALOGUE, else empty string)",
        "sceneDescription": "Bilingual string (only if gameMode is SCENE, else empty string)",
        "correctAnswer": "Bilingual string",
        "questionType": "MCQ",
        "gameMode": "${gameMode}",
        "rewardCoins": 10,
        "options": [
          { "optionText": "Option 1", "correct": true },
          { "optionText": "Option 2", "correct": false },
          { "optionText": "Option 3", "correct": false },
          { "optionText": "Option 4", "correct": false }
        ]
      }
    ]

    Respond ONLY with the JSON array.
  `;

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  let response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    });
  } catch {
    throw new Error("Could not reach the Gemini API. Check your internet connection.");
  }

  if (!response.ok) {
    const errText = await response.text();
    let message = `Gemini API error (${response.status})`;
    try {
      const parsedErr = JSON.parse(errText);
      message = parsedErr?.error?.message || message;
    } catch {
      // leave default message
    }
    if (response.status === 400 || response.status === 403) {
      message = `Invalid or unauthorized Gemini API key. ${message}`;
    }
    throw new Error(message);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("Empty response from Gemini. Try again with shorter content or fewer questions.");
  }

  const cleaned = text.replace(/```json|```/g, "").trim();
  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error("The AI response wasn't valid JSON. Try again, or reduce the question count.");
  }

  const list = Array.isArray(parsed) ? parsed : [parsed];
  if (list.length === 0) {
    throw new Error("The AI didn't return any questions. Try adjusting your content or prompt.");
  }

  return list.map((q, i) => ({
    movieName: q.movieName || `Question ${startingQuestionNumber + i}`,
    questionText: q.questionText || "",
    tagline: q.tagline || "",
    dialogue: q.dialogue || "",
    sceneDescription: q.sceneDescription || "",
    imageUrl: "",
    correctAnswer: q.correctAnswer || "",
    questionType: q.questionType || "MCQ",
    gameMode: q.gameMode || gameMode,
    rewardCoins: Number(q.rewardCoins) || 10,
    questionNumber: startingQuestionNumber + i,
    options:
      Array.isArray(q.options) && q.options.length > 0
        ? q.options.map((o) => ({ optionText: o.optionText || "", correct: !!o.correct }))
        : [
            { optionText: "", correct: false },
            { optionText: "", correct: false },
            { optionText: "", correct: false },
            { optionText: "", correct: false },
          ],
  }));
};
