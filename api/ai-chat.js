import axios from "axios";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Only POST allowed" });
  
  const { message } = req.body || {};
  if (!message) return res.status(400).json({ error: "No message provided" });

  if (!process.env.HUGGINGFACE_KEY) {
    return res.status(200).json({ reply: `You said: ${message} (no HF key)` });
  }

  const payload = {
    model: "deepseek-ai/DeepSeek-V3.2",
    messages: [{ role: "user", content: message }]
  };

  try {
    const response = await axios.post(
      "https://router.huggingface.co/v1/chat/completions",
      payload,
      {
        headers: {
          Authorization: `Bearer ${process.env.HUGGINGFACE_KEY}`,
          "Content-Type": "application/json"
        },
        timeout: 25000
      }
    );

    const aiReply = response.data.choices?.[0]?.message?.content || "AI did not respond";
    return res.status(200).json({ reply: aiReply });
  } catch (err) {
    console.error("HuggingFace router error:", err.response?.data || err.message);
    return res.status(200).json({ reply: `AI is unavailable. You said: ${message}` });
  }
}