import modal
from modal import Image

stub = modal.Stub()

stub.variables = modal.Dict.new()

booksnap_image = Image.debian_slim().pip_install("firebase_admin", "openai")

with booksnap_image.imports():
    import json
    import os
    import random
    import smtplib
    from email.mime.multipart import MIMEMultipart
    from email.mime.text import MIMEText

    import firebase_admin
    from firebase_admin import credentials, firestore
    from openai import OpenAI

    # Define global API clients
    client = OpenAI(api_key=str(os.environ['OPENAI_API_KEY']))
    api_dict = json.loads(os.environ["FIRESTORE_API"])
    cred = credentials.Certificate(api_dict)
    firebase_admin.initialize_app(cred)
    db = firestore.client()


@stub.function(image=booksnap_image, secret=modal.Secret.from_name("Booksnap-keys"))
async def get_subscribers_by_category():
    print("Getting subscribers for the category:", stub.variables['category'])
    users = db.collection('subscribers').where('category', '==', stub.variables['category']).stream()
    subscriber_emails = [user.to_dict()['email'] for user in users]
    print("Subscriber list retrieved from Firebase:", subscriber_emails)
    stub.variables['subscriber_emails'] = subscriber_emails


@stub.function(image=booksnap_image, secret=modal.Secret.from_name("Booksnap-keys"))
async def get_unused_books_by_category(category):
    books_docs = db.collection('books').where('category', '==', category).stream()
    books = [doc.to_dict() for doc in books_docs]
    print(f"Unused books retrieved from Firebase for category {category}:", books)
    stub.variables[f'books_{category}'] = books


@stub.function(image=booksnap_image, secret=modal.Secret.from_name("Booksnap-keys"))
async def generate_book(category):
    print("Generating book name...")
    categoryMap = {
        'self': 'self-improvement',
        'biz': 'business',
        'history': 'history and autobiographies',
        'science': 'science and technology'
    }
    books = stub.variables[f'books_{category}']
    messages = []
    messages.append({
        'role': 'user',
        'content': f'suggest the name of a single book in the {categoryMap[category]} category which is not {", ".join(book["name"] for book in books)}. Just type the name of the book without the author, quotes, or a period',
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
        'content': f'Give an in-depth plot summary of the book {stub.variables["book"]} in 800 words. Do not include takeaways',
    })
    summary = client.chat.completions.create(model="gpt-3.5-turbo",
                                             messages=messages).choices[0].message.content
    messages.append({'role': 'assistant', 'content': summary})
    print("Summary generated:", summary)
    stub.variables['summary'] = summary
    stub.variables['messages'] = messages


@stub.function(image=booksnap_image, secret=modal.Secret.from_name("Booksnap-keys"))
async def generate_takeaway():
    print("Generating Takeaway...")
    messages = stub.variables['messages']
    messages.append({
        'role': 'user',
        'content': f'Give the main takeaways of the book {stub.variables["book"]} in 200 words.',
    })
    takeaway = client.chat.completions.create(model="gpt-3.5-turbo",
                                              messages=messages).choices[0].message.content
    messages.append({'role': 'assistant', 'content': takeaway})
    print("Takeaway generated:", takeaway)
    stub.variables['takeaway'] = takeaway
    stub.variables['messages'] = messages


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
            <p>Have feedback? We'd love to hear it! You can either reply to this email or critique us <a href="https://tiny-truffle-8df4c0.netlify.app/feedback">here</a>. Want to unsubscribe? Do so <a href="https://tiny-truffle-8df4c0.netlify.app/unsubscribe">here</a> :(</p>
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
    db.collection('books').add({'name': stub.variables['book'], 'category': stub.variables['category']})
    print("Book uploaded to Firebase!")


@stub.local_entrypoint()
def main():
    categories = ['self', 'biz', 'history', 'science']
    random.shuffle(categories)

    for category in categories:
        stub.variables['category'] = category
        get_subscribers_by_category.remote()
        if not stub.variables['subscriber_emails']:
            print('skipping category:', category)
            continue
        get_unused_books_by_category.remote(category)
        generate_book.remote(category)
        generate_summary.remote()
        generate_takeaway.remote()
        send_email_to_subscribers.remote()
        upload_book_to_firebase.remote()
    
    stub.variables['category'] = 'random'
    get_subscribers_by_category.remote()
    if not stub.variables['subscriber_emails']:
        print('skipping category: random')
        return
    if not stub.variables['summary']:
        print('using category: ', categories[-1], 'for random book generation')
        get_unused_books_by_category.remote(categories[-1])
        generate_book.remote(categories[-1])
        generate_summary.remote()
        generate_takeaway.remote()
    send_email_to_subscribers.remote()
    upload_book_to_firebase.remote()

