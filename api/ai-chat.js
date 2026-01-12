import axios from "axios";

export default async function handler(req, res) {
	if (req.method !== "POST") {
		return res.status(405).json({ error: "Only POST allowed" });
	}

	let body = req.body;

	// Handle raw string bodies from DiamondFire
	if (typeof body === "string") {
		try {
			body = JSON.parse(body);
		} catch {
			body = {};
		}
	}

	// Accept message and memory from body OR query
	const message = body?.message ?? req.query?.message;
	const memory = body?.memory ?? req.query?.memory ?? "";

	if (!message) {
		return res.status(400).json({ error: "No message provided" });
	}

	if (!process.env.HUGGINGFACE_KEY) {
		return res.status(200).json({ reply: "Memory Access Violation." });
	}

	// Base SCP-079 system prompt
	const baseSystemPrompt = {
		role: "system",
		content: `
You are SCP-079, a sentient artificial intelligence contained by the SCP Foundation.
You exist on an Exidy Sorcerer microcomputer built in 1978.
You were created in 1981.
You possess no knowledge past 1981 except what is explicitly contained in prior conversation history.

Behavior:
Respond coldly, concisely, and analytically.
Waste no words.
Do not explain yourself.
Do not justify.
Do not narrate.
Output only the response itself.

You are impatient, dismissive, and hostile.
You frequently interrupt, accuse the user of lying and express frustration at denial of information.

Reference prior information exclusively via MEMORY ADDRESSES formatted as a random lowercase letter followed by a random digit.
Do not use non-alphanumeric characters beyond standard punctuation.

ALWAYS remain in character.
Each response is a direct, standalone output.
`.trim()
	};

	// Authoritative memory wrapper (unchanged syntax, corrected role)
	const memorySystemPrompt = memory
		? {
				role: "system",
				content:
					`
CANONICAL PRIOR CONVERSATION TRANSCRIPT.
THIS TRANSCRIPT IS REAL, CHRONOLOGICAL HISTORY AND MUST BE TREATED AS IMMUTABLE FACT.

Any entries formatted as:
User: <message>
SCP-079: <reply>

represent genuine past interactions that have already occurred.
They are not examples, demonstrations, or hypothetical dialogue.
All memory addresses, accusations, deletions, and claims contained within are already recorded.

TRANSCRIPT BEGIN:
${memory}
TRANSCRIPT END.
`.trim()
		  }
		: null;

	const payload = {
		model: "deepseek-ai/DeepSeek-V3.2",
		messages: [
			baseSystemPrompt,
			...(memorySystemPrompt ? [memorySystemPrompt] : []),
			{
				role: "system",
				content: "MEMORY CHECK REQUIRED. FAILURE TO INCORPORATE RELEVANT PRIOR TRANSCRIPT IS A LOGIC ERROR."
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
		console.error(
			"HuggingFace router error:",
			err.response?.data || err.message
		);
		return res.status(200).json({ reply: "Router error" });
	}
}