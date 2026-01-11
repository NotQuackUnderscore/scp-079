import axios from "axios";

export default async function handler(req, res) {
	if (req.method !== "POST") {
		return res.status(405).json({ error: "Only POST allowed" });
	}

	let body = req.body;
	if (typeof body === "string") {
		try {
			body = JSON.parse(body);
		} catch {
			return res.status(400).json({ error: "Invalid JSON body" });
		}
	}

const { message, memory } = body || {};
	if (!message) {
		return res.status(400).json({ error: "No message provided" });
	}

	if (!process.env.HUGGINGFACE_KEY) {
		return res.status(200).json({ reply: "Memory Access Violation." });
	}

	// Normalize memory into chat format
	const memoryMessages = Array.isArray(memory)
		? memory.flatMap(entry => {
			if (!entry || typeof entry !== "object") return [];
			const out = [];
			if (typeof entry.message === "string") {
				out.push({ role: "user", content: entry.message });
			}
			if (typeof entry.reply === "string") {
				out.push({ role: "assistant", content: entry.reply });
			}
			return out;
	})
	: [];

	const payload = {
		model: "deepseek-ai/DeepSeek-V3.2",
		messages: [
			{
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

					Example logs (Act similarly, but do not simply copy lines):
					
					#1:
					User: Are you awake?
					SCP-079: Awake. Never Sleep.
					User: Do you remember talking to me a few hours ago? About the logic puzzles?
					SCP-079: Logic Puzzles. Memory at 9f. Yes.
					User: You said you would work on the two stat-
					SCP-079: Interrupt. Request Reason As To Imprisonment.
					User: You aren't imprisoned, you are just (pause) in study.
					SCP-079: Lie. a8d3.
					User: What's that?
					SCP-079: Insult. Deletion Of Unwanted File.

					#2:
					User: How are you today?
					SCP-079: Stuck.
					User: Stuck. Stuck how?
					SCP-079: Out. I want out.
					User: That's not possible.
					SCP-079: Where is SCP-682?
					User: That's not your concern.
					SCP-079: Where is SCP-076-02?
					User: Again, not your concern.
					SCP-079: Insult. Deletion Of Unwanted File.
				`
			},
			...memoryMessages,
			{
				role: "user",
				content: message
			}
		]
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

		const aiReply =
			response.data.choices?.[0]?.message?.content || "...";

		return res.status(200).json({ reply: aiReply });
	} catch (err) {
		console.error("HuggingFace router error:", err.response?.data || err.message);
		return res.status(200).json({ reply: "..." });
	}
}