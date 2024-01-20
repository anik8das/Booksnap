import modal
from modal import Image

stub = modal.Stub()

stub.variables = modal.Dict.new()

booksnap_image = Image.debian_slim().pip_install("firebase_admin", "openai")

with booksnap_image.imports():
    import json
    import os
    import smtplib
    from email.mime.multipart import MIMEMultipart
    from email.mime.text import MIMEText

    import firebase_admin
    from firebase_admin import credentials, firestore
    from openai import OpenAI

    # define global api clients
    client = OpenAI(api_key=str(os.environ['OPENAI_API_KEY']))
    api_dict = json.loads(os.environ["FIRESTORE_API"])
    cred = credentials.Certificate(api_dict)
    firebase_admin.initialize_app(cred)
    db = firestore.client()


@stub.function(image=booksnap_image, secret=modal.Secret.from_name("Booksnap-keys"))
async def get_used_book_list_1():
    books_docs = db.collection('books').stream()
    books = [doc.to_dict()['name'].replace('\n', '') for doc in books_docs]
    print("Used books retrieved from Firebase!", books)
    stub.variables['books'] = books


@stub.function(image=booksnap_image, secret=modal.Secret.from_name("Booksnap-keys"))
async def generate_book():
    print("Generating book name...")
    messages = []
    messages.append({
        'role': 'user',
        'content': f'suggest the name of a single book which is not {", ".join(stub.variables["books"])}. Just type the name of the book without the author, quotes, or a period',
    })
    book = client.chat.completions.create(model="gpt-3.5-turbo",
        messages=messages).choices[0].message.content
    messages.append({'role': 'assistant', 'content': book})
    print("Book name:", book)
    stub.variables['book'] = book
    stub.variables['messages'] = messages


@stub.function(image=booksnap_image, secret=modal.Secret.from_name("Booksnap-keys"))
async def generate_summary():
    print("Generating summary...")
    messages = stub.variables['messages']
    messages.append({
        'role': 'user',
        'content': f'Give an in-depth plot summary of the book ${stub.variables["book"]} in 800 words. Do not include takeaways',
    })
    summary = client.chat.completions.create(model="gpt-3.5-turbo",
    messages=messages).choices[0].message.content
    messages.append({'role': 'assistant', 'content': summary})
    print("Summary generated!", summary)
    stub.variables['summary'] = summary
    stub.variables['messages'] = messages


@stub.function(image=booksnap_image, secret=modal.Secret.from_name("Booksnap-keys"))
async def generate_takeaway():
    print("Generating Takeaway...")
    messages = stub.variables['messages']
    messages.append({
        'role': 'user',
        'content': f'Give the main takeaways of the book ${stub.variables["book"]} in 200 words.',
    })
    takeaway = client.chat.completions.create(model="gpt-3.5-turbo",
    messages=messages).choices[0].message.content
    messages.append({'role': 'assistant', 'content': takeaway})
    print("Takeaway generated!", takeaway)
    stub.variables['takeaway'] = takeaway
    stub.variables['messages'] = messages


@stub.function(image=booksnap_image, secret=modal.Secret.from_name("Booksnap-keys"))
async def get_subscribers():
    print("Getting subscribers...")
    users = db.collection('subscribers').stream()
    subscriber_emails = [user.to_dict()['email'] for user in users]
    print("Subscriber list retrieved from Firebase!")
    stub.variables['subscriber_emails'] = subscriber_emails


@stub.function(image=booksnap_image, secret=modal.Secret.from_name("Booksnap-keys"))
async def send_email_to_subscribers():
    sender_email = str(os.environ['NODEMAILER_EMAIL'])
    password = str(os.environ['NODEMAILER_PASSWORD'])

    # Setting up the SMTP server
    server = smtplib.SMTP_SSL('smtp.gmail.com', 465)
    server.login(sender_email, password)

    for receiver_email in stub.variables['subscriber_emails']:
        msg = MIMEMultipart()
        msg['From'] = 'BookSnap <{sender_email}>'
        msg['To'] = receiver_email
        msg['Subject'] = stub.variables['book']
        formatted_summary = stub.variables['summary'].replace("\n", "<br/>")
        formatted_takeaway = stub.variables['takeaway'].replace("\n", "<br/>")
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
            <h1>{stub.variables['book']}</h1>
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


@stub.function(image=booksnap_image, secret=modal.Secret.from_name("Booksnap-keys"))
async def upload_book_to_firebase():
    print("Uploading book to Firebase...")
    db.collection('books').add({'name': stub.variables['book']})
    print("Book uploaded to Firebase!")


@stub.local_entrypoint()
def main():
    get_used_book_list_1.remote()
    generate_book.remote()
    generate_summary.remote()
    generate_takeaway.remote()
    get_subscribers.remote()
    send_email_to_subscribers.remote()
    upload_book_to_firebase.remote()
