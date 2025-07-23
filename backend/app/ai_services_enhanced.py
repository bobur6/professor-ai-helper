"""
Enhanced AI Services for Professor AI Helper

This module provides advanced AI capabilities for educational content generation and processing.
"""
from typing import Dict, List, Optional, Union, Literal
import re
import json
from datetime import datetime
import google.generativeai as genai
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Configure the AI model
MODEL_AVAILABLE = False
try:
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        print("Error: GOOGLE_API_KEY environment variable is not set")
    else:
        print(f"Initializing AI model with API key: {api_key[:5]}...{api_key[-5:] if api_key else ''}")
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-pro')
        MODEL_AVAILABLE = True
        print("AI model initialized successfully")
except Exception as e:
    print(f"Error initializing AI model: {str(e)}")
    import traceback
    traceback.print_exc()
    MODEL_AVAILABLE = False

# Constants
MAX_CONTEXT_LENGTH = 30000  # Characters
MAX_RESPONSE_LENGTH = 10000  # Characters
DEFAULT_TEMPERATURE = 0.7

class TeachingAssistant:
    """Enhanced teaching assistant with specialized educational capabilities."""
    
    def __init__(self):
        self.system_prompt = """
        You are an expert AI teaching assistant designed to help professors and educators.
        Your capabilities include:
        - Analyzing educational content
        - Generating quizzes and test questions
        - Creating summaries and study guides
        - Explaining complex concepts
        - Providing teaching suggestions
        - Formatting content for educational use
        
        Always:
        1. Be clear, concise, and accurate
        2. Use appropriate academic language
        3. Structure responses for readability
        4. Cite sources when possible
        5. Adhere to educational standards
        """
    
    def _truncate_text(self, text: str, max_length: int) -> str:
        """Truncate text to fit within the maximum length while preserving whole words."""
        if len(text) <= max_length:
            return text
        return text[:max_length].rsplit(' ', 1)[0] + '...'
    
    def _extract_json_from_response(self, text: str) -> dict:
        """Extract JSON content from a text response."""
        if not text:
            return {}
            
        try:
            # Try to parse the entire response as JSON first
            try:
                return json.loads(text)
            except json.JSONDecodeError:
                pass
                
            # Look for JSON in code blocks
            json_match = re.search(r'```(?:json)?\n(.*?)\n```', text, re.DOTALL)
            if json_match:
                return json.loads(json_match.group(1))
            
            # Try to find JSON object directly
            json_match = re.search(r'\{[^{}]*\}', text, re.DOTALL)
            if json_match:
                return json.loads(json_match.group(0))
                
        except (json.JSONDecodeError, AttributeError) as e:
            print(f"Error parsing JSON response: {e}")
            print(f"Response text: {text[:500]}...")  # Log first 500 chars for debugging
            
        return {}
    
    def _generate_response(
        self, 
        prompt: str, 
        temperature: float = DEFAULT_TEMPERATURE,
        max_tokens: int = 2000
    ) -> str:
        """Generate a response from the AI model with error handling."""
        if not MODEL_AVAILABLE:
            error_msg = "Error: The AI service is not available. Please check the server logs."
            print(error_msg)
            return error_msg
        
        try:
            print(f"Sending request to AI model with prompt: {prompt[:200]}...")  # Log first 200 chars of prompt
            
            response = model.generate_content(
                prompt,
                generation_config={
                    "temperature": temperature,
                    "max_output_tokens": max_tokens,
                    "top_p": 0.95,
                    "top_k": 40
                }
            )
            
            print(f"Received AI response: {response}")  # Log the raw response
            
            if not response:
                error_msg = "Error: Empty response from AI model"
                print(error_msg)
                return error_msg
                
            # Check if response has parts (for compatibility with different model versions)
            if hasattr(response, 'text'):
                print(f"Response text: {response.text[:200]}...")  # Log first 200 chars of response
                return response.text
            elif hasattr(response, 'parts') and response.parts:
                response_text = response.text if hasattr(response, 'text') else str(response.parts)
                print(f"Response parts: {response_text[:200]}...")  # Log first 200 chars of parts
                return response_text
            elif hasattr(response, 'candidates') and response.candidates:
                # Handle different response format from some model versions
                candidate = response.candidates[0]
                if hasattr(candidate, 'content') and hasattr(candidate.content, 'parts'):
                    response_text = candidate.content.parts[0].text if candidate.content.parts else str(candidate)
                    print(f"Candidate response: {response_text[:200]}...")  # Log first 200 chars
                    return response_text
                else:
                    error_msg = f"Unexpected candidate format: {candidate}"
                    print(error_msg)
                    return error_msg
            else:
                error_msg = f"Unexpected response format: {response}"
                print(error_msg)
                return error_msg
            
        except Exception as e:
            error_msg = f"Error generating AI response: {str(e)}"
            print(error_msg)
            import traceback
            traceback.print_exc()
            return f"I encountered an error while processing your request: {str(e)}"
    
    def analyze_document(self, document_text: str, query: str) -> str:
        """Analyze document content based on a specific query."""
        truncated_text = self._truncate_text(document_text, MAX_CONTEXT_LENGTH // 2)
        
        prompt = f"""
        {self.system_prompt}
        
        DOCUMENT ANALYSIS TASK
        ---------------------
        Document Content:
        {truncated_text}
        
        User Query: {query}
        
        Please provide a detailed analysis based on the document content and the user's query.
        Structure your response with clear sections and use markdown formatting.
        """
        
        return self._generate_response(prompt)
    
    def generate_quiz(
        self, 
        document_text: str, 
        question_count: int = 5, 
        difficulty: str = "medium",
        question_type: str = "multiple_choice"
    ) -> dict:
        """Generate a quiz based on the document content."""
        truncated_text = self._truncate_text(document_text, MAX_CONTEXT_LENGTH // 2)
        
        prompt = f"""
        {self.system_prompt}
        
        QUIZ GENERATION TASK
        --------------------
        Document Content:
        {truncated_text}
        
        Please generate a quiz with the following specifications:
        - Number of questions: {question_count}
        - Difficulty: {difficulty}
        - Question type: {question_type}
        
        Format your response as a JSON object with the following structure:
        {{
            "title": "Quiz Title",
            "description": "Brief description of the quiz",
            "questions": [
                {{
                    "question": "The question text",
                    "type": "{question_type}",
                    "options": ["Option 1", "Option 2", ...],
                    "correct_answer": 0,
                    "explanation": "Explanation of the correct answer"
                }}
            ]
        }}
        
        For multiple choice questions, provide 4 options. For true/false, use ["True", "False"].
        """
        
        response = self._generate_response(prompt, temperature=0.3)
        result = self._extract_json_from_response(response)
        
        if not result:
            return {
                "error": "Failed to generate quiz",
                "raw_response": response[:1000]  # Include part of the response for debugging
            }
            
        return result
    
    def generate_questions(
        self, 
        document_text: str, 
        count: int = 5, 
        question_type: str = "comprehension"
    ) -> List[dict]:
        """Generate study questions based on the document content."""
        truncated_text = self._truncate_text(document_text, MAX_CONTEXT_LENGTH // 2)
        
        prompt = f"""
        {self.system_prompt}
        
        QUESTION GENERATION TASK
        -----------------------
        Document Content:
        {truncated_text}
        
        Please generate {count} {question_type} questions based on the document content.
        Format your response as a JSON array of question objects:
        
        [
            {{
                "question": "The question text",
                "type": "{question_type}",
                "answer": "The answer to the question",
                "page_reference": "Page number or section reference (if applicable)",
                "difficulty": "easy/medium/hard"
            }}
        ]
        """
        
        response = self._generate_response(prompt, temperature=0.5)
        result = self._extract_json_from_response(response)
        
        if not result or not isinstance(result, list):
            return [{"error": "Failed to generate questions", "raw_response": response[:1000]}]
            
        return result
    
    def summarize_document(
        self, 
        document_text: str, 
        summary_type: str = "concise",
        length: str = "medium"
    ) -> dict:
        """Generate a summary of the document content."""
        truncated_text = self._truncate_text(document_text, MAX_CONTEXT_LENGTH // 2)
        
        prompt = f"""
        {self.system_prompt}
        
        DOCUMENT SUMMARY TASK
        --------------------
        Document Content:
        {truncated_text}
        
        Please create a {summary_type} summary of the document.
        Length: {length}
        
        Format your response as a JSON object with the following structure:
        {{
            "title": "Document Title",
            "summary": "The main summary text",
            "key_points": [
                "Key point 1",
                "Key point 2",
                ...
            ],
            "keywords": ["keyword1", "keyword2", ...],
            "estimated_reading_time_minutes": 5
        }}
        """
        
        response = self._generate_response(prompt, temperature=0.3)
        result = self._extract_json_from_response(response)
        
        if not result:
            return {
                "error": "Failed to generate summary",
                "raw_response": response[:1000]
            }
            
        return result

# Create a singleton instance
teaching_assistant = TeachingAssistant()
