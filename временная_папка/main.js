import { marked } from 'marked';

const promptInput = document.getElementById('prompt-input');
const sendButton = document.getElementById('send-button');
const chatMessages = document.getElementById('chat-messages');
const uploadButton = document.getElementById('upload-button');
const fileInput = document.getElementById('file-input');

let sessionId = null;
let fileUri = null;

uploadButton.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    addMessage('user', `Uploading ${file.name}...`);

    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            if (response.status === 415) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Unsupported file type');
            } else {
                throw new Error('File upload failed');
            }
        }

        const data = await response.json();
        fileUri = data.file_uri;
        addMessage('system', `File ${file.name} uploaded successfully.`);
    } catch (error) {
        console.error('Error uploading file:', error);
        addMessage('system', `Error uploading file: ${error.message}`);
    }
});


sendButton.addEventListener('click', sendMessage);
promptInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

async function sendMessage() {
    const prompt = promptInput.value.trim();
    if (!prompt) return;

    addMessage('user', prompt);
    promptInput.value = '';

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                prompt: prompt, 
                session_id: sessionId,
                    file_uri: fileUri
            })
        });

        if (!response.ok) {
            throw new Error('Failed to get response from server');
        }

        const data = await response.json();
        sessionId = data.session_id;
        addMessage('model', data.response);
        fileUri = null; // Reset file URI after use
    } catch (error) {
        console.error('Error:', error);
        addMessage('system', 'Error sending message.');
    }
}

function addMessage(sender, text) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', `${sender}-message`);

    if (sender === 'model') {
        messageElement.innerHTML = marked.parse(text);
    } else {
        messageElement.textContent = text;
    }

    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Drag and drop file upload
const chatContainer = document.getElementById('chat-container');

chatContainer.addEventListener('dragover', (event) => {
    event.preventDefault();
    chatContainer.classList.add('dragover');
});

chatContainer.addEventListener('dragleave', () => {
    chatContainer.classList.remove('dragover');
});

chatContainer.addEventListener('drop', (event) => {
    event.preventDefault();
    chatContainer.classList.remove('dragover');
    const file = event.dataTransfer.files[0];
    if (file) {
        fileInput.files = event.dataTransfer.files;
        const changeEvent = new Event('change');
        fileInput.dispatchEvent(changeEvent);
    }
});
