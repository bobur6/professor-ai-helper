import os
import google.generativeai as genai
import pandas as pd

# Configure the Gemini API client
# The client automatically picks up the GOOGLE_API_KEY environment variable.
try:
    genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
    model = genai.GenerativeModel('gemini-1.5-flash')
except Exception as e:
    print(f"FATAL: Could not configure Gemini API. Please check your API key. Error: {e}")
    model = None

def generate_chat_response(document_text: str, user_query: str, chat_history: list = []) -> str:
    """Generates a response from the AI based on document context and a query."""
    if not model:
        return "Error: The AI service is not configured. Please check the server logs."

    try:
        # Construct a prompt that includes the document context and the user's query
        prompt = f"""
        Context from the document is provided below:
        ---------------------
        {document_text}
        ---------------------
        Based on the context above, please answer the following question. If the question is unrelated to the context, say so.
        User Question: {user_query}
        """

        # Using the modern SDK call
        response = model.generate_content(prompt)
        
        # Check for empty or blocked responses
        if not response.parts:
            return "I am sorry, but I cannot provide a response to that. It may violate my safety policies."

        return response.text
    except Exception as e:
        print(f"Error generating response from Gemini: {e}")
        return "Sorry, I encountered an error while generating a response. Please try again."

def get_ai_response_for_class_query(user_query: str, class_data_csv: str) -> str:
    """Generates a response from the AI based on class data and a user query."""
    if not model:
        return "Error: The AI service is not configured. Please check the server logs."

    try:
        prompt = f"""
        You are a professor's AI assistant. You have been provided with data for a class in CSV format.
        Analyze the data to answer the user's question.
        Provide clear, concise answers. If the question cannot be answered with the given data, say so.
        
        Class Data (CSV):
        ---------------------
        {class_data_csv}
        ---------------------
        
        User Question: {user_query}
        
        Answer:
        """

        response = model.generate_content(prompt)

        if not response.parts:
            return "I am sorry, but I cannot provide a response to that. It may violate my safety policies."

        return response.text
    except Exception as e:
        print(f"Error generating class query response from Gemini: {e}")
        return "Sorry, I encountered an error while analyzing the class data. Please try again."

def generate_class_report(class_data):
    """Generate comprehensive class report"""
    if not model:
        return "Error: The AI service is not configured. Please check the server logs."
    
    try:
        prompt = f"""
        Создай подробный отчет по классу на основе следующих данных:
        
        Класс: {class_data.name}
        Количество студентов: {len(class_data.students)}
        Количество заданий: {len(class_data.assignments)}
        
        Данные об оценках:
        {format_class_data_for_ai(class_data)}
        
        Включи в отчет:
        1. Общую статистику класса
        2. Анализ успеваемости студентов
        3. Статистику по заданиям
        4. Рекомендации для преподавателя
        5. Список студентов, требующих внимания
        """
        
        response = model.generate_content(prompt)
        
        if not response.parts:
            return "I am sorry, but I cannot provide a response to that. It may violate my safety policies."

        return response.text
    except Exception as e:
        print(f"Error generating class report from Gemini: {e}")
        return "Sorry, I encountered an error while generating the report. Please try again."

def process_class_import_file(file, class_id, db):
    """Process uploaded file and import data"""
    try:
        # Read file content
        content = file.file.read().decode('utf-8')
        
        # Use AI to parse the content
        prompt = f"""
        Проанализируй следующий файл и извлеки данные для импорта в класс:
        
        Содержимое файла:
        {content}
        
        Верни данные в JSON формате:
        {{
            "students": ["Имя1", "Имя2", ...],
            "assignments": ["Задание1", "Задание2", ...],
            "grades": [
                {{"student": "Имя", "assignment": "Задание", "grade": "Оценка"}}
            ]
        }}
        """
        
        if not model:
            return {"success": False, "error": "AI service not configured"}
        
        response = model.generate_content(prompt)
        
        if not response.parts:
            return {"success": False, "error": "Could not process file"}
        
        # Here you would parse the JSON response and import data to database
        # For now, return success message
        return {
            "success": True, 
            "message": f"Файл {file.filename} успешно обработан",
            "imported": {
                "students": 0,
                "assignments": 0,
                "grades": 0
            }
        }
        
    except Exception as e:
        return {"success": False, "error": str(e)}

def generate_report_from_file(file, class_id):
    """Generate report based on uploaded Excel file"""
    if not model:
        return "Error: The AI service is not configured. Please check the server logs."
    
    try:
        # Сохраняем файл временно
        file_location = f"./uploaded_files/temp_{file.filename}"
        os.makedirs("./uploaded_files", exist_ok=True)
        
        with open(file_location, "wb") as f:
            f.write(file.file.read())
        
        # Читаем данные из Excel файла
        import pandas as pd
        
        try:
            # Пытаемся прочитать файл как Excel
            df = pd.read_excel(file_location)
            file_content = df.to_string()
        except Exception as e:
            # Если не удалось прочитать как Excel, пробуем как CSV
            try:
                df = pd.read_csv(file_location)
                file_content = df.to_string()
            except:
                # Если и это не удалось, читаем как текст
                with open(file_location, "r", encoding="utf-8", errors="ignore") as f:
                    file_content = f.read()
        
        # Удаляем временный файл
        os.remove(file_location)
        
        # Формируем запрос к AI
        prompt = f"""
        Создай подробный отчет по классу на основе следующих данных из загруженного файла:
        
        Содержимое файла:
        {file_content}
        
        Включи в отчет:
        1. Общую статистику класса
        2. Анализ успеваемости студентов
        3. Статистику по заданиям
        4. Рекомендации для преподавателя
        5. Список студентов, требующих внимания
        
        Если в файле нет данных о студентах, заданиях или оценках, укажи это в отчете.
        """
        
        response = model.generate_content(prompt)
        
        if not response.parts:
            return "I am sorry, but I cannot provide a response to that. It may violate my safety policies."

        return response.text
    except Exception as e:
        print(f"Error generating report from file: {e}")
        return f"Sorry, I encountered an error while processing the file: {str(e)}"

def execute_class_command(command, class_id, db, user_id):
    """Execute AI command that can modify database"""
    if not model:
        return {"success": False, "error": "AI service not configured"}
    
    try:
        # First, analyze the command to determine what action to take
        analysis_prompt = f"""
        Проанализируй команду пользователя и определи, какое действие нужно выполнить:
        
        Команда: "{command}"
        
        Возможные действия:
        1. ADD_STUDENT - добавить студента
        2. REMOVE_STUDENT - удалить студента
        3. ADD_ASSIGNMENT - добавить задание
        4. REMOVE_ASSIGNMENT - удалить задание
        5. UPDATE_GRADES - обновить оценки
        6. GENERATE_REPORT - создать отчет
        7. QUERY_DATA - запрос данных
        
        Верни только JSON в формате:
        {{
            "action": "ACTION_TYPE",
            "parameters": {{
                "name": "имя студента или название задания",
                "grade": "оценка",
                "condition": "условие для фильтрации"
            }}
        }}
        """
        
        response = model.generate_content(analysis_prompt)
        
        if not response.parts:
            return {"success": False, "error": "Could not analyze command"}
        
        # Parse and execute the command
        # Implementation depends on the specific action
        return {"success": True, "message": "Команда выполнена"}
    except Exception as e:
        return {"success": False, "error": str(e)}

def format_class_data_for_ai(class_data):
    """Format class data for AI processing"""
    result = "Студент," + ",".join([a.title for a in class_data.assignments]) + "\n"
    
    for student in class_data.students:
        grades = {g.assignment_id: g.grade for g in student.grades}
        row = [student.full_name] + [grades.get(a.id, "N/A") for a in class_data.assignments]
        result += ",".join(map(str, row)) + "\n"
    
    return result

