from typing import Dict, List, Optional
import json
import os
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure the AI model
MODEL_AVAILABLE = False
try:
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        print("Error: GOOGLE_API_KEY environment variable is not set")
    else:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-1.5-flash')
        MODEL_AVAILABLE = True
        print("AI model initialized successfully with gemini-1.5-flash")
except Exception as e:
    print(f"Error initializing AI model: {str(e)}")
    model = None

class TeachingAssistant:
    """A unified AI assistant for all educational and class management tasks."""

    def __init__(self):
        self.system_prompt = """
        Ты дружелюбный и полезный AI-помощник преподавателя. Отвечай на том языке, на котором задан вопрос. Будь естественным в общении, старайся быть кратким и по делу. Помогай с любыми вопросами, связанными с образованием (включая планирование уроков, проверку работ, генерацию заданий и т.п.), а также не отказывайся от обсуждения других тем, если это уместно.
        """

    def _generate_response(self, prompt: str, is_json_output: bool = False) -> str:
        """Generate a response from the AI model with robust error handling."""
        if not MODEL_AVAILABLE:
            error_msg = "AI service is not available. Check server logs."
            print(f"Error: {error_msg}")
            return json.dumps({"error": error_msg}) if is_json_output else error_msg

        try:
            generation_config = {
                "temperature": 0.7,
                "top_p": 0.95,
                "top_k": 40,
                "max_output_tokens": 8192,
            }
            if is_json_output:
                generation_config["response_mime_type"] = "application/json"

            response = model.generate_content(prompt, generation_config=generation_config)
            
            if not response.parts:
                return json.dumps({"error": "Safety policy violation. Cannot provide a response."})

            return response.text
        except Exception as e:
            error_msg = f"Error generating AI response: {str(e)}"
            print(error_msg)
            return json.dumps({"error": error_msg}) if is_json_output else error_msg

    def analyze_document_chat(self, document_text: str, query: str, chat_history: List[Dict] = []) -> str:
        """Analyzes document content to answer a query in a chat context."""
        # Безопасная обработка истории чата
        history_str = ""
        if chat_history:
            try:
                history_str = "\n".join([f"{h.get('role', 'user')}: {h.get('content', '')}" for h in chat_history if h.get('content')])
            except Exception as e:
                print(f"Error processing chat history: {e}")
                history_str = ""
        
        # Если есть документ, используем его как контекст
        if document_text and document_text.strip():
            prompt = f"""
            {self.system_prompt}
            
            У тебя есть доступ к следующему документу:
            {document_text}
            
            История разговора:
            {history_str}
            
            Вопрос пользователя: {query}
            
            Отвечай естественно. Если вопрос связан с документом - используй информацию из него. 
            Если вопрос общий - отвечай на основе своих знаний.
            """
        else:
            # Если документа нет, просто общаемся
            prompt = f"""
            {self.system_prompt}
            
            История разговора:
            {history_str}
            
            Вопрос пользователя: {query}
            """
        
        return self._generate_response(prompt)

    def generate_quiz(self, document_text: str, question_count: int, difficulty: str, question_type: str) -> dict:
        """Generates a quiz from document text."""
        prompt = f"""
        {self.system_prompt}
        Task: Generate a quiz from the document.
        Document: "{document_text}"
        Requirements:
        - Number of questions: {question_count}
        - Difficulty: {difficulty}
        - Question type: {question_type}
        Output JSON with keys: 'title', 'description', 'questions'.
        Each question should have 'question', 'type', 'options', 'correct_answer', 'explanation'.
        """
        response_str = self._generate_response(prompt, is_json_output=True)
        try:
            return json.loads(response_str)
        except json.JSONDecodeError:
            return {"error": "Failed to parse quiz JSON."}

    def generate_questions(self, document_text: str, count: int, question_type: str) -> list:
        """Generates study questions from document text."""
        prompt = f"""
        {self.system_prompt}
        Task: Generate {count} study questions of type '{question_type}'.
        Document: "{document_text}"
        Output a JSON list of objects, each with 'question' and 'answer'.
        """
        response_str = self._generate_response(prompt, is_json_output=True)
        try:
            return json.loads(response_str)
        except json.JSONDecodeError:
            return [{"error": "Failed to parse questions JSON."}]

    def summarize_document(self, document_text: str, summary_type: str, length: str) -> dict:
        """Generates a summary of a document."""
        prompt = f"""
        {self.system_prompt}
        Task: Summarize the document.
        Document: "{document_text}"
        Type: {summary_type}, Length: {length}
        Output JSON with 'title', 'summary', 'key_points', 'keywords'.
        """
        response_str = self._generate_response(prompt, is_json_output=True)
        try:
            return json.loads(response_str)
        except json.JSONDecodeError:
            return {"error": "Failed to parse summary JSON."}

    def generate_class_report(self, class_data_str: str) -> str:
        """Generates a class report from formatted data."""
        prompt = f"""
        {self.system_prompt}
        Task: Create a class report in Russian based on the data.
        Data: {class_data_str}
        Report must include: overall performance, student analysis, assignment analysis, and recommendations.
        Format as markdown.
        """
        return self._generate_response(prompt)

    def process_import_file(self, file_content: str) -> dict:
        """Parses file content to extract structured class data."""
        prompt = f"""
        {self.system_prompt}
        Task: Extract class data from the file content.
        File Content: {file_content}
        Return JSON with 'students', 'assignments', 'grades'.
        """
        response_str = self._generate_response(prompt, is_json_output=True)
        try:
            return json.loads(response_str)
        except json.JSONDecodeError:
            return {"error": "Failed to parse import file JSON."}
            
    def generate_file_report(self, file_content: str) -> str:
        """Generates a report from file content."""
        prompt = f"""
        {self.system_prompt}
        Task: Create a comprehensive report in Russian based on the file content.
        File Content: {file_content}
        Report must include: summary of the content, key insights, analysis, and recommendations.
        Format as markdown with clear sections and bullet points where appropriate.
        """
        return self._generate_response(prompt)

# Singleton instance
teaching_assistant = TeachingAssistant()
