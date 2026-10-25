
export default async function handler(req, res) {
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return res.status(405).json({ error: "Method not allowed" });
    }
  
    const apiKey = process.env.GROQ_API_KEY;
  
    if (!apiKey) {
      console.error("GROQ_API_KEY is not configured");
      return res.status(500).json({ error: "Chat service is not configured." });
    }
  
    const { question, portfolioContext = "", history = [] } = req.body || {};
  
    if (
      typeof question !== "string" ||
      !question.trim() ||
      question.length > 2000 ||
      typeof portfolioContext !== "string" ||
      portfolioContext.length > 12000 ||
      !Array.isArray(history) ||
      history.length > 2 ||
      history.some(
        (m) =>
          !m ||
          !["user", "assistant"].includes(m.role) ||
          typeof m.content !== "string" ||
          m.content.length > 2000
      )
    ) {
      return res.status(400).json({ error: "Invalid chat request." });
    }
  
    try {
      const response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "openai/gpt-oss-20b",
            temperature: 0.3,
            max_tokens: 120,
            messages: [
              {
                role: "system",
                content: `You are Yash gupta's portfolio assistant.
  
  Portfolio information:
  ${portfolioContext}
  
  Instructions:
  - Answer general knowledge questions and portfolio questions.
  - Use conversation history to understand follow-up questions.
  - Never invent personal details or project features.
  - If information is missing, say so.
  - Keep answers concise, normally under 80 words.`,
              },
              ...history,
              { role: "user", content: question.trim() },
            ],
          }),
        }
      );
  
      if (!response.ok) {
        console.error("Groq returned status:", response.status);
        return res.status(502).json({ error: "AI provider request failed." });
      }
  
      const data = await response.json();
      const answer = data.choices?.[0]?.message?.content?.trim();
  
      if (!answer) {
        return res.status(502).json({ error: "The AI returned an empty answer." });
      }
  
      return res.status(200).json({ answer });
    } catch (error) {
      console.error("Chat request failed:", error.message);
      return res.status(500).json({ error: "Unable to process chat request." });
    }
  }
  