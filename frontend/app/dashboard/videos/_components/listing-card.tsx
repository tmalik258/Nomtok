"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Listing } from "@/lib/types";
import { ListingForm } from "@/app/dashboard/listings/_components/listing-form";
import { useListingCard } from "@/lib/hooks/useListingCard";
import { DeleteConfirmationModal } from "@/components/delete-confirmation-modal";
import {
  FileText,
  Calendar,
  TrendingUp,
  Quote,
  Building2,
  MapPin,
  Star,
  User,
  Users,
  Clock,
  Hash,
  Edit,
  X,
  Trash2,
  CheckCircle,
  AlertCircle,
  Copy,
} from "lucide-react";
import { copyToClipboard } from "@/lib/utils/copy-to-clipboard";

interface ListingCardProps {
  listing: Listing;
  onDeleted?: () => void;
  onUpdate?: () => void;
}

export function ListingCard({ listing, onDeleted, onUpdate }: ListingCardProps) {
  const {
    isEditMode,
    toggleEditMode,
    handleListingIdClick,
    handleEditSuccess,
    formatTimestamp,
    isDeleteOpen,
    isDeleting,
    openDeleteDialog,
    closeDeleteDialog,
    handleDeleteConfirm,
  } = useListingCard({ listing, onDeleted });

  if (isEditMode) {
    return (
      <Card className="bg-white shadow-sm border border-gray-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Edit className="h-5 w-5 text-blue-600" />
              Edit Listing
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleEditMode}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ListingForm
            mode="edit"
            listingData={listing}
            onSuccess={() => {
              handleEditSuccess();
              onUpdate?.();
            }}
            onDeleted={onDeleted}
            className="p-2"
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white shadow-sm border border-gray-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5 text-blue-600" />
            Listing Details
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleEditMode}
              className="flex items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={openDeleteDialog}
              className="flex items-center gap-2 text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Listing ID and Basic Information */}
        <div className="flex justify-between">
          <div className="flex items-center gap-2">
            <Hash className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium">Listing ID:</span>
            <button
              onClick={handleListingIdClick}
              className="text-sm text-blue-600 hover:text-blue-800 hover:underline cursor-pointer font-mono truncate w-44"
            >
              {listing.id}
            </button>
            <Copy
              className="h-4 w-4 text-gray-500 cursor-pointer hover:text-gray-700"
              onClick={() => {
                copyToClipboard(listing.id);
              }}
            />
          </div>
          {listing.approved ? (
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-600">
                Approved
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium text-red-600">
                Pending Approval
              </span>
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {listing.timestamp !== null && listing.timestamp !== undefined && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">Video Timestamp:</span>
              <Badge variant="outline" className="font-mono">
                {formatTimestamp(Number(listing.timestamp || 0))}
              </Badge>
            </div>
          )}

          {listing.visit_date && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">Visit Date:</span>
              <span className="text-sm text-gray-600">
                {new Date(listing.visit_date).toLocaleDateString()}
              </span>
            </div>
          )}

          {listing.confidence_score && (
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">Confidence:</span>
              <Badge
                variant={
                  listing?.confidence_score >= 0.8 ? "default" : "secondary"
                }
              >
                {Math.round(listing.confidence_score * 100)}%
              </Badge>
            </div>
          )}
        </div>

        {/* Review Sections */}
        {listing.review_sections && (
          <div className="space-y-4">
            {/* History Context */}
            {listing.review_sections.history_context && (
              <div>
                <h4 className="flex items-center gap-2 text-sm font-medium mb-2 text-blue-600">
                  <Quote className="h-4 w-4 text-blue-600" />
                  Background
                </h4>
                <div className="bg-blue-50 p-3 rounded-md border-l-4 border-blue-200">
                  <p className="text-sm text-blue-800">{listing.review_sections.history_context}</p>
                </div>
              </div>
            )}
            
            {/* Overview */}
            {listing.review_sections.overview && (
              <div>
                <h4 className="flex items-center gap-2 text-sm font-medium mb-2 text-green-600">
                  <Quote className="h-4 w-4 text-green-600" />
                  Overview
                </h4>
                <div className="bg-green-50 p-3 rounded-md border-l-4 border-green-200">
                  <p className="text-sm text-green-800">{listing.review_sections.overview}</p>
                </div>
              </div>
            )}
            
            {/* What They Ate */}
            {listing.review_sections.what_they_ate && listing.review_sections.what_they_ate.length > 0 && (
              <div>
                <h4 className="flex items-center gap-2 text-sm font-medium mb-2 text-purple-600">
                  <Quote className="h-4 w-4 text-purple-600" />
                  What They Ate
                </h4>
                <div className="bg-purple-50 p-3 rounded-md border-l-4 border-purple-200">
                  <ul className="text-sm text-purple-800 space-y-1">
                    {listing.review_sections.what_they_ate.map((item, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
            
            {/* Verbatim Quotes */}
            {listing.review_sections.verbatim_quotes && listing.review_sections.verbatim_quotes.length > 0 && (
              <div>
                <h4 className="flex items-center gap-2 text-sm font-medium mb-2 text-gray-600">
                  <Quote className="h-4 w-4 text-gray-600" />
                  Quotes
                </h4>
                <div className="space-y-2">
                  {listing.review_sections.verbatim_quotes.map((quote, index) => (
                    <div
                      key={index}
                      className="bg-gray-50 p-3 rounded-md border-l-4 border-gray-200"
                    >
                      <p className="text-sm text-gray-700 italic">
                        &quot;{quote}&quot;
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Nomtok Reflection */}
              {listing.review_sections.nomtok_reflection && (
                <div>
                  <h4 className="flex items-center gap-2 text-sm font-medium mb-2 text-orange-600">
                    <Quote className="h-4 w-4 text-orange-600" />
                    Our Reflection
                  </h4>
                  <div className="bg-orange-50 p-3 rounded-md border-l-4 border-orange-200">
                    <p className="text-sm text-orange-800">{listing.review_sections.nomtok_reflection}</p>
                  </div>
                </div>
              )}
          </div>
        )}
        

        {/* Restaurant Information */}
        {listing.restaurant && (
          <div>
            <h4 className="flex items-center gap-2 text-sm font-medium mb-3">
              <Building2 className="h-4 w-4 text-orange-600" />
              Restaurant Details
            </h4>
            <Card className="bg-orange-50 border-orange-200">
              <CardContent className="pt-4">
                <div className="space-y-3">
                  <div>
                    <div className="flex flex-col gap-1">
                      <div className="flex gap-2 items-center">
                        <h5 className="font-semibold text-orange-900">
                          {listing.restaurant.name}
                        </h5>
                        <Copy
                          className="h-3 w-3 text-orange-500 cursor-pointer hover:text-orange-700"
                          onClick={() => {
                            copyToClipboard(
                              listing.restaurant?.name || "",
                              "Restaurant name copied to clipboard!"
                            );
                          }}
                        />
                      </div>
                      <div className="flex gap-2 items-center">
                        <span className="text-xs text-orange-700 truncate w-44">
                          {listing.restaurant?.id ||
                            listing.restaurant_id ||
                            ""}
                        </span>
                        <Copy
                          className="h-3 w-3 text-orange-500 cursor-pointer hover:text-orange-700"
                          onClick={() => {
                            copyToClipboard(
                              listing.restaurant?.id ||
                                listing.restaurant_id ||
                                "",
                              "Restaurant ID copied to clipboard!"
                            );
                          }}
                        />
                      </div>
                    </div>
                    {listing.restaurant.address && (
                      <div className="flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3 text-orange-600" />
                        <span className="text-xs text-orange-700">
                          {listing.restaurant.address}
                          {listing.restaurant.city &&
                            `, ${listing.restaurant.city}`}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    {listing.restaurant.google_rating && (
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-500 fill-current" />
                        <span className="text-xs font-medium">
                          {listing.restaurant.google_rating}
                        </span>
                      </div>
                    )}

                    {listing.restaurant.cuisines &&
                      listing.restaurant.cuisines.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {listing.restaurant.cuisines
                            .slice(0, 3)
                            .map((cuisine) => (
                              <Badge
                                key={cuisine.id}
                                variant="outline"
                                className="text-xs"
                              >
                                {cuisine.name}
                              </Badge>
                            ))}
                          {listing.restaurant.cuisines.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{listing.restaurant.cuisines.length - 3} more
                            </Badge>
                          )}
                        </div>
                      )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Influencer Information */}
        {listing.influencer && (
          <div>
            <h4 className="flex items-center gap-2 text-sm font-medium mb-3">
              <User className="h-4 w-4 text-purple-600" />
              Influencer Details
            </h4>
            <Card className="bg-purple-50 border-purple-200">
              <CardContent className="pt-4">
                <div className="space-y-3">
                  <div className="flex flex-col gap-1">
                    <div className="flex gap-2 items-center">
                      <h5 className="font-semibold text-purple-900">
                        {listing.influencer.name}
                      </h5>
                      <Copy
                        className="h-3 w-3 text-purple-500 cursor-pointer hover:text-purple-700"
                        onClick={() => {
                          copyToClipboard(
                            listing.influencer?.id ||
                              listing.influencer_id ||
                              "",
                            "Influencer ID copied to clipboard!"
                          );
                        }}
                      />
                    </div>
                    <div className="flex gap-2 items-center">
                      <span className="text-xs text-purple-700 truncate w-44">
                        {listing.influencer?.id || listing.influencer_id || ""}
                      </span>
                      <Copy
                        className="h-3 w-3 text-purple-500 cursor-pointer hover:text-purple-700"
                        onClick={() => {
                          copyToClipboard(
                            listing.influencer?.id ||
                              listing.influencer_id ||
                              "",
                            "Influencer ID copied to clipboard!"
                          );
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {listing.influencer.subscriber_count && (
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3 text-purple-600" />
                        <span className="text-xs font-medium">
                          {listing.influencer.subscriber_count.toLocaleString()}{" "}
                          subscribers
                        </span>
                      </div>
                    )}

                    {listing.influencer.total_videos && (
                      <Badge variant="outline" className="text-xs">
                        {listing.influencer.total_videos.toLocaleString()}{" "}
                        videos
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>

      <DeleteConfirmationModal
        isOpen={isDeleteOpen}
        onClose={closeDeleteDialog}
        onConfirm={handleDeleteConfirm}
        title="Delete Listing"
        description="Are you sure you want to delete this listing? This action cannot be undone."
        isLoading={isDeleting}
      />
    </Card>
  );
}

