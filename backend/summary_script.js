const { OpenAIApi, Configuration } = require("openai");
require("dotenv").config();
const fs = require("firebase-admin");
const serviceAccount = require("./firestore_API.json");

const configuration = new Configuration({
	apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

fs.initializeApp({
	credential: fs.credential.cert(serviceAccount),
});
const db = fs.firestore();

var subscriberEmails = [];

async function runCompletion() {
	const completion = await openai.createCompletion({
		model: "text-davinci-003",
		prompt: "Summarize rich dad poor dad in concise language and with humor in 1000 words",
		max_tokens: 1200,
	});
	console.log(completion.data.choices[0].text);

	const users = (await db.collection("subscribers").get()).docs;
	// iterate through each user and get emails
	for (let i = 0; i < users.length; i++) {
		subscriberEmails.push(users[i].data().email);
	}
	console.log(subscriberEmails);
}

runCompletion();
