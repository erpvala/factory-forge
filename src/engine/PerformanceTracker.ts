// @ts-nocheck
/**
 * PERFORMANCE TRACKER - EXECUTION ONLY
 * daily KPIs → track → optimize → dominate
 */

import { supabase } from '@/lib/supabase';

export class PerformanceTracker {
  private static instance: PerformanceTracker;
  private isRunning = false;
  private performanceMetrics = {
    dailyRevenue: 0,
    dailyUsers: 0,
    dailyConversions: 0,
    dailyProfit: 0,
    dailyCAC: 0,
    dailyLTV: 0,
    dailyROI: 0,
    growthRate: 0
  };

  static getInstance(): PerformanceTracker {
    if (!PerformanceTracker.instance) {
      PerformanceTracker.instance = new PerformanceTracker();
    }
    return PerformanceTracker.instance;
  }

  async startPerformanceTracker(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;

    console.log('🚀 PERFORMANCE TRACKER - STARTED');
    
    // Execute every hour
    setInterval(() => {
      this.trackPerformance();
    }, 60 * 60 * 1000);

    // Execute immediately on start
    this.trackPerformance();
  }

  private async trackPerformance(): Promise<void> {
    try {
      console.log('⚡ TRACKING PERFORMANCE KPIs');
      
      // 1. Track daily revenue
      const revenue = await this.trackDailyRevenue();
      this.performanceMetrics.dailyRevenue = revenue;
      
      // 2. Track daily users
      const users = await this.trackDailyUsers();
      this.performanceMetrics.dailyUsers = users;
      
      // 3. Track daily conversions
      const conversions = await this.trackDailyConversions();
      this.performanceMetrics.dailyConversions = conversions;
      
      // 4. Track daily profit
      const profit = await this.trackDailyProfit();
      this.performanceMetrics.dailyProfit = profit;
      
      // 5. Track daily CAC
      const cac = await this.trackDailyCAC();
      this.performanceMetrics.dailyCAC = cac;
      
      // 6. Track daily LTV
      const ltv = await this.trackDailyLTV();
      this.performanceMetrics.dailyLTV = ltv;
      
      // 7. Track daily ROI
      const roi = await this.trackDailyROI();
      this.performanceMetrics.dailyROI = roi;
      
      // 8. Track growth rate
      const growthRate = await this.trackGrowthRate();
      this.performanceMetrics.growthRate = growthRate;
      
      // 9. Store performance metrics
      await this.storePerformanceMetrics();
      
      // 10. Alert on KPI thresholds
      await this.alertOnThresholds();
      
      console.log('📊 PERFORMANCE TRACKING COMPLETE:', {
        dailyRevenue: this.performanceMetrics.dailyRevenue / 100,
        dailyUsers: this.performanceMetrics.dailyUsers,
        dailyConversions: this.performanceMetrics.dailyConversions,
        dailyProfit: this.performanceMetrics.dailyProfit / 100,
        dailyCAC: this.performanceMetrics.dailyCAC / 100,
        dailyLTV: this.performanceMetrics.dailyLTV / 100,
        dailyROI: this.performanceMetrics.dailyROI.toFixed(2) + '%',
        growthRate: this.performanceMetrics.growthRate.toFixed(2) + '%'
      });
      
    } catch (error) {
      console.error('❌ PERFORMANCE TRACKER ERROR:', error);
    }
  }

  private async trackDailyRevenue(): Promise<number> {
    const today = new Date().toISOString().split('T')[0];
    
    const { data: payments } = await supabase
      .from('payments')
      .select('amount')
      .eq('status', 'completed')
      .eq('date', today);
    
    if (!payments) return 0;
    
    return payments.reduce((sum, payment) => sum + payment.amount, 0);
  }

  private async trackDailyUsers(): Promise<number> {
    const today = new Date().toISOString().split('T')[0];
    
    const { data: users } = await supabase
      .from('users')
      .select('id')
      .eq('created_at', today);
    
    return users ? users.length : 0;
  }

  private async trackDailyConversions(): Promise<number> {
    const today = new Date().toISOString().split('T')[0];
    
    const { data: conversions } = await supabase
      .from('conversions')
      .select('id')
      .eq('date', today);
    
    return conversions ? conversions.length : 0;
  }

  private async trackDailyProfit(): Promise<number> {
    // Revenue - Costs
    const revenue = this.performanceMetrics.dailyRevenue;
    const costs = await this.calculateDailyCosts();
    
    return revenue - costs;
  }

  private async calculateDailyCosts(): Promise<number> {
    const today = new Date().toISOString().split('T')[0];
    
    // Get all costs for today
    const { data: costs } = await supabase
      .from('daily_costs')
      .select('amount')
      .eq('date', today);
    
    if (!costs) return 0;
    
    return costs.reduce((sum, cost) => sum + cost.amount, 0);
  }

  private async trackDailyCAC(): Promise<number> {
    // Customer Acquisition Cost
    const marketingSpend = await this.getMarketingSpend();
    const newUsers = this.performanceMetrics.dailyUsers;
    
    if (newUsers === 0) return 0;
    
    return Math.floor(marketingSpend / newUsers);
  }

  private async getMarketingSpend(): Promise<number> {
    const today = new Date().toISOString().split('T')[0];
    
    const { data: adSpend } = await supabase
      .from('ad_spend')
      .select('amount')
      .eq('date', today);
    
    if (!adSpend) return 0;
    
    return adSpend.reduce((sum, ad) => sum + ad.amount, 0);
  }

  private async trackDailyLTV(): Promise<number> {
    // Lifetime Value - simplified calculation
    const avgRevenuePerUser = this.performanceMetrics.dailyUsers > 0 ? 
      this.performanceMetrics.dailyRevenue / this.performanceMetrics.dailyUsers : 0;
    
    // Assume average customer lifetime of 12 months
    return Math.floor(avgRevenuePerUser * 12);
  }

  private async trackDailyROI(): Promise<number> {
    // Return on Investment
    const profit = this.performanceMetrics.dailyProfit;
    const investment = await this.getTotalInvestment();
    
    if (investment === 0) return 0;
    
    return (profit / investment) * 100;
  }

  private async getTotalInvestment(): Promise<number> {
    const today = new Date().toISOString().split('T')[0];
    
    // Sum all investments for today
    const { data: investments } = await supabase
      .from('investments')
      .select('amount')
      .eq('date', today);
    
    if (!investments) return 0;
    
    return investments.reduce((sum, inv) => sum + inv.amount, 0);
  }

  private async trackGrowthRate(): Promise<number> {
    // Calculate growth rate compared to yesterday
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const todayRevenue = this.performanceMetrics.dailyRevenue;
    const yesterdayRevenue = await this.getRevenueForDate(yesterday.toISOString().split('T')[0]);
    
    if (yesterdayRevenue === 0) return 0;
    
    return ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100;
  }

  private async getRevenueForDate(date: string): Promise<number> {
    const { data: payments } = await supabase
      .from('payments')
      .select('amount')
      .eq('status', 'completed')
      .eq('date', date);
    
    if (!payments) return 0;
    
    return payments.reduce((sum, payment) => sum + payment.amount, 0);
  }

  private async storePerformanceMetrics(): Promise<void> {
    await supabase.from('performance_metrics').insert({
      date: new Date().toISOString().split('T')[0],
      daily_revenue: this.performanceMetrics.dailyRevenue,
      daily_users: this.performanceMetrics.dailyUsers,
      daily_conversions: this.performanceMetrics.dailyConversions,
      daily_profit: this.performanceMetrics.dailyProfit,
      daily_cac: this.performanceMetrics.dailyCAC,
      daily_ltv: this.performanceMetrics.dailyLTV,
      daily_roi: this.performanceMetrics.dailyROI,
      growth_rate: this.performanceMetrics.growthRate,
      created_at: new Date().toISOString()
    });
  }

  private async alertOnThresholds(): Promise<void> {
    // Alert if KPIs fall below thresholds
    const alerts = [];
    
    // Revenue alert
    if (this.performanceMetrics.dailyRevenue < 100000) { // ₹1,000 threshold
      alerts.push({
        type: 'revenue_low',
        message: `Daily revenue ₹${this.performanceMetrics.dailyRevenue / 100} below threshold`,
        priority: 'high'
      });
    }
    
    // ROI alert
    if (this.performanceMetrics.dailyROI < 10) { // 10% ROI threshold
      alerts.push({
        type: 'roi_low',
        message: `Daily ROI ${this.performanceMetrics.dailyROI.toFixed(2)}% below threshold`,
        priority: 'medium'
      });
    }
    
    // Growth rate alert
    if (this.performanceMetrics.growthRate < 5) { // 5% growth threshold
      alerts.push({
        type: 'growth_low',
        message: `Growth rate ${this.performanceMetrics.growthRate.toFixed(2)}% below threshold`,
        priority: 'medium'
      });
    }
    
    // Store alerts
    for (const alert of alerts) {
      await supabase.from('performance_alerts').insert({
        type: alert.type,
        message: alert.message,
        priority: alert.priority,
        date: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString()
      });
    }
  }

  getPerformanceMetrics() {
    return this.performanceMetrics;
  }

  resetPerformanceMetrics(): void {
    this.performanceMetrics = {
      dailyRevenue: 0,
      dailyUsers: 0,
      dailyConversions: 0,
      dailyProfit: 0,
      dailyCAC: 0,
      dailyLTV: 0,
      dailyROI: 0,
      growthRate: 0
    };
  }
}

// START PERFORMANCE TRACKER IMMEDIATELY
const performanceTracker = PerformanceTracker.getInstance();
performanceTracker.startPerformanceTracker();

export default performanceTracker;
