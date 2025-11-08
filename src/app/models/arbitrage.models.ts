// Raw API response interfaces
export interface Buff163Response {
  [itemName: string]: {
    starting_at: {
      price: number;
    };
    highest_order: {
      price: number;
    };
  };
}

export interface CSFloatResponse {
  [itemName: string]: {
    avg_price?: number;
    avg_list_price?: number;
    count?: number;
  };
}

// Complete arbitrage opportunity with all calculations
export interface ArbitrageOpportunity {
  // Basic info
  itemName: string;
  category: string;
  wear: string;
  statTrak: boolean;
  souvenir: boolean;

  // Prices
  csfloatPrice: number | null;
  buff163Price: number | null;

  // Basic calculations
  rawPriceDiff: number | null;
  absRawDiff: number | null;
  percentDifference: number | null;
  cheaperPlatform: 'CSFloat' | 'Buff163' | 'N/A';
  priceRatio: number | null;

  // Buff → CSFloat arbitrage (B→C)
  bc_buyCost: number | null;
  bc_sellReceive: number | null;
  bc_netProfit: number | null;
  bc_roi: number | null;

  // CSFloat → Buff arbitrage (C→B)
  cb_buyCost: number | null;
  cb_sellReceive: number | null;
  cb_netProfit: number | null;
  cb_roi: number | null;

  // Best opportunity
  bestDirection: 'B→C' | 'C→B' | 'N/A';
  bestProfit: number | null;
  bestROI: number | null;
  profitable: boolean;

  // Market data
  csfloatQty: number | null;
  volume: number | null;
  priceVariance: number | null;
  zScore: number | null;
  reliability: 'High' | 'Medium' | 'Low' | 'N/A';
}

// Platform fees (estimated percentages)
export const PLATFORM_FEES = {
  buff163: {
    buyerFee: 0.025,    // 2.5% buyer fee
    sellerFee: 0.025    // 2.5% seller fee
  },
  csfloat: {
    buyerFee: 0.02,     // 2% buyer fee
    sellerFee: 0.02     // 2% seller fee
  }
};
