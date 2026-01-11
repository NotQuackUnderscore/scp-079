import axios from "axios";

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST requests allowed" });
  }

  // Extract message from request body
  const { message } = req.body || {};
  if (!message) {
    return res.status(400).json({ error: "No message provided" });
  }

  // Payload for HuggingFace chat API
  const payload = {
    model: "Qwen/Qwen2.5-7B-Instruct-1M", // SCP-079-friendly model
    messages: [
      {
        role: "user",
        content: message
      }
    ]
  };

  // Make sure HuggingFace API key is set
  if (!process.env.HUGGINGFACE_KEY) {
    return res.status(200).json({
      reply: `You said: ${message} (HuggingFace API key not set)`
    });
  }

  try {
    const response = await axios.post(
      "https://api-inference.huggingface.co/v1/chat/completions",
      payload,
      {
        headers: {
          Authorization: `Bearer ${process.env.HUGGINGFACE_KEY}`,
          "Content-Type": "application/json"
        },
        timeout: 25000 // 25s timeout for serverless function
      }
    );

    // Extract AI reply safely
    const aiReply = response.data.choices?.[0]?.message?.content || "AI did not respond";

    return res.status(200).json({ reply: aiReply });
  } catch (err) {
    console.error("HuggingFace error:", err.response?.data || err.message);

    // Fallback static reply to avoid crashing DiamondFire
    return res.status(200).json({
      reply: `AI is unavailable right now. You said: ${message}`
    });
  }
}