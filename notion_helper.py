import os
from notion_client import Client
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

notion = Client(auth=os.getenv("NOTION_TOKEN"))
DATABASE_ID = os.getenv("NOTION_DATABASE_ID")

def simpan_ide(judul: str, deskripsi: str, kategori: str, raw_input: str):
    notion.pages.create(
        parent={"database_id": DATABASE_ID},
        properties={
            "Judul": {
                "title": [{"text": {"content": judul}}]
            },
            "Deskripsi": {
                "rich_text": [{"text": {"content": deskripsi}}]
            },
            "Kategori": {
                "select": {"name": kategori}
            },
            "Tanggal": {
                "date": {"start": datetime.now().strftime("%Y-%m-%d")}
            },
            "Raw Input": {
                "rich_text": [{"text": {"content": raw_input}}]
            }
        }
    )