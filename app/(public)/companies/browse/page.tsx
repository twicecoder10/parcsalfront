'use client';

import { useState, useEffect } from 'react';
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

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async (resetOffset = true) => {
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
        setCompanies([...companies, ...companiesData]);
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
  };

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
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-4xl font-bold mb-2">Browse Companies</h1>
            <p className="text-gray-600">Discover verified shipping companies on our platform</p>
          </div>

          {/* Search Bar */}
          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleSearch} className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search companies by name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Searching...
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

          {/* Companies Grid */}
          {loading && companies.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
              <span className="ml-3 text-gray-600">Loading companies...</span>
            </div>
          ) : error && companies.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <p className="text-gray-700 mb-2">{error}</p>
                <Button onClick={() => fetchCompanies(true)} variant="outline">
                  Try Again
                </Button>
              </CardContent>
            </Card>
          ) : companies.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-700 mb-2">No companies found</p>
                <p className="text-sm text-gray-500">
                  {searchQuery ? 'Try adjusting your search terms' : 'Check back later for new companies'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {companies.map((company) => (
                  <Card key={company.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start gap-4">
                        {company.logoUrl && (
                          <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border">
                            <Image
                              src={company.logoUrl}
                              alt={`${company.name} logo`}
                              fill
                              className="object-cover"
                              sizes="64px"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <CardTitle className="text-lg font-semibold truncate">
                              {company.name}
                            </CardTitle>
                            {company.isVerified && (
                              <Badge variant="outline" className="flex items-center gap-1 flex-shrink-0">
                                <CheckCircle2 className="h-3 w-3 text-green-600" />
                                Verified
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                            <MapPin className="h-4 w-4" />
                            <span className="truncate">
                              {company.city}, {company.country}
                            </span>
                          </div>
                          {company.rating !== null && company.rating !== undefined && (
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                <span className="text-sm font-medium">{company.rating.toFixed(1)}</span>
                              </div>
                              <span className="text-xs text-gray-500">
                                ({company.reviewCount} {company.reviewCount === 1 ? 'review' : 'reviews'})
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {company.description && (
                        <CardDescription className="mb-4 line-clamp-2">
                          {company.description}
                        </CardDescription>
                      )}
                      <div className="flex items-center justify-between">
                        {company.website && (
                          <a
                            href={company.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-gray-600 hover:text-orange-600 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Globe className="h-4 w-4" />
                            Website
                          </a>
                        )}
                        <Link href={`/companies/${company.slug || company.id}`}>
                          <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
                            View Profile
                            <ArrowRight className="ml-1 h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Load More Button */}
              {pagination.hasMore && (
                <div className="text-center pt-6">
                  <Button
                    variant="outline"
                    onClick={loadMore}
                    disabled={loading}
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
      </main>
      <Footer />
    </div>
  );
}

