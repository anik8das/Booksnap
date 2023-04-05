const { OpenAIApi, Configuration } = require("openai");
require("dotenv").config();
const fs = require("firebase-admin");
const serviceAccount = require("./firestore_API.json");
var nodemailer = require("nodemailer");

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
var books = [];

async function generateBook() {
	console.log("Generating book name...");
	book = (
		await openai.createCompletion({
			model: "text-davinci-003",
			prompt: `suggest the name of a book which is not ${books.toString()}. Just type the name of the book without the author, quotes, or a period`,
			max_tokens: 50,
		})
	).data.choices[0].text;
	console.log("Book name:", book);
}

async function getUsedBookList() {
	console.log("Getting used books...");
	const bookDocs = (await db.collection("books").get()).docs;
	console.log(bookDocs);
	for (let i = 0; i < bookDocs.length; i++) {
		console.log(bookDocs[i].data().name);
	}
	console.log("Used books retrieved from Firebase!");
}

async function generateSummary() {
	console.log("Generating summary...");
	summary = (
		await openai.createCompletion({
			model: "text-davinci-003",
			prompt: `Write an in-depth summary of ${book} with all the takeaways`,
			max_tokens: 2000,
		})
	).data.choices[0].text;
	console.log("Summary generated!");
}

async function getSubscribers() {
	console.log("Getting subscribers...");
	const users = (await db.collection("subscribers").get()).docs;
	for (let i = 0; i < users.length; i++) {
		subscriberEmails.push(users[i].data().email);
	}
	console.log("Subscriber list retrieved from Firebase!");
}

async function sendEmailToSubscribers() {
	var transporter = nodemailer.createTransport({
		service: "gmail",
		auth: {
			user: process.env.NODEMAILER_EMAIL,
			pass: process.env.NODEMAILER_PASSWORD,
		},
	});

	var mailOptions = {
		from: process.env.NODEMAILER_EMAIL,
		to: subscriberEmails,
		subject: `Daily Booksnap: Summary for ${book}`,
		text: summary,
	};

	transporter.sendMail(mailOptions, function (error, info) {
		if (error) {
			console.log(error);
		} else {
			console.log("Email sent: " + info.response);
			uploadBookToFirebase();
		}
	});
}

async function uploadBookToFirebase() {
	console.log("Uploading book to Firebase...");
	await db.collection("books").add({
		name: book,
	});
	console.log("Book uploaded to Firebase!");
}

async function main() {
	await generateBook();
	await getUsedBookList();
	await generateSummary();
	await getSubscribers();
	await sendEmailToSubscribers();
}

main();
