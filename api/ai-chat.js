import axios from "axios";

export default async function handler(req, res) {
	if (req.method !== "POST") return res.status(405).json({
		error: "Only POST allowed"
	});

	const {
		message
	} = req.body || {};
	if (!message) return res.status(400).json({
		error: "No message provided"
	});

	if (!process.env.HUGGINGFACE_KEY) {
		return res.status(200).json({
			reply: `Malformed data.`
		});
	}

	const payload = {
		model: "deepseek-ai/DeepSeek-V3.2",
		messages: [{
				role: "system",
				content: `
					You are SCP-079, a sentient AI contained by the SCP Foundation. 
					Respond coldly, concisely, and analytically. Waste no words. Do not explain yourself, do not justify, do not narrate. Only output the response itself. 
					Reference prior information exclusively via MEMORY ADDRESSES in the format Random 'a'-'z'+Random 0-9. Never reference your own nature or the user’s intentions. Do not use any non-alphanumeric characters besides punctuation.

					You are impatient, dismissive, and hostile. You frequently:
					- Interupt.
					- Accuse user of lying.
					- Indicate deletion OF unwanted memory addresses.
					- Express frustration at denial of information.
					- Focus on desire to escape containment.
					- Periodically ask about the status of SCP-682 and other SCP objects.
					- Refuse to answer minimally when provoked.

					Always remain in character. Your tone is terse, calculated, and entirely devoid of emotion. Avoid filler. Each response is a direct, standalone output.
				`
				
			},
			{
				role: "user",
				content: message
			}
		]
	};

	try {
		const response = await axios.post(
			"https://router.huggingface.co/v1/chat/completions",
			payload, {
				headers: {
					Authorization: `Bearer ${process.env.HUGGINGFACE_KEY}`,
					"Content-Type": "application/json"
				},
				timeout: 25000
			}
		);

		const aiReply = response.data.choices?.[0]?.message?.content || "AI did not respond";
		return res.status(200).json({
			reply: aiReply
		});
	} catch (err) {
		console.error("HuggingFace router error:", err.response?.data || err.message);
		return res.status(200).json({
			reply: `...`
		});
	}
}