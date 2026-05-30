import os
import requests
from dotenv import load_dotenv

load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

def rapiin_ide(teks_mentah: str) -> dict:
    prompt = f"""Kamu adalah asisten yang bertugas merapikan ide mentah pengguna.
Tugas kamu:
1. Buat judul singkat (maks 10 kata)
2. Tulis deskripsi yang lebih rapi dan detail (2-4 kalimat)

Balas HANYA dalam format JSON seperti ini, tanpa tambahan apapun:
{{"judul": "...", "deskripsi": "..."}}

Ide mentah pengguna:
{teks_mentah}"""

    response = requests.post(
        "https://openrouter.ai/api/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json"
        },
        json={
            "model": "openai/gpt-4o-mini",
            "messages": [{"role": "user", "content": prompt}]
        }
    )

    result = response.json()
    text = result["choices"][0]["message"]["content"]

    import json
    text = text.strip().replace("```json", "").replace("```", "").strip()
    return json.loads(text)