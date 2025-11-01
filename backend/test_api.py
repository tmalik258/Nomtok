import asyncio
import httpx
from app.database import get_async_db
from sqlalchemy import text

async def test_api_and_database():
    # Test database for listings with review_sections
    async for db in get_async_db():
        result = await db.execute(text("""
            SELECT COUNT(*) as count 
            FROM listings 
            WHERE review_sections IS NOT NULL;
        """))
        count = result.scalar()
        print(f"Listings with review_sections: {count}")
        
        if count > 0:
            # Get one listing with review_sections
            result = await db.execute(text("""
                SELECT id, review_sections 
                FROM listings 
                WHERE review_sections IS NOT NULL 
                LIMIT 1;
            """))
            listing = result.fetchone()
            if listing:
                print(f"Sample listing ID: {listing.id}")
                print(f"Review sections: {listing.review_sections}")
    
    # Test API endpoint
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get("http://localhost:8030/listings?limit=1")
            print(f"API Response status: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print(f"API returned {len(data.get('listings', []))} listings")
                if data.get('listings'):
                    listing = data['listings'][0]
                    print(f"First listing has review_sections: {'review_sections' in listing and listing['review_sections'] is not None}")
            else:
                print(f"API Error: {response.text}")
    except Exception as e:
        print(f"API Test Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_api_and_database())