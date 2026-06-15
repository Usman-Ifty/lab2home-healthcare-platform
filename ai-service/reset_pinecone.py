import os
from dotenv import load_dotenv
from pinecone import Pinecone

load_dotenv()
api_key = os.getenv("PINECONE_API_KEY")
index_name = os.getenv("PINECONE_INDEX_NAME", "lab2home-medical")

pc = Pinecone(api_key=api_key)
existing_indexes = [idx.name for idx in pc.list_indexes()]

if index_name in existing_indexes:
    print(f"Deleting Pinecone index: {index_name}")
    pc.delete_index(index_name)
    print("Deleted successfully!")
else:
    print(f"Index {index_name} does not exist.")
