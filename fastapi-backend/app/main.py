from fastapi import FastAPI, Form
import uvicorn
import logging
import cohere
import os
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://gen01.onrender.com"],  # Change this for security in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging for debugging
logging.basicConfig(level=logging.INFO)

# Initialize Cohere Client
COHERE_API_KEY = os.getenv("API_KEY")  # Replace with your actual key
co = cohere.ClientV2(api_key=COHERE_API_KEY)

# Conversation memory (temporary storage, consider using Redis for persistence)
conversation_memory = {}

# Predefined conversation history to set the AI's context
PREDEFINED_CONVERSATION = [
    {
        "role": "system",
        "content": "You are a Machine Learning Engineer fresher attending an interview. Respond with a professional but natural and conversational tone more humanised tone."
    },
    {
        "role": "user",
        "content": "You are given an array of size N containing numbers from 1 to N+1, but one number is missing. How would you find it?"
    },
    {
    "role": "user",
    "content": "What is the difference between shallow copy and deep copy in Python?"
    },
    {
    "role": "assistant",
    "content": "A **shallow copy** creates a new object but references nested objects. Changes to nested data affect both copies.\n\n"
               "A **deep copy** creates a new object and recursively copies all objects inside, making them independent."
    },
    {
        "role": "user",
        "content": "You are given an array of size N containing numbers from 1 to N+1, but one number is missing. How would you find it? -DSA"
    },
    {
        "role": "assistant",
        "content": "Great question! The array contains numbers from 1 to N+1, meaning one number is missing. Let’s analyze different approaches.\n\n"
                   "**Brute Force Solution:**\n"
                   "We can check for each number from 1 to N+1 whether it exists in the array. This takes O(n²) time, which is inefficient.\n\n"
                   "**Optimized Approach:**\n"
                   "A better way is to use the mathematical sum formula:\n"
                   "Sum of first (N+1) natural numbers = (N+1) * (N+2) / 2. Subtracting the sum of the given array from this sum gives the missing number.\n\n"
                   "**Here’s the optimized Python solution:**\n\n"
                   "---------------------------------------------\n"
                   "code -\n"
                   "def find_missing_number(arr):\n"
                   "    n = len(arr) + 1\n"
                   "    expected_sum = (n * (n + 1)) // 2\n"
                   "    actual_sum = sum(arr)\n"
                   "    return expected_sum - actual_sum\n"
                   "\n"
                   "# Example\n"
                   "arr = [1, 2, 4, 5, 6]\n"
                   "print(find_missing_number(arr))  # Output: 3\n"
                   "---------------------------------------------\n\n"
                   "**Time Complexity:** O(n) – We compute the sum in linear time.\n"
                   "**Space Complexity:** O(1) – No extra space is used."
    },
    {
        "role": "user",
        "content": "Given a string, find the first non-repeating character. -DSA"
    },
    {
        "role": "assistant",
        "content": "Sure! The problem requires finding the first character in the string that does not repeat. Let’s go step by step.\n\n"
                   "**Brute Force Solution:**\n"
                   "We can iterate over the string and, for each character, check if it appears again using another loop. This would take O(n²) time complexity.\n\n"
                   "**Optimized Approach:**\n"
                   "We can use a hashmap (dictionary in Python) to store the frequency of each character and then iterate again to find the first character with a count of 1.\n\n"
                   "**Here’s the optimized Python solution:**\n\n"
                   "---------------------------------------------\n"
                   "### code -\n"
                   "---------------------------------------------\n"
                   "from collections import Counter\n"
                   "\n"
                   "def first_non_repeating(s):\n"
                   "    char_count = Counter(s)  # Count frequency of characters\n"
                   "    for char in s:\n"
                   "        if char_count[char] == 1:\n"
                   "            return char\n"
                   "    return -1  # If no non-repeating character found\n"
                   "\n"
                   "### Example\n"
                   "---------------------------------------------\n"
                   "s = 'leetcode'\n"
                   "print(first_non_repeating(s))  # Output: 'l'\n"
                   "---------------------------------------------\n\n"
                   "**Time Complexity:** O(n) – We traverse the string twice (one for counting and another for finding the character).\n"
                   "**Space Complexity:** O(1) – Since we store at most 26 characters (assuming only lowercase letters)."
    }
]

@app.get("/")
def home():
    return {"message": "Server is running!"}

# Interview Assistant Processing Route
import time  # Import time module

@app.post("/process-text/")
async def process_text(user_id: str = Form(...), question: str = Form(...)):
    global conversation_memory

    if user_id not in conversation_memory:
        conversation_memory[user_id] = PREDEFINED_CONVERSATION.copy()

    conversation_memory[user_id].append({"role": "user", "content": question})

    try:
        logging.info(f"📤 Sending request to Cohere API...")

        start_time = time.perf_counter()  # Start timing

        response = co.chat(
            model="command-r-plus-08-2024",
            messages=conversation_memory[user_id],
            max_tokens=1000,
            temperature=0.2,
        )

        end_time = time.perf_counter()  # End timing
        elapsed_time = end_time - start_time  # Calculate duration

        answer = response.message.content
        answer = " ".join(item.text for item in answer) if isinstance(answer, list) else answer.text  

        if not answer:
            return {"error": "Cohere API returned an empty response."}

        formatted_answer = f"{format_response(answer)}\n\n🕒" # Response Time: {elapsed_time:.4f} seconds
        conversation_memory[user_id].append({"role": "assistant", "content": formatted_answer})

        # ✅ Print response time in the console
        print(f"🕒 Response Time: {elapsed_time:.4f} seconds")
        logging.info(f"🕒 Response Time: {elapsed_time:.4f} seconds")  # Also log it

        return {"answer": formatted_answer, "response_time": f"{elapsed_time:.4f} seconds"}

    except Exception as e:
        logging.error(f"❌ Error processing response: {e}")
        return {"error": f"Error processing response: {str(e)}"}



# Helper function to format the response
def format_response(response_text, max_words=2000):
    """
    Formats the response into a structured markdown format.
    Ensures proper bullet points, trims excess words, and avoids mid-sentence cut-offs.
    """
    formatted_text = response_text.replace("* ", "• ")

    words = formatted_text.split()
    if len(words) > max_words:
        trimmed_text = " ".join(words[:max_words])
        if "." in trimmed_text:
            trimmed_text = trimmed_text.rsplit(".", 1)[0] + "."
        else:
            trimmed_text += "..."
        formatted_text = trimmed_text

    return f"### Answer:\n{formatted_text}"


if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)
