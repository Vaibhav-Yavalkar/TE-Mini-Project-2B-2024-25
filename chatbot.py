import os
import streamlit as st
from dotenv import load_dotenv
import google.generativeai as gen_ai

# Load environment variables
load_dotenv()

# configure Streamlit page settings
st.set_page_config(
    page_title="Fashion Chatbot!!",
    page_icon="👗",  
    layout="centered",  # Page layout option
)

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

# set up Google Gemini-Pro AI model
gen_ai.configure(api_key=GOOGLE_API_KEY)
model = gen_ai.GenerativeModel('gemini-1.5-pro-latest')

# function to translate roles between Gemini-Pro & streamlit
def translate_role_for_streamlit(user_role):
    return "assistant" if user_role == "model" else user_role

# Function to check if the query is fashion-related
def is_fashion_related(query):
    fashion_keywords = [
        # Previous keywords + new additions
        "fashion", "style", "outfit", "clothes", "dressing", "trends", "shoes",
        "accessories", "wardrobe", "color matching", "formal wear", "casual wear",
        "party dress", "wedding outfit", "jacket", "jeans", "t-shirt", "heels",
        "boots", "sneakers", "styling tips", "skin tone", "occasion outfit",
        "clothing color according to skin tone", "shirt", "blouse", "skirt",
        "pants", "leggings", "sweater", "hoodie", "coat", "blazer", "suit",
        "shorts", "dress", "gown", "lingerie", "swimwear", "activewear",
        "loungewear", "sandals", "flats", "loafers", "oxfords", "stilettos",
        "wedges", "espadrilles", "mules", "slides", "handbag", "purse",
        "wallet", "belt", "scarf", "hat", "cap", "sunglasses", "gloves", "tie",
        "bowtie", "jewelry", "necklace", "bracelet", "earrings", "watch",
        "streetwear", "vintage fashion", "bohemian", "minimalist fashion",
        "grunge", "preppy", "athleisure", "haute couture", "sustainable fashion",
        "capsule wardrobe", "fashion week", "runway", "lookbook", "ootd",
        "styling hacks", "body type dressing", "seasonal trends",
        "fashion influencer", "silk", "cotton", "denim", "linen", "wool",
        "cashmere", "polyester", "leather", "suede", "velvet", "lace",
        "monochrome", "pastel", "neutral tones", "animal print", "stripes",
        "polka dots", "floral print", "plaid", "checkered", "workwear",
        "business casual", "cocktail dress", "beach outfit", "winter fashion",
        "summer outfit", "festival look", "makeup look", "hairstyle", "nail art",
        "perfume", "skincare routine"
    ]
    return any(keyword in query.lower() for keyword in fashion_keywords)

# Initialize chat session in Streamlit if not already present
if "chat_session" not in st.session_state:
    st.session_state.chat_session = model.start_chat(history=[])

# Display the chatbot's title on the page
st.title("💅Your Fashion Chatbot!")
st.write("Get expert fashion advice, outfit suggestions, and style tips!")

# Display the chat history
for message in st.session_state.chat_session.history:
    with st.chat_message(translate_role_for_streamlit(message.role)):
        st.markdown(message.parts[0].text)

# Input field for user's fashion-related queries
user_prompt = st.chat_input("Ask about fashion, styling, or outfit ideas...")
if user_prompt:
    # Check if the query is fashion-related
    if is_fashion_related(user_prompt):
        # Add user's message to chat and display it
        st.chat_message("user").markdown(user_prompt)

        # Send user's message to Gemini-Pro and get the response
        gemini_response = st.session_state.chat_session.send_message(user_prompt)

        # Display Gemini-Pro's response
        with st.chat_message("assistant"):
            st.markdown(gemini_response.text)
    else:
        # Inform user that only fashion-related queries are allowed
        st.chat_message("assistant").markdown("❌ Sorry, I only answer fashion-related questions. Ask me about style, outfits, or trends!")

if __name__ == "__main__":
    port = 8501 
    os.system(f"streamlit run {__file__} --server.port={port} --server.headless=true")