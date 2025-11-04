# Restaurant Data Enhancement Implementation Plan

## Overview
This document outlines the comprehensive implementation plan for adding additional restaurant data fields to the Nomtok application. The new fields will be fetched from Google Places API and stored in the backend, with corresponding frontend updates to display and manage this information.

## New Fields to Add
- `current_opening_hours`: Current opening hours in a structured format
- `secondary_opening_hours`: Secondary/alternative opening hours (if applicable)
- `international_phone_number`: International format phone number
- `opening_hours`: Raw opening hours data from Google Places API
- `price_level`: Price level indicator (0-4 scale)
- `website`: Restaurant website URL

## Implementation Steps

### 1. Backend Model Updates

#### 1.1 Update Restaurant Model (`backend/app/models/restaurant.py`)

```python
from sqlalchemy import (Column, String, Text, Float, Boolean, DateTime, event, inspect, JSON, Integer)

class Restaurant(Base):
    __tablename__ = "restaurants"

    # ... existing fields ...
    
    # New fields
    current_opening_hours = Column(JSON, nullable=True)  # Structured opening hours
    secondary_opening_hours = Column(JSON, nullable=True)  # Alternative hours
    international_phone_number = Column(String(50), nullable=True)  # International phone format
    opening_hours = Column(JSON, nullable=True)  # Raw Google Places opening hours data
    price_level = Column(Integer, nullable=True)  # 0-4 scale from Google Places
    website = Column(String(500), nullable=True)  # Restaurant website URL
```

#### 1.2 Update API Schemas

**Update RestaurantResponse (`backend/app/api_schema/restaurants.py`):**
```python
class RestaurantResponse(BaseModel):
    id: UUID
    name: str
    slug: str
    address: str
    latitude: float
    longitude: float
    city: Optional[str] = None
    country: Optional[str] = None
    google_place_id: Optional[str] = None
    google_rating: Optional[float] = None
    business_status: str
    photo_url: Optional[str] = None
    is_active: Optional[bool] = None
    created_at: datetime
    updated_at: datetime
    tags: Optional[list[TagResponse]] = None
    cuisines: Optional[list[CuisineResponse]] = None
    listings: Optional[List["ListingLightResponse"]] = None
    
    # New fields
    current_opening_hours: Optional[Dict[str, Any]] = None
    secondary_opening_hours: Optional[Dict[str, Any]] = None
    international_phone_number: Optional[str] = None
    opening_hours: Optional[Dict[str, Any]] = None
    price_level: Optional[int] = None
    website: Optional[str] = None
```

**Update RestaurantUpdate (`backend/app/api_schema/admin_restaurants.py`):**
```python
class RestaurantUpdate(BaseModel):
    # ... existing fields ...
    
    # New fields
    current_opening_hours: Optional[Dict[str, Any]] = Field(None, description="Current opening hours structure")
    secondary_opening_hours: Optional[Dict[str, Any]] = Field(None, description="Secondary opening hours structure")
    international_phone_number: Optional[str] = Field(None, description="International format phone number")
    opening_hours: Optional[Dict[str, Any]] = Field(None, description="Raw Google Places opening hours data")
    price_level: Optional[int] = Field(None, description="Price level (0-4 scale)")
    website: Optional[str] = Field(None, description="Restaurant website URL")
```

### 2. Google Places API Integration Updates

#### 2.1 Update Google Places Service (`backend/app/services/google_places_service.py`)

```python
async def fetch_restaurant_details_from_google(restaurant_name: str, city: Optional[str] = None, country: str = "USA") -> dict:
    """Enhanced version to fetch additional restaurant details."""
    logger.info(f"Fetching restaurant details from Google API for: {restaurant_name}, city: {city}, country: {country}")
    
    if not restaurant_name or not restaurant_name.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Restaurant name is required"
        )

    # Build search query
    query_parts = [restaurant_name.strip()]
    if city and city.strip():
        query_parts.append(city.strip())
    if country and country.strip():
        query_parts.append(country.strip())
    
    query = " ".join(query_parts)
    logger.info(f"Google Places search query: {query}")

    loop = asyncio.get_event_loop()
    try:
        # Search for the restaurant using Google Places Text Search
        result = await loop.run_in_executor(
            None, 
            lambda: gmaps.places(query=query)
        )
        
        if result["status"] != "OK" or not result["results"]:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Restaurant '{restaurant_name}' not found in Google Places"
            )
        
        place = result["results"][0]
        place_id = place["place_id"]
        logger.info(f"Found restaurant: {place['name']} ({place_id})")
        
        # Get detailed place information
        details_result = await loop.run_in_executor(
            None,
            lambda: gmaps.place(
                place_id=place_id,
                fields=[
                    'name', 'formatted_address', 'geometry', 'place_id', 'rating', 
                    'business_status', 'photos', 'formatted_phone_number', 
                    'international_phone_number', 'opening_hours', 'price_level', 
                    'website', 'address_components'
                ]
            )
        )
        
        if details_result["status"] != "OK":
            logger.warning(f"Could not fetch detailed information for {place_id}")
            detailed_info = {}
        else:
            detailed_info = details_result.get("result", {})
        
        # Extract photo URL if available
        photo_url = None
        try:
            photos = place.get("photos")
            if photos and len(photos) > 0:
                photo_reference = photos[0]["photo_reference"]
                photo_url = await resolve_google_photo_url(photo_reference)
                logger.info(f"Resolved photo for {place['name']}: {photo_url}")
        except Exception as photo_error:
            logger.warning(f"Could not extract photo for {place['name']}: {photo_error}")
        
        # Extract address components
        address_components = detailed_info.get("address_components", place.get("address_components", []))
        city = None
        country = None
        
        for component in address_components:
            types = component.get("types", [])
            if "locality" in types:
                city = component["long_name"]
            elif "country" in types:
                country = component["long_name"]
        
        # Process opening hours
        opening_hours_data = detailed_info.get("opening_hours")
        current_opening_hours = None
        secondary_opening_hours = None
        
        if opening_hours_data:
            # Extract current opening hours
            current_opening_hours = {
                "open_now": opening_hours_data.get("open_now"),
                "weekday_text": opening_hours_data.get("weekday_text", [])
            }
            
            # Extract secondary hours if available (some places have special hours)
            if "secondary_opening_hours" in opening_hours_data:
                secondary_opening_hours = opening_hours_data["secondary_opening_hours"]
        
        return {
            "name": detailed_info.get("name", place["name"]),
            "address": detailed_info.get("formatted_address", place.get("formatted_address", "")),
            "latitude": detailed_info.get("geometry", place["geometry"])["location"]["lat"],
            "longitude": detailed_info.get("geometry", place["geometry"])["location"]["lng"],
            "city": city,
            "country": country,
            "google_place_id": place_id,
            "google_rating": detailed_info.get("rating", place.get("rating")),
            "business_status": detailed_info.get("business_status", place.get("business_status", BusinessStatus.BUSINESS_STATUS_UNSPECIFIED.value)),
            "photo_url": photo_url,
            
            # New fields
            "international_phone_number": detailed_info.get("international_phone_number"),
            "opening_hours": opening_hours_data,
            "current_opening_hours": current_opening_hours,
            "secondary_opening_hours": secondary_opening_hours,
            "price_level": detailed_info.get("price_level"),
            "website": detailed_info.get("website"),
        }
        
    except ApiError as e:
        logger.error(f"Google Places API error: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Google Places API error: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Unexpected error fetching restaurant details: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching restaurant details: {str(e)}"
        )
```

#### 2.2 Update validate_restaurant Function (`backend/app/services/transcription_nlp.py`)

```python
async def validate_restaurant(entities: dict) -> dict:
    """Enhanced validate_restaurant to fetch additional details."""
    logger.info(f"Validating restaurant using Google Maps: {entities}")
    if not entities.get("restaurant_name") or not entities.get("location"):
        logger.warning("No restaurant name or location found")
        return {"valid": False}

    loop = asyncio.get_event_loop()
    try:
        query = f"{entities['restaurant_name']} {entities['location'].get('city', '')} {entities['location'].get('country', '')}".strip()
        result = await loop.run_in_executor(None, lambda: gmaps.places(query=query))
        
        if result["status"] == "OK" and result["results"]:
            place = result["results"][0]
            place_id = place["place_id"]
            logger.info(f"Validated restaurant with Google Maps: {place['name']} ({place_id})")
            
            # Get detailed place information
            details_result = await loop.run_in_executor(
                None,
                lambda: gmaps.place(
                    place_id=place_id,
                    fields=[
                        'name', 'formatted_address', 'geometry', 'place_id', 'rating', 
                        'business_status', 'photos', 'formatted_phone_number', 
                        'international_phone_number', 'opening_hours', 'price_level', 
                        'website', 'address_components'
                    ]
                )
            )
            
            detailed_info = details_result.get("result", {}) if details_result.get("status") == "OK" else {}
            
            # Extract photo URL from Text Search response
            photo_url = None
            try:
                photos = place.get("photos")
                if photos and len(photos) > 0:
                    photo_reference = photos[0]["photo_reference"]
                    photo_url = f"https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference={photo_reference}&key={GOOGLE_MAPS_API_KEY}"
                    logger.info(f"Found photo for {place['name']}: {photo_url}")
            except Exception as photo_error:
                logger.warning(f"Could not extract photo for {place['name']}: {photo_error}")
            
            # Process opening hours
            opening_hours_data = detailed_info.get("opening_hours")
            current_opening_hours = None
            secondary_opening_hours = None
            
            if opening_hours_data:
                current_opening_hours = {
                    "open_now": opening_hours_data.get("open_now"),
                    "weekday_text": opening_hours_data.get("weekday_text", [])
                }
                if "secondary_opening_hours" in opening_hours_data:
                    secondary_opening_hours = opening_hours_data["secondary_opening_hours"]
            
            return {
                "valid": True,
                "name": place["name"],
                "address": place.get("formatted_address", ""),
                "latitude": place["geometry"]["location"]["lat"],
                "longitude": place["geometry"]["location"]["lng"],
                "city": entities["location"].get("city"),
                "country": entities["location"].get("country"),
                "google_place_id": place_id,
                "google_rating": detailed_info.get("rating", place.get("rating")),
                "business_status": detailed_info.get("business_status", place.get("business_status", BusinessStatus.BUSINESS_STATUS_UNSPECIFIED.value)),
                "photo_url": photo_url,
                "confidence_score": entities.get("confidence_score", 0.8),
                "tags": entities.get("tags", []),
                "cuisines": entities.get("cuisines", []),
                
                # New fields
                "international_phone_number": detailed_info.get("international_phone_number"),
                "opening_hours": opening_hours_data,
                "current_opening_hours": current_opening_hours,
                "secondary_opening_hours": secondary_opening_hours,
                "price_level": detailed_info.get("price_level"),
                "website": detailed_info.get("website"),
            }
        return {"valid": False}
    except ApiError as e:
        logger.error(f"Error validating restaurant with Google Maps: {e}")
        return {"valid": False}
```

### 3. Database Migration

Create a new migration file:

```python
# backend/alembic/versions/add_restaurant_enhanced_fields.py
"""Add enhanced restaurant fields

Revision ID: add_restaurant_enhanced_fields
Revises: [previous_revision_id]
Create Date: [current_date]

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSON

# revision identifiers, used by Alembic.
revision = 'add_restaurant_enhanced_fields'
down_revision = '[previous_revision_id]'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add new columns to restaurants table
    op.add_column('restaurants', sa.Column('current_opening_hours', JSON, nullable=True))
    op.add_column('restaurants', sa.Column('secondary_opening_hours', JSON, nullable=True))
    op.add_column('restaurants', sa.Column('international_phone_number', sa.String(length=50), nullable=True))
    op.add_column('restaurants', sa.Column('opening_hours', JSON, nullable=True))
    op.add_column('restaurants', sa.Column('price_level', sa.Integer(), nullable=True))
    op.add_column('restaurants', sa.Column('website', sa.String(length=500), nullable=True))
    
    # Create indexes for frequently queried fields
    op.create_index('idx_restaurants_phone', 'restaurants', ['international_phone_number'])
    op.create_index('idx_restaurants_price_level', 'restaurants', ['price_level'])
    op.create_index('idx_restaurants_website', 'restaurants', ['website'])


def downgrade() -> None:
    # Drop indexes first
    op.drop_index('idx_restaurants_phone', table_name='restaurants')
    op.drop_index('idx_restaurants_price_level', table_name='restaurants')
    op.drop_index('idx_restaurants_website', table_name='restaurants')
    
    # Drop columns
    op.drop_column('restaurants', 'current_opening_hours')
    op.drop_column('restaurants', 'secondary_opening_hours')
    op.drop_column('restaurants', 'international_phone_number')
    op.drop_column('restaurants', 'opening_hours')
    op.drop_column('restaurants', 'price_level')
    op.drop_column('restaurants', 'website')
```

### 4. Frontend TypeScript Interface Updates

#### 4.1 Update Restaurant Interface (`frontend/lib/types/index.ts`)

```typescript
export interface OpeningHours {
  open_now?: boolean;
  weekday_text?: string[];
  periods?: Array<{
    open: {
      day: number;
      time: string;
    };
    close?: {
      day: number;
      time: string;
    };
  }>;
}

export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  address: string;
  latitude?: number;
  longitude?: number;
  city?: string;
  country?: string;
  google_place_id?: string;
  google_rating?: number;
  business_status: string;
  photo_url?: string;
  tags?: Tag[];
  cuisines?: Cuisine[];
  is_active?: boolean;
  created_at: string;
  updated_at: string;
  videos?: Video[];
  listings?: Listing[];
  
  // New fields
  current_opening_hours?: OpeningHours;
  secondary_opening_hours?: OpeningHours;
  international_phone_number?: string;
  opening_hours?: OpeningHours;
  price_level?: number; // 0-4 scale
  website?: string;
}
```

### 5. Frontend Component Updates

#### 5.1 Update Restaurant Card Component

```typescript
// frontend/components/restaurant-card.tsx
import { Phone, Globe, Clock, DollarSign } from 'lucide-react';

interface RestaurantCardProps {
  restaurant: Restaurant;
}

export function RestaurantCard({ restaurant }: RestaurantCardProps) {
  const getPriceLevelLabel = (level: number): string => {
    switch (level) {
      case 0: return 'Free';
      case 1: return 'Inexpensive';
      case 2: return 'Moderate';
      case 3: return 'Expensive';
      case 4: return 'Very Expensive';
      default: return 'Unknown';
    }
  };

  const getPriceLevelSymbol = (level: number): string => {
    return '$'.repeat(level || 0);
  };

  return (
    <div className="restaurant-card">
      {/* Existing content */}
      
      {/* New fields section */}
      <div className="restaurant-details">
        {restaurant.international_phone_number && (
          <div className="detail-item">
            <Phone className="icon" size={16} />
            <a href={`tel:${restaurant.international_phone_number}`}>
              {restaurant.international_phone_number}
            </a>
          </div>
        )}
        
        {restaurant.website && (
          <div className="detail-item">
            <Globe className="icon" size={16} />
            <a href={restaurant.website} target="_blank" rel="noopener noreferrer">
              Visit Website
            </a>
          </div>
        )}
        
        {restaurant.price_level !== undefined && (
          <div className="detail-item">
            <DollarSign className="icon" size={16} />
            <span title={getPriceLevelLabel(restaurant.price_level)}>
              {getPriceLevelSymbol(restaurant.price_level)}
            </span>
          </div>
        )}
        
        {restaurant.current_opening_hours?.weekday_text && (
          <div className="detail-item">
            <Clock className="icon" size={16} />
            <div className="opening-hours">
              {restaurant.current_opening_hours.open_now !== undefined && (
                <span className={`status ${restaurant.current_opening_hours.open_now ? 'open' : 'closed'}`}>
                  {restaurant.current_opening_hours.open_now ? 'Open Now' : 'Closed Now'}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

#### 5.2 Update Restaurant Form Component

```typescript
// frontend/components/restaurant-form.tsx
import { useState } from 'react';

interface RestaurantFormProps {
  restaurant?: Restaurant;
  onSubmit: (data: Partial<Restaurant>) => void;
}

export function RestaurantForm({ restaurant, onSubmit }: RestaurantFormProps) {
  const [formData, setFormData] = useState({
    // Existing fields
    name: restaurant?.name || '',
    address: restaurant?.address || '',
    city: restaurant?.city || '',
    country: restaurant?.country || '',
    google_rating: restaurant?.google_rating || '',
    business_status: restaurant?.business_status || '',
    is_active: restaurant?.is_active || true,
    
    // New fields
    international_phone_number: restaurant?.international_phone_number || '',
    website: restaurant?.website || '',
    price_level: restaurant?.price_level || '',
    current_opening_hours: restaurant?.current_opening_hours || null,
    secondary_opening_hours: restaurant?.secondary_opening_hours || null,
    opening_hours: restaurant?.opening_hours || null,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="restaurant-form">
      {/* Existing form fields */}
      
      {/* New fields section */}
      <div className="form-section">
        <h3>Contact Information</h3>
        
        <div className="form-group">
          <label htmlFor="international_phone_number">International Phone Number</label>
          <input
            type="tel"
            id="international_phone_number"
            value={formData.international_phone_number}
            onChange={(e) => setFormData({...formData, international_phone_number: e.target.value})}
            placeholder="+1 234-567-8900"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="website">Website</label>
          <input
            type="url"
            id="website"
            value={formData.website}
            onChange={(e) => setFormData({...formData, website: e.target.value})}
            placeholder="https://example.com"
          />
        </div>
      </div>
      
      <div className="form-section">
        <h3>Pricing & Hours</h3>
        
        <div className="form-group">
          <label htmlFor="price_level">Price Level</label>
          <select
            id="price_level"
            value={formData.price_level}
            onChange={(e) => setFormData({...formData, price_level: e.target.value ? parseInt(e.target.value) : null})}
          >
            <option value="">Select Price Level</option>
            <option value="0">Free</option>
            <option value="1">Inexpensive ($)</option>
            <option value="2">Moderate ($$)</option>
            <option value="3">Expensive ($$$)</option>
            <option value="4">Very Expensive ($$$$)</option>
          </select>
        </div>
        
        {/* Opening hours editor component */}
        <OpeningHoursEditor
          currentHours={formData.current_opening_hours}
          secondaryHours={formData.secondary_opening_hours}
          onChange={(current, secondary) => setFormData({
            ...formData, 
            current_opening_hours: current, 
            secondary_opening_hours: secondary
          })}
        />
      </div>
      
      <button type="submit" className="submit-button">
        {restaurant ? 'Update Restaurant' : 'Create Restaurant'}
      </button>
    </form>
  );
}
```

### 6. Dashboard Updates

#### 6.1 Update Restaurant Management Dashboard

```typescript
// frontend/app/admin/restaurants/page.tsx
import { DataTable } from '@/components/ui/data-table';

const restaurantColumns = [
  // Existing columns
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'city', header: 'City' },
  { accessorKey: 'country', header: 'Country' },
  { accessorKey: 'google_rating', header: 'Rating' },
  { accessorKey: 'business_status', header: 'Status' },
  
  // New columns
  { 
    accessorKey: 'international_phone_number', 
    header: 'Phone',
    cell: ({ row }) => {
      const phone = row.getValue('international_phone_number');
      return phone ? (
        <a href={`tel:${phone}`} className="text-blue-600 hover:underline">
          {phone}
        </a>
      ) : '-';
    }
  },
  { 
    accessorKey: 'website', 
    header: 'Website',
    cell: ({ row }) => {
      const website = row.getValue('website');
      return website ? (
        <a href={website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
          Visit
        </a>
      ) : '-';
    }
  },
  { 
    accessorKey: 'price_level', 
    header: 'Price',
    cell: ({ row }) => {
      const level = row.getValue('price_level');
      if (level === null || level === undefined) return '-';
      return '$'.repeat(level);
    }
  },
  { 
    accessorKey: 'current_opening_hours', 
    header: 'Hours',
    cell: ({ row }) => {
      const hours = row.getValue('current_opening_hours');
      if (!hours?.open_now !== undefined) return '-';
      return (
        <span className={`px-2 py-1 rounded text-xs ${hours.open_now ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {hours.open_now ? 'Open' : 'Closed'}
        </span>
      );
    }
  },
];
```

### 7. Testing and Validation

#### 7.1 Backend Testing

```python
# backend/tests/test_restaurant_enhanced_fields.py
import pytest
from app.models.restaurant import Restaurant
from app.services.google_places_service import fetch_restaurant_details_from_google

@pytest.mark.asyncio
async def test_fetch_enhanced_restaurant_details():
    """Test fetching enhanced restaurant details from Google Places API."""
    result = await fetch_restaurant_details_from_google(
        "McDonald's", "New York", "USA"
    )
    
    assert result["name"] is not None
    assert result["international_phone_number"] is not None
    assert result["opening_hours"] is not None
    assert result["price_level"] is not None
    assert result["website"] is not None
    assert result["current_opening_hours"] is not None

@pytest.mark.asyncio
async def test_restaurant_model_enhanced_fields():
    """Test restaurant model with enhanced fields."""
    restaurant = Restaurant(
        name="Test Restaurant",
        address="123 Test St",
        latitude=40.7128,
        longitude=-74.0060,
        international_phone_number="+1 234-567-8900",
        website="https://testrestaurant.com",
        price_level=2,
        current_opening_hours={
            "open_now": True,
            "weekday_text": ["Monday: 9:00 AM – 5:00 PM", "Tuesday: 9:00 AM – 5:00 PM"]
        }
    )
    
    assert restaurant.international_phone_number == "+1 234-567-8900"
    assert restaurant.website == "https://testrestaurant.com"
    assert restaurant.price_level == 2
    assert restaurant.current_opening_hours["open_now"] == True
```

#### 7.2 Frontend Testing

```typescript
// frontend/__tests__/restaurant-card.test.tsx
import { render, screen } from '@testing-library/react';
import { RestaurantCard } from '@/components/restaurant-card';

const mockRestaurant = {
  id: '1',
  name: 'Test Restaurant',
  slug: 'test-restaurant',
  address: '123 Test St',
  business_status: 'OPERATIONAL',
  international_phone_number: '+1 234-567-8900',
  website: 'https://testrestaurant.com',
  price_level: 2,
  current_opening_hours: {
    open_now: true,
    weekday_text: ['Monday: 9:00 AM – 5:00 PM']
  }
};

describe('RestaurantCard', () => {
  it('renders enhanced restaurant information', () => {
    render(<RestaurantCard restaurant={mockRestaurant} />);
    
    expect(screen.getByText('+1 234-567-8900')).toBeInTheDocument();
    expect(screen.getByText('Visit Website')).toHaveAttribute('href', 'https://testrestaurant.com');
    expect(screen.getByText('$$')).toBeInTheDocument();
    expect(screen.getByText('Open Now')).toBeInTheDocument();
  });
});
```

### 8. Deployment Checklist

#### 8.1 Pre-deployment
- [ ] Create database backup
- [ ] Run migration tests locally
- [ ] Test Google Places API integration with new fields
- [ ] Verify frontend components render correctly
- [ ] Check API response formats
- [ ] Validate form submissions

#### 8.2 Deployment Steps
1. **Backend Deployment:**
   ```bash
   # Run database migration
   dce backend alembic upgrade head
   
   # Restart backend container
   dcr backend
   ```

2. **Frontend Deployment:**
   ```bash
   # Build and deploy frontend
   cd frontend
   pnpm build
   # Deploy to hosting service
   ```

#### 8.3 Post-deployment Verification
- [ ] Check database schema changes
- [ ] Verify API endpoints return new fields
- [ ] Test restaurant creation with new fields
- [ ] Validate frontend displays new information
- [ ] Monitor error logs for any issues

### 9. Error Handling and Edge Cases

#### 9.1 Google Places API Error Handling
```python
try:
    # Google Places API call
    details_result = await loop.run_in_executor(None, lambda: gmaps.place(place_id=place_id, fields=[...]))
except ApiError as e:
    logger.error(f"Google Places API error for place_id {place_id}: {e}")
    # Return partial data instead of failing completely
    return {
        # ... existing fields ...
        "international_phone_number": None,
        "opening_hours": None,
        "current_opening_hours": None,
        "secondary_opening_hours": None,
        "price_level": None,
        "website": None,
        "api_error": str(e)
    }
```

#### 9.2 Data Validation
```python
def validate_price_level(price_level: int) -> bool:
    """Validate price level is within valid range."""
    return price_level is None or (isinstance(price_level, int) and 0 <= price_level <= 4)

def validate_phone_number(phone: str) -> bool:
    """Validate international phone number format."""
    if not phone:
        return True
    # Basic international phone validation
    import re
    pattern = r'^\+?[1-9]\d{1,14}$'
    return bool(re.match(pattern, phone.replace(' ', '').replace('-', '')))

def validate_website_url(url: str) -> bool:
    """Validate website URL format."""
    if not url:
        return True
    from urllib.parse import urlparse
    try:
        result = urlparse(url)
        return all([result.scheme, result.netloc])
    except Exception:
        return False
```

### 10. Performance Considerations

#### 10.1 Database Indexing
```sql
-- Create indexes for new fields
CREATE INDEX idx_restaurants_phone ON restaurants(international_phone_number) WHERE international_phone_number IS NOT NULL;
CREATE INDEX idx_restaurants_price_level ON restaurants(price_level) WHERE price_level IS NOT NULL;
CREATE INDEX idx_restaurants_website ON restaurants(website) WHERE website IS NOT NULL;
CREATE INDEX idx_restaurants_gin_opening_hours ON restaurants USING GIN(current_opening_hours);
```

#### 10.2 API Response Optimization
```python
# Use selectinload for relationships to avoid N+1 queries
from sqlalchemy.orm import selectinload

async def get_restaurant_with_enhanced_fields(db: AsyncSession, restaurant_id: UUID) -> Restaurant:
    result = await db.execute(
        select(Restaurant)
        .options(
            selectinload(Restaurant.restaurant_tags).selectinload(RestaurantTag.tag),
            selectinload(Restaurant.restaurant_cuisines).selectinload(RestaurantCuisine.cuisine),
            selectinload(Restaurant.listings)
        )
        .filter(Restaurant.id == restaurant_id)
    )
    return result.scalar_one_or_none()
```

This comprehensive implementation plan covers all aspects of adding the enhanced restaurant data fields to the Nomtok application, ensuring a smooth integration with proper