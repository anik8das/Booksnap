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
var summary = "";
var book = "";
var books = ["Thinking, Fast and Slow"];

async function generateBook() {
	book = (
		await openai.createCompletion({
			model: "text-davinci-003",
			prompt: `suggest the name of a book which is not ${books.toString()}. Just type the name of the book without the author, quotes, or a period`,
			max_tokens: 50,
		})
	).data.choices[0].text;
	console.log("book:", book);
}

async function generateSummary() {
	summary = (
		await openai.createCompletion({
			model: "text-davinci-003",
			prompt: `Summarize ${book} in concise language and with humor in 1000 words`,
			max_tokens: 1200,
		})
	).data.choices[0].text;
}

async function getSubscribers() {
	const users = (await db.collection("subscribers").get()).docs;
	for (let i = 0; i < users.length; i++) {
		subscriberEmails.push(users[i].data().email);
	}
	console.log("subscribers:", subscriberEmails);
}

async function sendEmailToSubscribers() {}
