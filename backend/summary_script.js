
const configuration = new Configuration({
	apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);
fs.initializeApp({
	credential: fs.credential.cert(serviceAccount),
});
const db = fs.firestore();

async function runCompletion() {
	const completion = await openai.createCompletion({
		model: "text-davinci-003",
		prompt: "Summarize rich dad poor dad in 1000 words",
		max_tokens: 1200,
	});
	console.log(completion.data.choices[0].text);

}

runCompletion();
