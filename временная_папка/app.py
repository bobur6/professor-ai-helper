import os
import mimetypes
import google.generativeai as genai
from flask import Flask, request, jsonify, send_from_directory
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__, static_folder='public', static_url_path='')

# Configure the Gemini API key
try:
    genai.configure(api_key=os.environ['GEMINI_API_KEY'])
except KeyError:
    print("GEMINI_API_KEY not found in .env file. Please create a .env file and add your API key.")
    exit()

# In-memory storage for conversation history and uploaded files
conversation_history = {}
uploaded_files = {}

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

# We will use a simple in-memory dictionary to store chat history.
# In a production environment, you would want to use a more robust solution like a database.
chat_sessions = {}

# Create a directory for file uploads if it doesn't exist
if not os.path.exists('uploads'):
    os.makedirs('uploads')

SUPPORTED_MIME_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif',
    'video/mpeg',
    'video/mp4',
    'video/quicktime',
    'video/x-flv',
    'video/x-ms-wmv',
    'video/x-msvideo',
    'video/3gpp',
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/ogg',
    'audio/aac',
    'audio/flac',
]

@app.route('/api/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    mime_type, _ = mimetypes.guess_type(file.filename)

    if mime_type not in SUPPORTED_MIME_TYPES:
        return jsonify({'error': f'Unsupported file type: {mime_type}. Please upload a supported file.'}), 415

    if file:
        filepath = os.path.join('uploads', file.filename)
        file.save(filepath)

        # Upload the file to the Gemini API
        gemini_file = genai.upload_file(path=filepath, mime_type=mime_type)

        return jsonify({'file_uri': gemini_file.uri})


@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.get_json()
    prompt = data.get('prompt')
    session_id = data.get('session_id') # You would generate/manage this on the frontend

    if not session_id:
        # Create a new session if one doesn't exist
        session_id = str(os.urandom(16).hex())
        chat_sessions[session_id] = []

    # Prepare the prompt parts
    prompt_parts = [prompt]

    file_uri = data.get('file_uri')
    if file_uri:
        uploaded_file = genai.get_file(name=file_uri.split('/')[-1])
        prompt_parts.append(uploaded_file)

    # Add the user's message to the history
    chat_sessions[session_id].append({"role": "user", "parts": prompt_parts})


    # Get the conversation history for the session
    history = chat_sessions[session_id]

    model = genai.GenerativeModel('gemini-1.5-flash')
    chat = model.start_chat(history=history)
    response = chat.send_message(prompt_parts)

    # Add the model's response to the history
    chat_sessions[session_id].append({"role": "model", "parts": [response.text]})

    return jsonify({'response': response.text, 'session_id': session_id})

if __name__ == '__main__':
    app.run(debug=True, port=5000)