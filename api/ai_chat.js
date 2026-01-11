import axios from "axios";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Only POST requests allowed" });
    }

    const { message } = req.body;

    if (!message) {
        return res.status(400).json({ error: "No message provided" });
    }

    try {
        const response = await axios.post(
			"https://router.huggingface.co/v1/chat/completions",
			payload,
			{
				headers: {
					Authorization: `Bearer ${process.env.HUGGINGFACE_KEY}`,
					"Content-Type": "application/json"
				},
				timeout: 10000
			}
		);

        const aiReply = response.data[0]?.generated_text || "AI did not respond";

        return res.status(200).json({ reply: aiReply });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ reply: "AI is unavailable right now" });
    }
}