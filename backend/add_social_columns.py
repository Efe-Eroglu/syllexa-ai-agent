from sqlalchemy import create_engine, text
from app.core.config import settings

# Veritabanı bağlantısı oluştur
engine = create_engine(settings.DATABASE_URL)

# Yeni kolonları ekleyen SQL komutları
add_columns_sql = """
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS google_id VARCHAR,
ADD COLUMN IF NOT EXISTS facebook_id VARCHAR,
ADD COLUMN IF NOT EXISTS github_id VARCHAR,
ADD COLUMN IF NOT EXISTS is_social BOOLEAN DEFAULT FALSE;
"""

def add_social_columns():
    with engine.connect() as connection:
        connection.execute(text(add_columns_sql))
        connection.commit()
        print("Sosyal giriş kolonları başarıyla eklendi.")

if __name__ == "__main__":
    add_social_columns() 