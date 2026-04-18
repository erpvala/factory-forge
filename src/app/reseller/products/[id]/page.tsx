// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Package, 
  DollarSign, 
  Users, 
  TrendingUp,
  Calendar,
  Eye,
  Heart,
  Share2,
  ShoppingCart,
  Star,
  Truck,
  Shield,
  Award,
  Target,
  BarChart3,
  ArrowLeft,
  Edit,
  Trash2,
  Download,
  Copy,
  CheckCircle
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ResellerProductDetailPage() {
  const router = useRouter();
  const [productId, setProductId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  const [product, setProduct] = useState({
    id: '1',
    name: 'Factory Forge Premium Suite',
    description: 'Complete business management solution with advanced analytics, CRM, and automation tools. Perfect for growing businesses looking to scale operations efficiently.',
    category: 'Business Software',
    price: 24900,
    salePrice: 19900,
    currency: 'USD',
    sku: 'FF-PS-2024-001',
    brand: 'Factory Forge',
    status: 'active',
    featured: true,
    inventory: {
      available: 150,
      reserved: 25,
      sold: 325,
      total: 500
    },
    images: [
      '/api/placeholder/600/400',
      '/api/placeholder/600/400',
      '/api/placeholder/600/400'
    ],
    specifications: {
      version: '3.2.1',
      platform: 'Web, iOS, Android',
      users: 'Up to 100',
      storage: 'Unlimited',
      support: '24/7 Premium',
      updates: 'Lifetime',
      languages: 15
    },
    features: [
      'Advanced Analytics Dashboard',
      'CRM with Lead Management',
      'Inventory Tracking System',
      'Financial Reporting Tools',
      'Employee Management',
      'Project Collaboration',
      'Email Marketing Integration',
      'E-commerce Platform',
      'Mobile App Access',
      'API Integration',
      'Custom Workflows',
      'Multi-language Support'
    ],
    ratings: {
      average: 4.8,
      total: 156,
      distribution: {
        5: 98,
        4: 42,
        3: 12,
        2: 3,
        1: 1
      }
    },
    sales: {
      totalRevenue: 812500,
      unitsSold: 325,
      monthlySales: 45,
      avgOrderValue: 2500,
      conversionRate: 4.2,
      refundRate: 1.2
    },
    commission: {
      rate: 20,
      totalEarned: 162500,
      monthlyEarned: 9000,
      nextPayout: 4500
    },
    seo: {
      title: 'Factory Forge Premium Suite - Complete Business Management Software',
      description: 'Transform your business with Factory Forge Premium Suite. Advanced CRM, analytics, and automation tools in one powerful platform.',
      keywords: ['business software', 'CRM', 'analytics', 'automation', 'management'],
      slug: 'factory-forge-premium-suite'
    },
    createdAt: '2024-01-15',
    updatedAt: '2024-01-20'
  });

  const [reviews, setReviews] = useState([
    {
      id: '1',
      customer: 'John Smith',
      rating: 5,
      title: 'Excellent Business Solution',
      content: 'This software has transformed how we manage our business. The analytics are incredible and the CRM features are exactly what we needed.',
      date: '2024-01-18',
      verified: true,
      helpful: 24
    },
    {
      id: '2',
      customer: 'Sarah Johnson',
      rating: 4,
      title: 'Great Features, Easy to Use',
      content: 'Very comprehensive software with all the features we need. The interface is intuitive and the customer support is responsive.',
      date: '2024-01-15',
      verified: true,
      helpful: 18
    },
    {
      id: '3',
      customer: 'Michael Chen',
      rating: 5,
      title: 'Worth Every Penny',
      content: 'Invested in this software 3 months ago and already seeing significant ROI. The automation features alone have saved us hours of work.',
      date: '2024-01-12',
      verified: true,
      helpful: 31
    }
  ]);

  useEffect(() => {
    // Extract product ID from URL
    const pathParts = window.location.pathname.split('/');
    const id = pathParts[pathParts.length - 1];
    setProductId(id);
    
    // Simulate loading product data
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  const inventoryPercentage = (product.inventory.available / product.inventory.total) * 100;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={() => router.push('/control-panel/reseller-dashboard')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
                <p className="text-gray-600">Product ID: {productId || product.id}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge className={getStatusColor(product.status)}>
                {product.status}
              </Badge>
              {product.featured && (
                <Badge className="bg-yellow-100 text-yellow-800">
                  <Award className="h-3 w-3 mr-1" />
                  Featured
                </Badge>
              )}
              <Button variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Edit Product
              </Button>
            </div>
          </div>
        </div>

        {/* Product Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Product Images */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-6">
                <div className="aspect-w-16 aspect-h-9 bg-gray-200 rounded-lg mb-4">
                  <div className="h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                    <Package className="h-16 w-16 text-gray-400" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 bg-gray-200 rounded flex items-center justify-center">
                      <Package className="h-8 w-8 text-gray-400" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Product Details */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl">{product.name}</CardTitle>
                    <CardDescription className="text-lg mt-2">{product.description}</CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-green-600">
                      ${(product.salePrice / 100).toFixed(2)}
                    </div>
                    <div className="text-lg text-gray-500 line-through">
                      ${(product.price / 100).toFixed(2)}
                    </div>
                    <div className="text-sm text-green-600">
                      Save ${((product.price - product.salePrice) / 100).toFixed(2)}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <div className="text-sm font-medium text-gray-600">SKU</div>
                    <div className="font-semibold">{product.sku}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-600">Brand</div>
                    <div className="font-semibold">{product.brand}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-600">Category</div>
                    <div className="font-semibold">{product.category}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-600">Commission Rate</div>
                    <div className="font-semibold text-green-600">{product.commission.rate}%</div>
                  </div>
                </div>

                {/* Inventory Status */}
                <div className="mb-6">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium">Inventory Status</span>
                    <span>{product.inventory.available} available</span>
                  </div>
                  <Progress value={inventoryPercentage} className="h-2" />
                  <div className="flex justify-between text-xs text-gray-600 mt-1">
                    <span>{product.inventory.sold} sold</span>
                    <span>{product.inventory.reserved} reserved</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-4">
                  <Button className="flex-1">
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Sell Product
                  </Button>
                  <Button variant="outline">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                  <Button variant="outline">
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Link
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Product Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${(product.sales.totalRevenue / 100).toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                {product.sales.unitsSold} units sold
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Commission Earned</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${(product.commission.totalEarned / 100).toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                ${(product.commission.monthlyEarned / 100).toFixed(2)} this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{product.sales.conversionRate}%</div>
              <p className="text-xs text-muted-foreground">
                {product.sales.refundRate}% refund rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Customer Rating</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <div className="text-2xl font-bold mr-2">{product.ratings.average}</div>
                <div className="flex">
                  {renderStars(product.ratings.average)}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {product.ratings.total} reviews
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Features and Specifications */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Key Features
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3">
                {product.features.map((feature, index) => (
                  <div key={index} className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-3 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Specifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(product.specifications).map(([key, value]) => (
                  <div key={key}>
                    <div className="text-sm font-medium text-gray-600 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </div>
                    <div className="font-semibold">{value}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Customer Reviews */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Customer Reviews
            </CardTitle>
            <CardDescription>
              {product.ratings.total} reviews with {product.ratings.average} average rating
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Rating Distribution */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {Object.entries(product.ratings.distribution).reverse().map(([stars, count]) => (
                  <div key={stars} className="flex items-center space-x-2">
                    <div className="flex items-center">
                      <span className="text-sm w-4">{stars}</span>
                      <Star className="h-3 w-3 text-yellow-400 fill-current" />
                    </div>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-yellow-400 h-2 rounded-full" 
                        style={{ width: `${(count / product.ratings.total) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 w-8">{count}</span>
                  </div>
                ))}
              </div>

              {/* Reviews List */}
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-gray-500" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{review.customer}</span>
                            {review.verified && (
                              <Badge className="bg-green-100 text-green-800 text-xs">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Verified
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <div className="flex">
                              {renderStars(review.rating)}
                            </div>
                            <span>•</span>
                            <span>{review.date}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <h3 className="font-semibold mb-2">{review.title}</h3>
                    <p className="text-gray-600 mb-3">{review.content}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <button className="flex items-center hover:text-gray-700">
                          <Eye className="h-4 w-4 mr-1" />
                          Helpful ({review.helpful})
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
