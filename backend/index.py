import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import firebase_admin
from dotenv import load_dotenv
from firebase_admin import credentials, firestore
from openai import OpenAI

# import environment variables from .env
load_dotenv()

# Initialize OpenAI
client = OpenAI(api_key=os.environ['OPENAI_API_KEY'])


# Initialize Firebase
cred = credentials.Certificate('./firestore_API.json')
firebase_admin.initialize_app(cred)
db = firestore.client()

subscriber_emails = []
summary = ""
takeaway = ""
book = ""
books = []
messages = []

async def generate_book():
    print("Generating book name...")
    messages.append({
        'role': 'user',
        'content': f'suggest the name of a book which is not {", ".join(books)}. Just type the name of the book without the author, quotes, or a period',
    })
    global book
    book = client.chat.completions.create(model="gpt-3.5-turbo",
        messages=messages).choices[0].message.content
    messages.append({'role': 'assistant', 'content': book})
    print("Book name:", book)

async def get_used_book_list():
    print("Getting used books...")
    books_docs = db.collection('books').stream()
    global books
    books = [doc.to_dict()['name'].replace('\n', '') for doc in books_docs]
    print("Used books retrieved from Firebase!", books)

async def generate_summary():
    print("Generating summary...")
    messages.append({
        'role': 'user',
        'content': 'Give an in-depth plot summary of the book in 800 words. Don\'t include takeaways',
    })
    global summary
    summary = client.chat.completions.create(model="gpt-3.5-turbo",
    messages=messages).choices[0].message.content
    messages.append({'role': 'assistant', 'content': summary})
    print("Summary generated!", summary)

async def generate_takeaway():
    print("Generating Takeaway...")
    messages.append({
        'role': 'user',
        'content': 'Give the main takeaways of the book in 200 words.',
    })
    global takeaway
    takeaway = client.chat.completions.create(model="gpt-3.5-turbo",
    messages=messages).choices[0].message.content
    messages.append({'role': 'assistant', 'content': takeaway})
    print("Takeaway generated!", takeaway)

async def get_subscribers():
    print("Getting subscribers...")
    users = db.collection('subscribers').stream()
    global subscriber_emails
    subscriber_emails = [user.to_dict()['email'] for user in users]
    print("Subscriber list retrieved from Firebase!")

async def send_email_to_subscribers():
    sender_email = os.getenv('NODEMAILER_EMAIL')
    password = os.getenv('NODEMAILER_PASSWORD')

    # Setting up the SMTP server
    server = smtplib.SMTP('smtp.gmail.com', 587)
    server.starttls()
    server.login(sender_email, password)

    for receiver_email in subscriber_emails:
        msg = MIMEMultipart()
        msg['From'] = sender_email
        msg['To'] = receiver_email
        msg['Subject'] = f"Daily Booksnap: {book}"
        formatted_summary = summary.replace("\n", "<br/>")
        formatted_takeaway = takeaway.replace("\n", "<br/>")
        body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style type="text/css">
                * {{ box-sizing: border-box; font-family: 'Courier New', 'Times New Roman', Times, serif; }}
                body {{ margin: 5px; padding: 5px; }}
                h1 {{ text-align: center; margin-bottom: 20px; margin-top: 20px; }}
            </style>
        </head>
        <body>
        <header>
            <h1>{book}</h1>
            <h3>Summary</h3>
            <p>{formatted_summary}</p>
            <br>
            <h3>Takeaway</h3>
            <p>{formatted_takeaway}</p>
            <br>
        </header>
        <footer>
            <p>Have feedback? Reply to this email and let us know! Want to unsubscribe? Do so <a href="https://tiny-truffle-8df4c0.netlify.app/unsubscribe">here</a> :(</p>
        </footer>
        </body>
        </html>
        """
        msg.attach(MIMEText(body, 'html'))

        server.send_message(msg)

    server.quit()
    print("Emails sent!")

async def upload_book_to_firebase():
    print("Uploading book to Firebase...")
    db.collection('books').add({'name': book})
    print("Book uploaded to Firebase!")

async def main():
    await get_used_book_list()
    await generate_book()
    await generate_summary()
    await generate_takeaway()
    await get_subscribers()
    await send_email_to_subscribers()
    await upload_book_to_firebase()

# Run the main function
import asyncio

asyncio.run(main())
