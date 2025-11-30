"use client";

import React, { useEffect, useState, useRef } from "react";
import { Restaurant } from "@/lib/types";
import { MapPin, Star } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface RestaurantMapProps {
  restaurants: (Restaurant | null)[];
  selectedRestaurant?: (Restaurant | null);
  onRestaurantSelect?: (restaurant: (Restaurant | null)) => void;
  className?: string;
  showRestaurantCount?: boolean;
}

const RestaurantMapClient: React.FC<RestaurantMapProps> = ({
  restaurants,
  selectedRestaurant,
  onRestaurantSelect,
  className = "w-full h-96",
  showRestaurantCount = true,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const mapRef = useRef<L.Map | null>(null);
  const [mapComponents, setMapComponents] = useState<{
    MapContainer: typeof import("react-leaflet").MapContainer;
    TileLayer: typeof import("react-leaflet").TileLayer;
    Marker: typeof import("react-leaflet").Marker;
    Popup: typeof import("react-leaflet").Popup;
    createCustomIcon: (isHighlighted?: boolean) => L.DivIcon;
    MapBounds: React.FC<{ restaurants: (Restaurant | null)[]; initialFitOnly: boolean }>;
  } | null>(null);

  useEffect(() => {
    const loadLeaflet = async () => {
      if (typeof window !== "undefined") {
        try {
          // Import Leaflet CSS
          await import("leaflet/dist/leaflet.css");

          // Import Leaflet and react-leaflet components
          const leaflet = await import("leaflet");
          const reactLeaflet = await import("react-leaflet");

          const L: typeof import("leaflet") = leaflet.default;

          // Fix for default markers
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          delete (L.Icon.Default.prototype as any)._getIconUrl;
          L.Icon.Default.mergeOptions({
            iconRetinaUrl:
              "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
            iconUrl:
              "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
            shadowUrl:
              "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
          });

          // Custom restaurant marker icon
          const createCustomIcon = (isHighlighted = false) => {
            return L.divIcon({
              html: `
                <div class="relative">
                  <div class="w-8 h-8 bg-gradient-to-br ${
                    isHighlighted
                      ? "from-orange-500 to-red-600"
                      : "from-orange-400 to-red-500"
                  } rounded-full border-3 border-white shadow-lg flex items-center justify-center transform ${
                isHighlighted ? "scale-125" : "hover:scale-110"
              } transition-transform duration-200">
                    <svg class="w-4 h-4 text-cream" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
                    </svg>
                  </div>
                  <div class="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-black/20 rounded-full blur-sm"></div>
                </div>
              `,
              className: "custom-restaurant-marker",
              iconSize: [32, 32],
              iconAnchor: [16, 32],
              popupAnchor: [0, -32],
            });
          };

          // Component to fit map bounds to restaurants
          const MapBoundsComponent = ({
            restaurants,
            initialFitOnly = false,
          }: {
            restaurants: (Restaurant | null)[];
            initialFitOnly?: boolean;
          }) => {
            const map = reactLeaflet.useMap();
            const [hasInitialFit, setHasInitialFit] = React.useState(false);
            const initialRestaurantsRef = React.useRef<(Restaurant | null)[]>([]);
            const lastRestaurantCountRef = React.useRef<number>(0);

            React.useEffect(() => {
              const currentRestaurantCount = restaurants.length;
              const hasCountChanged = lastRestaurantCountRef.current !== currentRestaurantCount;
              
              // Update the count reference
              lastRestaurantCountRef.current = currentRestaurantCount;
              
              // Fit bounds if:
              // 1. Not in initialFitOnly mode, OR
              // 2. Haven't done initial fit yet, OR
              // 3. Restaurant count has changed (list length changed)
              const shouldFitBounds = !initialFitOnly || !hasInitialFit || hasCountChanged;
              
              if (!shouldFitBounds) {
                return;
              }

              if (restaurants.length > 0) {
                const validRestaurants = restaurants.filter(
                  (r) => r?.latitude && r?.longitude
                );
                if (validRestaurants.length > 0) {
                  const bounds = L.latLngBounds(
                    validRestaurants.map((r) => [r?.latitude ?? 0, r?.longitude ?? 0])
                  );
                  map.fitBounds(bounds, { padding: [20, 20] });
                  
                  if (initialFitOnly && !hasInitialFit) {
                    setHasInitialFit(true);
                    initialRestaurantsRef.current = [...restaurants];
                  }
                }
              }
            }, [
              restaurants, 
              map, 
              initialFitOnly, 
              hasInitialFit
            ]);

            return null;
          };

          setMapComponents({
            MapContainer: reactLeaflet.MapContainer,
            TileLayer: reactLeaflet.TileLayer,
            Marker: reactLeaflet.Marker,
            Popup: reactLeaflet.Popup,
            createCustomIcon,
            MapBounds: MapBoundsComponent,
          });

          setIsLoaded(true);
        } catch (error) {
          console.error("Failed to load Leaflet:", error);
        }
      }
    };

    loadLeaflet();
  }, []);

  // Filter restaurants that have coordinates
  const mappableRestaurants = restaurants.filter(
    (r) => r?.latitude && r?.longitude
  );

  // Default center (Kuala Lumpur based on the data)
  const defaultCenter: [number, number] = [3.139, 101.6869];

  if (!isLoaded || !mapComponents) {
    return (
      <div
        className={cn(
          "bg-gradient-to-br from-slate-100 to-gray-200 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center",
          className
        )}
      >
        <div className="text-center p-8">
          <div className="w-12 h-12 border-4 border-slate-300 border-t-slate-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading map...</p>
        </div>
      </div>
    );
  }

  if (mappableRestaurants.length === 0) {
    return (
      <div
        className={cn(
          "bg-gradient-to-br from-slate-100 to-gray-200 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center",
          className
        )}
      >
        <div className="text-center p-8">
          <MapPin className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">
            No restaurant locations available
          </p>
          <p className="text-slate-500 text-sm mt-2">
            Restaurant coordinates are needed to display on map
          </p>
        </div>
      </div>
    );
  }

  const {
    MapContainer,
    TileLayer,
    Marker,
    Popup,
    createCustomIcon,
    MapBounds,
  } = mapComponents;

  return (
    <div
      className={cn(
        "relative rounded-xl overflow-hidden shadow-xl border border-slate-200",
        className
      )}
    >
      {/* Map Header */}
      <div className="absolute top-4 left-4 right-4 z-[1000] pointer-events-none">
        <div className="flex items-center justify-between">
          {showRestaurantCount ? (
            <div className="flex items-center gap-2 bg-white backdrop-blur-md rounded-lg px-4 py-2 shadow-lg">
              <div className="w-3 h-3 bg-gradient-to-br from-orange-400 to-red-500 rounded-full"></div>
              <span className="text-sm font-semibold text-slate-700">
                {mappableRestaurants.length} Restaurant
                {mappableRestaurants.length !== 1 ? "s" : ""}
              </span>
            </div>
          ) : <div />}
          <div className="text-xs bg-white backdrop-blur-md rounded-lg px-4 py-2 shadow-lg">
            Click markers for details
          </div>
        </div>
      </div>

      <MapContainer
        center={defaultCenter}
        zoom={13}
        className="w-full h-full min-h-[400px]"
        ref={mapRef}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />

        <MapBounds restaurants={mappableRestaurants} initialFitOnly={true} />

        {mappableRestaurants.map((restaurant) => {
          const isSelected = selectedRestaurant?.slug === restaurant?.slug;

          return (
            <Marker
              key={restaurant?.slug}
              position={[restaurant?.latitude ?? 0, restaurant?.longitude ?? 0]}
              icon={createCustomIcon(isSelected)}
              eventHandlers={{
                click: () => {
                  onRestaurantSelect?.(restaurant);
                },
              }}
            >
              <Popup
                className="custom-popup"
                maxWidth={200}
                closeButton={false}
              >
                <div className="p-0">
                  <div
                    className="flex items-start gap-3 cursor-pointer hover:bg-gray-50 transition-colors duration-200 p-2 rounded-lg"
                    onClick={() => {
                      if (restaurant?.google_place_id) {
                        window.open(
                          `https://www.google.com/maps/place/?q=place_id:${restaurant.google_place_id}`,
                          "_blank",
                          "noopener,noreferrer"
                        );
                      }
                    }}
                  >
                    <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-red-500 rounded-lg flex-shrink-0 flex items-center justify-center">
                      {restaurant?.photo_url ? (
                        <Image
                          width={100}
                          height={100}
                          src={
                            restaurant?.photo_url || "/default-restaurant.jpg"
                          }
                          alt="Restaurant icon"
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                      ) : (
                        <span className="w-12 h-12 bg-slate-200 rounded-lg flex items-center justify-center">
                          {restaurant?.name?.charAt(0) || '?'}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-900 text-sm mb-1 truncate">
                        {restaurant?.name}
                      </h3>
                      <div className="flex items-center text-slate-600 mb-2">
                        <MapPin className="w-3 h-3 mr-1" />
                        <span className="text-xs truncate">
                          {restaurant?.city}
                        </span>
                      </div>
                      {restaurant?.google_rating && (
                        <div className="flex items-center mb-2">
                          <Star className="w-3 h-3 text-yellow-500 fill-current mr-1" />
                          <span className="text-xs font-medium">
                            {restaurant?.google_rating}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Custom zoom controls */}
      <div className="absolute bottom-4 right-4 z-[1000] flex flex-col gap-1">
        <button
          onClick={() => mapRef.current?.zoomIn()}
          className="w-10 h-10 bg-cream/90 backdrop-blur-md rounded-lg shadow-lg border border-white/20 flex items-center justify-center hover:bg-cream transition-colors"
        >
          <span className="text-slate-700 font-bold text-lg">+</span>
        </button>
        <button
          onClick={() => mapRef.current?.zoomOut()}
          className="w-10 h-10 bg-cream/90 backdrop-blur-md rounded-lg shadow-lg border border-white/20 flex items-center justify-center hover:bg-cream transition-colors"
        >
          <span className="text-slate-700 font-bold text-lg">-</span>
        </button>
      </div>
    </div>
  );
};

export default RestaurantMapClient;
