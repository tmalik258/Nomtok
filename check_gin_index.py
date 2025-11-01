import asyncio
from sqlalchemy import text
from app.database import get_async_db

async def check_and_create_gin_index():
    """Check if GIN index exists on review_sections and create if not"""
    async for db in get_async_db():
        try:
            # Check if index exists
            result = await db.execute(text("""
                SELECT indexname, indexdef 
                FROM pg_indexes 
                WHERE tablename = 'listings' 
                AND indexname LIKE '%review_sections%';
            """))
            existing_indexes = result.fetchall()
            
            if existing_indexes:
                print("GIN index already exists on review_sections:")
                for index in existing_indexes:
                    print(f"  - {index.indexname}: {index.indexdef}")
                return True
            else:
                print("No GIN index found on review_sections column. Creating...")
                
                # Create GIN index
                await db.execute(text("""
                    CREATE INDEX idx_listings_review_sections_gin 
                    ON listings USING gin (review_sections);
                """))
                await db.commit()
                print("GIN index created successfully!")
                return True
                
        except Exception as e:
            print(f"Error checking/creating GIN index: {e}")
            await db.rollback()
            return False

if __name__ == "__main__":
    asyncio.run(check_and_create_gin_index())