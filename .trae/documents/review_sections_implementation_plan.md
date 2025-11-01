# Review Sections Implementation Plan

## Overview

This document outlines the comprehensive plan to update the code to handle the new GPT response format containing `review_sections` instead of simple arrays of quotes. The implementation will maintain backward compatibility while adding support for the enhanced data structure.

## Current State Analysis

### GPT Response Format (Current)

The current GPT response in `gpt_food_place_processor.py` includes:

* `quotes`: Array of strings containing verbatim quotes

* `confidence_score`: Float value

* `restaurant_name`, `location`, `tags`, `cuisines`: Basic metadata

### GPT Response Format (New)

The new format includes `review_sections` with sub-sections:

```json
{
  "review_sections": {
    "history_context": "string or null",
    "overview": "string or null", 
    "what_they_ate": ["string", "string", ...],
    "verbatim_quotes": ["string", "... (3-6 direct quotes from transcript only)"],
    "nomtok_reflection": "string"
  },
  // ... other fields remain the same
}
```

## Implementation Plan

### 1. Database Schema Updates

#### 1.1 Update Listing Model

**File:** `backend/app/models/listing.py`

**Changes:**

* Add new column `review_sections` as JSONB type

* Keep existing `quotes` column for backward compatibility

* Add migration to update database schema

```python
# Add to Listing model
review_sections = Column(JSONB, nullable=True)  # New review sections data
# Keep existing quotes column for backward compatibility
quotes = Column(ARRAY(Text))  # Existing quotes field
```

#### 1.2 Create Migration

**File:** `backend/migrations/versions/XXXX_add_review_sections_to_listing.py`

```python
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

def upgrade():
    op.add_column('listings', sa.Column('review_sections', JSONB, nullable=True))
    # Create index on JSONB column for performance
    op.create_index('ix_listings_review_sections', 'listings', ['review_sections'], postgresql_using='gin')

def downgrade():
    op.drop_index('ix_listings_review_sections', table_name='listings')
    op.drop_column('listings', 'review_sections')
```

### 2. GPTFoodPlaceProcessor Updates

#### 2.1 Update Response Parsing Logic

**File:** `backend/app/scripts/gpt_food_place_processor.py`

**Current Issues:**

* Line 83-89: Missing comma in JSON schema example

* Response parsing doesn't handle `review_sections`

**Changes:**

```python
# Fix JSON schema (add missing comma)
"review_sections": {
    "history_context": "string or null",
    "overview": "string or null",
    "what_they_ate": ["string", "string", ... , "string"],  # Add comma here
    "verbatim_quotes": ["string", "... (3-6 direct quotes from transcript only)"],
    "nomtok_reflection": "string"
}

# Update process_chunk method to handle review_sections
def process_chunk(self, description: str, chunk: str, index: int, total_chunks: int) -> list:
    # ... existing code ...
    
    try:
        parsed = json.loads(content)
        
        # Handle both old and new formats
        processed_entities = []
        
        if isinstance(parsed, list):
            for entity in parsed:
                processed_entity = self._process_entity(entity)
                if processed_entity:
                    processed_entities.append(processed_entity)
        elif isinstance(parsed, dict):
            processed_entity = self._process_entity(parsed)
            if processed_entity:
                processed_entities.append(processed_entity)
        
        return processed_entities
        
    except json.JSONDecodeError as je:
        logger.error(f"JSON decode failed for chunk {index+1}: {je} | Content: {content}")
        return []

def _process_entity(self, entity: dict) -> dict:
    """Process individual entity with backward compatibility."""
    if not entity or entity.get("restaurant_name") is None:
        return None
    
    # Handle review_sections if present
    if "review_sections" in entity:
        review_sections = entity["review_sections"]
        
        # Extract quotes from verbatim_quotes for backward compatibility
        verbatim_quotes = review_sections.get("verbatim_quotes", [])
        if isinstance(verbatim_quotes, list):
            entity["quotes"] = verbatim_quotes
        else:
            entity["quotes"] = []
            
        # Store full review_sections
        entity["review_sections"] = review_sections
    else:
        # Old format - ensure quotes field exists
        entity["quotes"] = entity.get("quotes", [])
        entity["review_sections"] = None
    
    return entity
```

### 3. Transcription NLP Service Updates

#### 3.1 Update Entity Processing

**File:** `backend/app/services/transcription_nlp.py`

**Update** **`store_restaurant_and_listing`** **function:**

```python
async def store_restaurant_and_listing(
    db: AsyncSession,
    video: Video,
    restaurant_data: dict,
    tags: list,
    cuisines: list,
    entities: list,
    confidence_score: float,
    review_sections: dict = None  # Add this parameter
) -> Listing:
    """Store restaurant and listing with review_sections support."""
    
    # ... existing restaurant and tag storage code ...
    
    # Process entities to extract quotes and review_sections
    all_quotes = []
    all_review_sections = []
    
    for entity in entities:
        # Extract quotes for backward compatibility
        if "quotes" in entity and isinstance(entity["quotes"], list):
            all_quotes.extend(entity["quotes"])
        
        # Extract review_sections
        if "review_sections" in entity and entity["review_sections"]:
            all_review_sections.append(entity["review_sections"])
    
    # Create or update listing
    listing_data = {
        "restaurant_id": restaurant.id,
        "video_id": video.id,
        "influencer_id": video.influencer_id,
        "visit_date": video.published_at.date() if video.published_at else None,
        "quotes": all_quotes if all_quotes else None,
        "confidence_score": confidence_score,
        "review_sections": all_review_sections[0] if all_review_sections else None  # Store first review_sections
    }
    
    # Check for existing listing
    result = await db.execute(
        select(Listing).filter(
            Listing.video_id == video.id,
            Listing.restaurant_id == restaurant.id,
            Listing.influencer_id == video.influencer_id
        )
    )
    existing_listing = result.scalars().first()
    
    if existing_listing:
        # Update existing listing
        for key, value in listing_data.items():
            setattr(existing_listing, key, value)
        listing = existing_listing
    else:
        # Create new listing
        listing = Listing(**listing_data)
        db.add(listing)
    
    await db.flush()
    await db.refresh(listing)
    
    return listing
```

**Update** **`process_video`** **function:**

```python
async def process_video(
    db: AsyncSession,
    video: Video,
    gpt_processor: GPTFoodPlaceProcessor
) -> bool:
    """Process video with review_sections support."""
    
    try:
        # ... existing audio download and transcription code ...
        
        # Extract entities with review_sections
        entities = await gpt_processor.extract_entities(video.description or "", transcription)
        
        if not entities:
            logger.warning(f"No entities extracted for video {video.id}")
            return False
        
        # Process each entity
        for entity in entities:
            # Validate restaurant
            validation_result = await validate_restaurant(entity)
            if not validation_result["valid"]:
                continue
            
            # Extract review_sections if available
            review_sections = entity.get("review_sections")
            
            # Store restaurant and listing with review_sections
            await store_restaurant_and_listing(
                db=db,
                video=video,
                restaurant_data=validation_result["details"],
                tags=entity.get("tags", []),
                cuisines=entity.get("cuisines", []),
                entities=[entity],  # Pass the specific entity
                confidence_score=entity.get("confidence_score", 0.0),
                review_sections=review_sections  # Pass review_sections
            )
        
        return True
        
    except Exception as e:
        logger.error(f"Error processing video {video.id}: {e}")
        return False
```

### 4. API Schema Updates

#### 4.1 Update Pydantic Models

**File:** `backend/app/api_schema/listings.py`

```python
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class ReviewSections(BaseModel):
    """Review sections data structure."""
    history_context: Optional[str] = None
    overview: Optional[str] = None
    what_they_ate: Optional[List[str]] = Field(default_factory=list)
    verbatim_quotes: Optional[List[str]] = Field(default_factory=list)
    nomtok_reflection: Optional[str] = None

class ListingResponse(BaseModel):
    id: UUID
    restaurant: RestaurantResponse | UUID
    video: Optional[VideoResponse | UUID] = None
    influencer: Optional[InfluencerResponse | UUID] = None
    visit_date: Optional[date] = None
    quotes: Optional[List[str]] = None  # Keep for backward compatibility
    review_sections: Optional[ReviewSections] = None  # New field
    confidence_score: Optional[float] = None
    approved: Optional[bool] = None
    timestamp: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ListingCreate(BaseModel):
    restaurant_id: UUID
    video_id: UUID
    influencer_id: UUID
    visit_date: Optional[date] = None
    quotes: Optional[List[str]] = None  # Keep for backward compatibility
    review_sections: Optional[ReviewSections] = None  # New field
    confidence_score: Optional[float] = None
    approved: Optional[bool] = False
    timestamp: Optional[int] = None

class ListingUpdate(BaseModel):
    restaurant_id: Optional[UUID] = None
    video_id: Optional[UUID] = None
    influencer_id: Optional[UUID] = None
    visit_date: Optional[date] = None
    quotes: Optional[List[str]] = None  # Keep for backward compatibility
    review_sections: Optional[ReviewSections] = None  # New field
    confidence_score: Optional[float] = None
    approved: Optional[bool] = None
    timestamp: Optional[int] = None
```

### 5. Frontend Updates

#### 5.1 Update Type Definitions

**File:** `frontend/lib/types/listing.ts`

```typescript
export interface ReviewSections {
  history_context?: string | null;
  overview?: string | null;
  what_they_ate?: string[];
  verbatim_quotes?: string[];
  nomtok_reflection?: string | null;
}

export interface Listing {
  id: string;
  restaurant: Restaurant | string;
  video?: Video | string;
  influencer?: Influencer | string;
  visit_date?: string | null;
  quotes?: string[] | null;  // Keep for backward compatibility
  review_sections?: ReviewSections | null;  // New field
  confidence_score?: number | null;
  approved?: boolean | null;
  timestamp?: number | null;
  created_at: string;
  updated_at: string;
}
```

#### 5.2 Update Listing Components

**File:** `frontend/app/dashboard/listings/_components/listing-card.tsx`

```typescript
interface ListingCardProps {
  listing: Listing;
  onEdit: (listing: Listing) => void;
  onDelete: (id: string) => void;
}

export function ListingCard({ listing, onEdit, onDelete }: ListingCardProps) {
  return (
    <div className="border rounded-lg p-4 shadow-sm">
      {/* ... existing header content ... */}
      
      {/* Review Sections */}
      {listing.review_sections && (
        <div className="mt-4 space-y-3">
          {listing.review_sections.history_context && (
            <div>
              <h4 className="font-semibold text-sm text-gray-700">History Context</h4>
              <p className="text-sm text-gray-600">{listing.review_sections.history_context}</p>
            </div>
          )}
          
          {listing.review_sections.overview && (
            <div>
              <h4 className="font-semibold text-sm text-gray-700">Overview</h4>
              <p className="text-sm text-gray-600">{listing.review_sections.overview}</p>
            </div>
          )}
          
          {listing.review_sections.what_they_ate && listing.review_sections.what_they_ate.length > 0 && (
            <div>
              <h4 className="font-semibold text-sm text-gray-700">What They Ate</h4>
              <ul className="text-sm text-gray-600 list-disc list-inside">
                {listing.review_sections.what_they_ate.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          )}
          
          {listing.review_sections.verbatim_quotes && listing.review_sections.verbatim_quotes.length > 0 && (
            <div>
              <h4 className="font-semibold text-sm text-gray-700">Quotes</h4>
              <div className="space-y-1">
                {listing.review_sections.verbatim_quotes.map((quote, index) => (
                  <blockquote key={index} className="text-sm text-gray-600 italic border-l-2 border-gray-300 pl-2">
                    "{quote}"
                  </blockquote>
                ))}
              </div>
            </div>
          )}
          
          {listing.review_sections.nomtok_reflection && (
            <div>
              <h4 className="font-semibold text-sm text-gray-700">Nomtok Reflection</h4>
              <p className="text-sm text-gray-600 italic">{listing.review_sections.nomtok_reflection}</p>
            </div>
          )}
        </div>
      )}
      
      {/* Fallback to old quotes format */}
      {!listing.review_sections && listing.quotes && listing.quotes.length > 0 && (
        <div className="mt-4">
          <h4 className="font-semibold text-sm text-gray-700">Quotes</h4>
          <div className="space-y-1">
            {listing.quotes.map((quote, index) => (
              <blockquote key={index} className="text-sm text-gray-600 italic border-l-2 border-gray-300 pl-2">
                "{quote}"
              </blockquote>
            ))}
          </div>
        </div>
      )}
      
      {/* ... existing footer content ... */}
    </div>
  );
}
```

#### 5.3 Update Listing Form

**File:** `frontend/app/dashboard/listings/_components/listing-form.tsx`

```typescript
interface ListingFormData {
  restaurant_id: string;
  video_id: string;
  influencer_id: string;
  visit_date?: string;
  quotes?: string[];  // Keep for backward compatibility
  review_sections?: ReviewSections;  // New field
  confidence_score?: number;
  approved?: boolean;
  timestamp?: number;
}

export function ListingForm({ listing, onSave, onCancel }: ListingFormProps) {
  const [formData, setFormData] = useState<ListingFormData>({
    restaurant_id: listing?.restaurant_id || '',
    video_id: listing?.video_id || '',
    influencer_id: listing?.influencer_id || '',
    visit_date: listing?.visit_date || '',
    quotes: listing?.quotes || [],
    review_sections: listing?.review_sections || {
      history_context: null,
      overview: null,
      what_they_ate: [],
      verbatim_quotes: [],
      nomtok_reflection: null
    },
    confidence_score: listing?.confidence_score || 0,
    approved: listing?.approved || false,
    timestamp: listing?.timestamp || 0
  });
  
  // Add form fields for review_sections
  const updateReviewSection = (section: keyof ReviewSections, value: any) => {
    setFormData(prev => ({
      ...prev,
      review_sections: {
        ...prev.review_sections,
        [section]: value
      }
    }));
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* ... existing form fields ... */}
      
      {/* Review Sections */}
      <div className="space-y-4 border-t pt-4">
        <h3 className="text-lg font-semibold">Review Sections</h3>
        
        <div>
          <label className="block text-sm font-medium mb-1">History Context</label>
          <textarea
            value={formData.review_sections?.history_context || ''}
            onChange={(e) => updateReviewSection('history_context', e.target.value || null)}
            className="w-full p-2 border rounded-md"
            rows={3}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Overview</label>
          <textarea
            value={formData.review_sections?.overview || ''}
            onChange={(e) => updateReviewSection('overview', e.target.value || null)}
            className="w-full p-2 border rounded-md"
            rows={3}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">What They Ate</label>
          <textarea
            value={formData.review_sections?.what_they_ate?.join('\n') || ''}
            onChange={(e) => updateReviewSection('what_they_ate', e.target.value.split('\n').filter(Boolean))}
            className="w-full p-2 border rounded-md"
            rows={3}
            placeholder="One item per line"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Verbatim Quotes</label>
          <textarea
            value={formData.review_sections?.verbatim_quotes?.join('\n') || ''}
            onChange={(e) => updateReviewSection('verbatim_quotes', e.target.value.split('\n').filter(Boolean))}
            className="w-full p-2 border rounded-md"
            rows={3}
            placeholder="One quote per line"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Nomtok Reflection</label>
          <textarea
            value={formData.review_sections?.nomtok_reflection || ''}
            onChange={(e) => updateReviewSection('nomtok_reflection', e.target.value || null)}
            className="w-full p-2 border rounded-md"
            rows={3}
          />
        </div>
      </div>
      
      {/* ... existing form buttons ... */}
    </form>
  );
}
```

### 6. Data Migration Strategy

#### 6.1 Create Migration Script

**File:** `backend/scripts/migrate_review_sections.py`

```python
import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import AsyncSessionLocal
from app.models import Listing

async def migrate_existing_quotes_to_review_sections():
    """Migrate existing quotes to review_sections format."""
    
    async with AsyncSessionLocal() as db:
        # Get all listings with quotes but no review_sections
        result = await db.execute(
            select(Listing).filter(
                Listing.quotes != None,
                Listing.review_sections == None
            )
        )
        listings = result.scalars().all()
        
        for listing in listings:
            if listing.quotes:
                # Convert old quotes format to review_sections
                review_sections = {
                    "history_context": None,
                    "overview": None,
                    "what_they_ate": [],
                    "verbatim_quotes": listing.quotes,
                    "nomtok_reflection": None
                }
                listing.review_sections = review_sections
                db.add(listing)
        
        await db.commit()
        print(f"Migrated {len(listings)} listings to review_sections format")

if __name__ == "__main__":
    asyncio.run(migrate_existing_quotes_to_review_sections())
```

### 7. Backward Compatibility Considerations

#### 7.1 API Compatibility

* Keep existing `quotes` field in all API responses

* Populate `quotes` from `review_sections.verbatim_quotes` when `review_sections` is present

* Allow clients to gradually migrate to the new format

#### 7.2 Database Compatibility

* Keep existing `quotes` column

* Populate both `quotes` and `review_sections` during data processing

* Create database views or computed columns if needed for reporting

#### 7.3 Frontend Compatibility

* Display both old and new formats

* Show fallback to `quotes` when `review_sections` is not available

* Provide clear UI indicators for the new enhanced format

### 8. Testing Strategy

#### 8.1 Unit Tests

* Test GPT response parsing with both old and new formats

* Test database schema migrations

* Test API serialization/deserialization

#### 8.2 Integration Tests

* Test end-to-end video processing with new format

* Test backward compatibility with existing data

* Test frontend display of both formats

#### 8.3 Performance Tests

* Test JSONB query performance with large datasets

* Test migration script performance

* Test concurrent processing with new format

### 9. Deployment Steps

1. **Database Migration**: Run Alembic migration to add `review_sections` column
2. **Code Deployment**: Deploy updated backend and frontend code
3. **Data Migration**: Run migration script to convert existing quotes
4. **Monitoring**: Monitor for errors and performance issues
5. **Gradual Rollout**: Enable new format processing gradually if needed

### 10. Rollback Plan

If issues arise:

1. **Immediate**: Disable new format processing in GPT calls
2. **Short-term**: Revert to previous code version
3. **Data**: Keep `quotes` column populated for rollback capability
4. **Communication**: Notify users of temporary reversion

## Summary

This implementation plan provides a comprehensive approach to updating the GPT response format handling while maintaining full backward compatibility. The key aspects are:

1. **Database**: Add JSONB column for flexible review\_sections storage
2. **Backend**: Update parsing logic to handle both formats
3. **API**: Extend schemas to include new review\_sections field
4. **Frontend**: Update components to display enhanced review data
5. **Migration**: Provide smooth transition path for existing data
6. **Compatibility**: Ensure existing functionality continues

