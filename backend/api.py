from fastapi import FastAPI
from pydantic import BaseModel
import pandas as pd
import joblib
from sklearn.metrics.pairwise import cosine_similarity

app = FastAPI()

@app.get("/")
def root():
    return {"message": "Backend is running!"}

# Load model and dataset
vectorizer = joblib.load("name_vectorizer.pkl")
df = pd.read_csv("students_db.csv")
X = vectorizer.transform(df['Name'])

# Define request model
class Query(BaseModel):
    text: str

# Endpoint for student lookup
@app.post("/student")
def student_query(q: Query):
    query_vec = vectorizer.transform([q.text])
    sims = cosine_similarity(query_vec, X).flatten()
    idx = sims.argmax()
    student = df.iloc[idx].to_dict()
    student["similarity"] = float(sims[idx])
    
    response = (f"{student['Name']} is pursuing {student['Program']} in Year {student['Year']}. "
                f"They enjoy {student['Hobby']}, are part of the {student['Club']}, "
                f"and their notable achievement is '{student['Achievement']}'.")
    
    return {"response": response}
