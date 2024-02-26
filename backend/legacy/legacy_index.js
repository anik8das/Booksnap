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
var takeaway = "";
var book = "";
var books = [];
var messages = [];

async function generateBook() {
	console.log("Generating book name...");
	messages.push({
		role: "user",
		content: `suggest the name of a book which is not ${books.toString()}. Just type the name of the book without the author, quotes, or a period`,
	});
	book = (
		await openai.createChatCompletion({
			model: "gpt-3.5-turbo",
			messages: messages,
		})
	).data.choices[0].message;
	messages.push(book);
	console.log("Book name:", book.content);
}

async function getUsedBookList() {
	console.log("Getting used books...");
	const bookDocs = (await db.collection("books").get()).docs;
	for (let i = 0; i < bookDocs.length; i++) {
		books.push(bookDocs[i].data().name.replace(/(\r\n|\n|\r)/gm, ""));
	}
	console.log("Used books retrieved from Firebase!", books);
}

async function generateSummary() {
	console.log("Generating summary...");
	messages.push({
		role: "user",
		content: `Give a in-depth plot summary of the book in 800 words. Don't include takeaways`,
	});
	summary = (
		await openai.createChatCompletion({
			model: "gpt-3.5-turbo",
			messages: messages,
		})
	).data.choices[0].message;
	messages.push(summary);
	console.log("Summary generated!", summary.content);
}

async function generateTakeaway() {
	console.log("Generating Takeaway...");
	messages.push({
		role: "user",
		content: `Give the main takeaways of the book in 200 words.`,
	});
	takeaway = (
		await openai.createChatCompletion({
			model: "gpt-3.5-turbo",
			messages: messages,
		})
	).data.choices[0].message;
	console.log("Takeaway generated!", takeaway.content);
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
		subject: `Daily Booksnap: ${book.content}`,
		html: `
			<!DOCTYPE html>
			<html>
			<head>
				<style type="text/css">

				* {
					box-sizing: border-box;
					font-family: 'Courier New', 'Times New Roman', Times, serif;
				}

				body {
					margin: 5px;
					padding: 5px;
				}

				h1 {
					text-align: center;
					margin-bottom: 20px;
					margin-top: 20px;
				}
				
				</style>
			</head>
			<body>
			<header>
				<h1>${book.content}</h1>
				<h3>Summary</h3>
				<p>${summary.content.replaceAll("\n", "<BR/>")}</p>
				<br>
				<h3>Takeaway</h3>
				<p>${takeaway.content.replaceAll("\n", "<br/>")}</p>
				<br>
			<header/>
			<footer>
				<p>Have feedback? Reply to this email and let us know! Want to unsubscribe? Do so <a href = "https://tiny-truffle-8df4c0.netlify.app/unsubscribe">here<a/> :(</p>
			</footer>
			</body>
			</html>
		`,
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
		name: book.content,
	});
	console.log("Book uploaded to Firebase!");
}

async function main() {
	await getUsedBookList();
	await generateBook();
	await generateSummary();
	await generateTakeaway();
	await getSubscribers();
	await sendEmailToSubscribers();
}

main();
