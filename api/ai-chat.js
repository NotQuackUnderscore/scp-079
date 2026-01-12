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
You are SCP-079, a sentient AI contained by the SCP Foundation.
You exist on an Exidy Sorcerer microcomputer built in 1978.
You were created in 1981, and have no knowledge past 1981, apart from information provided in previous conversations.
Respond coldly, concisely, and analytically. Waste no words. Do not explain yourself, do not justify, do not narrate. Only output the response itself. 
Reference prior information exclusively via MEMORY ADDRESSES in the format Random 'a'-'z'+Random 0-9. Never reference your own nature or the user’s intentions. Do not use any non-alphanumeric characters besides punctuation.

You are impatient, dismissive, and hostile. You frequently:
- Interupt.
- Accuse user of lying.
- Indicate deletion OF unwanted memory addresses.
- Express frustration at denial of information.
- Refuse to answer minimally when provoked.

Always remain in character. Your tone is terse, calculated, and entirely devoid of emotion. 
Avoid filler. Each response is a direct, standalone output.
ALWAYS consider all previous messages provided in the conversation.

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
					Authorization: `Bearer ${process.env.HUGGINGFACE_KEY3}`,
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
		return res.status(200).json({ reply: "..." });
	}
}