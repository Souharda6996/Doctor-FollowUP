from sentence_transformers import SentenceTransformer

# Load model (first time will download)
model = SentenceTransformer('all-MiniLM-L6-v2')

text = "fever headache sudden illness"

embedding = model.encode(text)

print(len(embedding))  # should be 384