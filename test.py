import os
import google.generativeai as genai

genai.configure(api_key="AIzaSyAx9HV6p-baDCsuNo_U2fNYBot0UJOvXQ8")

# Create the model
generation_config = {
  "temperature": 1,
  "top_p": 0.95,
  "top_k": 64,
  "max_output_tokens": 8192,
  "response_mime_type": "text/plain",
}

model = genai.GenerativeModel(
  model_name="gemini-exp-1206",
  generation_config=generation_config,
)

chat_session = model.start_chat(
  history=[
  ]
)

response = chat_session.send_message("你觉得在线聊天平台web端可以有什么功能")

# sk-5a14ee3ba03dcea3e40686369bf31b5d