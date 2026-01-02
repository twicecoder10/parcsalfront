'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { publicApi } from '@/lib/api';
import { Search, Building2, MapPin, Globe, CheckCircle2, Star, Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import Image from 'next/image';

interface Company {
  id: string;
  name: string;
  slug: string;
  description?: string;
  country: string;
  city: string;
  website?: string;
  logoUrl?: string;
  isVerified: boolean;
  rating?: number | null;
  reviewCount: number;
}

export default function BrowseCompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState({
    limit: 12,
    offset: 0,
    total: 0,
    hasMore: false,
  });

  const fetchCompanies = useCallback(async (resetOffset = true) => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {
        limit: pagination.limit,
        offset: resetOffset ? 0 : pagination.offset + pagination.limit,
      };

      if (searchQuery) {
        params.search = searchQuery;
      }

      const response = await publicApi.listCompanies(params);
      
      // Handle response structure
      const companiesData = response.data || response || [];
      
      if (resetOffset) {
        setCompanies(companiesData);
      } else {
        setCompanies((prevCompanies) => [...prevCompanies, ...companiesData]);
      }

      if (response.pagination) {
        setPagination({
          ...response.pagination,
          offset: resetOffset ? 0 : pagination.offset + pagination.limit,
        });
      }
    } catch (err) {
      console.error('Failed to fetch companies:', err);
      setError(err instanceof Error ? err.message : 'Failed to load companies');
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, pagination.limit, pagination.offset]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCompanies(true);
  };

  const loadMore = () => {
    fetchCompanies(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      {/* Add padding-top to account for fixed navbar (h-16 md:h-20) */}
      <main className="flex-1 pt-16 md:pt-20">
        {/* Sticky Header Section */}
        <div className="sticky top-16 md:top-20 z-40 border-b bg-white shadow-sm">
          <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
            <div className="max-w-7xl mx-auto space-y-4 sm:space-y-5">
              {/* Header */}
              <div className="space-y-1 sm:space-y-2">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">Browse Companies</h1>
                <p className="text-sm sm:text-base text-gray-600">Discover verified shipping companies on our platform</p>
              </div>

              {/* Search Bar */}
              <Card className="shadow-sm">
                <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6 pb-4 sm:pb-6">
                  <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                      <Input
                        type="text"
                        placeholder="Search companies by name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 sm:pl-10 h-10 sm:h-11 text-sm sm:text-base"
                      />
                    </div>
                    <Button type="submit" disabled={loading} className="w-full sm:w-auto h-10 sm:h-11">
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          <span className="hidden sm:inline">Searching...</span>
                          <span className="sm:hidden">Loading...</span>
                        </>
                      ) : (
                        <>
                          <Search className="mr-2 h-4 w-4" />
                          Search
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="container mx-auto px-4 sm:px-6 py-6">
          <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
              {/* Companies Grid */}
          {loading && companies.length === 0 ? (
            <div className="flex items-center justify-center py-12 sm:py-16">
              <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-orange-600" />
              <span className="ml-3 text-sm sm:text-base text-gray-600">Loading companies...</span>
            </div>
          ) : error && companies.length === 0 ? (
            <Card className="shadow-sm">
              <CardContent className="text-center py-8 sm:py-12 px-4">
                <AlertCircle className="h-10 w-10 sm:h-12 sm:w-12 text-red-500 mx-auto mb-3 sm:mb-4" />
                <p className="text-sm sm:text-base text-gray-700 mb-3 sm:mb-4">{error}</p>
                <Button onClick={() => fetchCompanies(true)} variant="outline" className="w-full sm:w-auto">
                  Try Again
                </Button>
              </CardContent>
            </Card>
          ) : companies.length === 0 ? (
            <Card className="shadow-sm">
              <CardContent className="text-center py-8 sm:py-12 px-4">
                <Building2 className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                <p className="text-sm sm:text-base text-gray-700 mb-2">No companies found</p>
                <p className="text-xs sm:text-sm text-gray-500">
                  {searchQuery ? 'Try adjusting your search terms' : 'Check back later for new companies'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
                {companies.map((company) => (
                  <Card key={company.id} className="hover:shadow-lg transition-shadow flex flex-col">
                    <CardHeader className="pb-3 sm:pb-4 px-4 sm:px-6 pt-4 sm:pt-6">
                      <div className="flex items-start gap-3 sm:gap-4">
                        {company.logoUrl && (
                          <div className="relative w-12 h-12 sm:w-16 sm:h-16 rounded-lg overflow-hidden flex-shrink-0 border">
                            <Image
                              src={company.logoUrl}
                              alt={`${company.name} logo`}
                              fill
                              className="object-cover"
                              sizes="(max-width: 640px) 48px, 64px"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1.5 sm:mb-2">
                            <CardTitle className="text-base sm:text-lg font-semibold truncate">
                              {company.name}
                            </CardTitle>
                            {company.isVerified && (
                              <Badge variant="outline" className="flex items-center gap-1 flex-shrink-0 text-xs px-1.5 sm:px-2">
                                <CheckCircle2 className="h-3 w-3 text-green-600" />
                                <span className="hidden sm:inline">Verified</span>
                                <span className="sm:hidden">✓</span>
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-600 mb-1.5 sm:mb-2">
                            <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                            <span className="truncate">
                              {company.city}, {company.country}
                            </span>
                          </div>
                          {company.rating !== null && company.rating !== undefined && (
                            <div className="flex items-center gap-1.5 sm:gap-2">
                              <div className="flex items-center gap-1">
                                <Star className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-yellow-400 text-yellow-400" />
                                <span className="text-xs sm:text-sm font-medium">{company.rating.toFixed(1)}</span>
                              </div>
                              <span className="text-[10px] sm:text-xs text-gray-500">
                                ({company.reviewCount} {company.reviewCount === 1 ? 'review' : 'reviews'})
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col px-4 sm:px-6 pb-4 sm:pb-6">
                      {company.description && (
                        <CardDescription className="mb-3 sm:mb-4 line-clamp-2 text-xs sm:text-sm">
                          {company.description}
                        </CardDescription>
                      )}
                      <div className="mt-auto flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-0">
                        {company.website && (
                          <a
                            href={company.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-600 hover:text-orange-600 transition-colors py-1.5 sm:py-0 order-2 sm:order-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Globe className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            <span>Website</span>
                          </a>
                        )}
                        <Link href={`/companies/${company.slug || company.id}`} className="w-full sm:w-auto order-1 sm:order-2">
                          <Button size="sm" className="bg-orange-600 hover:bg-orange-700 w-full sm:w-auto h-9 text-sm">
                            View Profile
                            <ArrowRight className="ml-1 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Load More Button */}
              {pagination.hasMore && (
                <div className="text-center pt-4 sm:pt-6">
                  <Button
                    variant="outline"
                    onClick={loadMore}
                    disabled={loading}
                    className="w-full sm:w-auto h-10 sm:h-11"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      'Load More Companies'
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

