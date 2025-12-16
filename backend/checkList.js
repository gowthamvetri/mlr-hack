const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

(async () => {
  try {
    const models = await genAI.listModels();

    console.log("Available models for this API key:\n");
    models.forEach(model => {
      console.log(model.name);
      console.log("  Supported methods:", model.supportedGenerationMethods);
      console.log("--------------------------------------------------");
    });
  } catch (err) {
    console.error("Error listing models:", err.message);
  }
})();
