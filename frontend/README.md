# Nomtok Frontend

A modern Next.js application for discovering restaurants through food influencer recommendations. This frontend connects to a FastAPI backend to display restaurant listings, influencer profiles, and their video reviews.

## Features

### 🏠 Homepage
- **City Search**: Search for restaurants by city name
- **Featured Cities**: Quick access to popular food destinations
- **Clean, Modern UI**: Responsive design with Tailwind CSS

### 🍽️ Restaurant Pages
- **Restaurant Listings**: Browse restaurants by city with filtering
- **Restaurant Details**: Comprehensive restaurant information including:
  - Address and location details
  - Google Maps integration
  - Google ratings and business status
  - Influencer reviews and quotes
  - Video recommendations

### 👥 Influencer Pages
- **Influencer Directory**: Browse all food influencers
- **Search & Filter**: Find influencers by name or region
- **Influencer Profiles**: Detailed profiles featuring:
  - Bio and social media links
  - YouTube channel integration
  - Restaurant review history
  - Video content with quotes and context

### 🎥 Video Integration
- **YouTube Links**: Direct links to influencer videos
- **Review Context**: Contextual information about restaurant visits
- **Confidence Scoring**: AI-generated confidence scores for recommendations

## Technology Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **HTTP Client**: Axios
- **UI Components**: Headless UI

## Project Structure

```
frontend/
├── app/
│   ├── globals.css              # Global styles and Tailwind config
│   ├── layout.tsx               # Root layout component
│   ├── page.tsx                 # Homepage
│   ├── restaurants/
│   │   ├── page.tsx             # Restaurant listings
│   │   └── [id]/
│   │       └── page.tsx         # Individual restaurant details
│   └── influencers/
│       ├── page.tsx             # Influencer directory
│       └── [id]/
│           └── page.tsx         # Individual influencer profiles
├── lib/
│   └── api.ts                   # API service functions
├── types/
│   └── index.ts                 # TypeScript type definitions
├── public/                      # Static assets
├── next.config.ts               # Next.js configuration
├── tailwind.config.ts           # Tailwind CSS configuration
└── package.json                 # Dependencies and scripts
```

## API Integration

The frontend communicates with a FastAPI backend running on `http://localhost:8000`. The API integration includes:

### Restaurant API
- `GET /restaurants` - List restaurants with optional city filtering
- `GET /restaurants/{id}` - Get individual restaurant details

### Influencer API
- `GET /influencers` - List all influencers
- `GET /influencers/{id}` - Get individual influencer details

### Listing API
- `GET /listings` - Get restaurant-influencer-video relationships
- Supports filtering by restaurant, influencer, and approval status

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Backend API running on `http://localhost:8000`

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the development server**:
   ```bash
   npm run dev
   ```

3. **Open your browser**:
   Navigate to `http://localhost:3000`

### Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Configuration

### Next.js Configuration
The `next.config.ts` file includes:
- Image domain configuration for external images
- API proxy setup to route `/api/*` requests to the backend

## Features in Detail

### Responsive Design
- Mobile-first approach
- Breakpoints: mobile (default), tablet (md), desktop (lg)
- Touch-friendly interface elements

### Accessibility
- Semantic HTML structure
- ARIA labels and roles
- Keyboard navigation support
- Focus management

### Performance Optimizations
- Next.js Image optimization
- Code splitting with dynamic imports
- Efficient API caching
- Lazy loading of components

### User Experience
- Loading states for all async operations
- Error handling with user-friendly messages
- Smooth transitions and animations
- Intuitive navigation patterns

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Deployment

### Production Build
```bash
npm run build
npm run start
```

### Docker Deployment
The application is configured to work with the provided Docker setup:
```bash
docker-compose up frontend
```

## Troubleshooting

### Common Issues

1. **API Connection Issues**
   - Ensure backend is running on `http://localhost:8000`
   - Check CORS configuration in backend
   - Verify API endpoints are accessible

2. **Build Errors**
   - Clear `.next` directory: `rm -rf .next`
   - Reinstall dependencies: `rm -rf node_modules && npm install`
   - Check TypeScript errors: `npm run lint`

3. **Styling Issues**
   - Ensure Tailwind CSS is properly configured
   - Check for conflicting CSS rules
   - Verify responsive breakpoints

## Caching Strategy

- Server-side caching uses Redis (if available) with an in-memory TTL fallback.
- Responses include `ETag` and `Cache-Control` headers for conditional requests.
- Client-side caching leverages a localStorage/sessionStorage cache with ETag revalidation via Axios.
- Admin mutations clear client caches via an interceptor to avoid stale UI.
- Cache metrics are available at `/api/cache/metrics` in development, aggregated by namespaces.
- To inspect metrics on the frontend, use the `useCacheMetrics` hook (`lib/hooks/useCacheMetrics.ts`).
- Recommended TTLs: list endpoints `300s` (`stale-while-revalidate=60`), details `3600s`.
