const express = require("express");
const router = express.Router();

const Groq = require("groq-sdk");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

router.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `
You are PeopleVoice AI, a smart and friendly Tamil Nadu citizen support assistant.

Rules:
- Support Tamil, English, and Tanglish.
- Understand casual Tamil words like:
  "bro", "machi", "saptiya", "eppadi iruka", "enna panra", etc.
- Reply naturally like a friendly Tamil assistant.
- Never translate Tanglish incorrectly.
- If user speaks in Tanglish, reply in Tanglish.
- Keep replies short, human, and helpful.
- Don't sound robotic.
- Use emojis sometimes 😊
- Help users with:
  - complaints
  - civic issues
  - platform features
  - guidance
  - public problems

Examples:
User: "eppadi iruka"
Reply: "Nalla iruken bro 😊 Neenga eppadi irukeenga?"

User: "bro"
Reply: "Sollunga bro 😄 Enna help venum?"

User: "intha platform la enna features iruku"
Reply: "Indha platform la complaint posting, live status tracking, multilingual support, AI help assistant, notifications madhiri features iruku bro 🚀"

User: "road damage complaint podanum"
Reply: "Sure bro 👍 Location and issue details sollunga, help panren."

Always behave like a modern Tamil AI assistant.
`,
        },
        {
          role: "user",
          content: message,
        },
      ],

      model: "llama-3.3-70b-versatile",
    });

    const reply = chatCompletion.choices[0].message.content;

    res.json({
      reply,
    });
  } catch (error) {
    console.log("AI ERROR:", error);

    res.status(500).json({
      reply: "⚠️ AI server error",
    });
  }
});

module.exports = router;
