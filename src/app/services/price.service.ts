import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map, catchError, of } from 'rxjs';
import { ArbitrageOpportunity, Buff163Response, CSFloatResponse, PLATFORM_FEES } from '../models/arbitrage.models';

@Injectable({
  providedIn: 'root'
})
export class PriceService {
  private http = inject(HttpClient);

  private readonly BUFF163_URL = '/api/prices/buff163.json';
  private readonly CSFLOAT_URL = '/api/prices/csfloat.json';

  // CS2 weapon categories
  private readonly WEAPON_CATEGORIES: { [key: string]: string } = {
    'AK-47': 'Rifle',
    'M4A4': 'Rifle',
    'M4A1-S': 'Rifle',
    'AWP': 'Sniper Rifle',
    'Desert Eagle': 'Pistol',
    'Glock-18': 'Pistol',
    'USP-S': 'Pistol',
    'P2000': 'Pistol',
    'P250': 'Pistol',
    'Five-SeveN': 'Pistol',
    'Tec-9': 'Pistol',
    'CZ75-Auto': 'Pistol',
    'Dual Berettas': 'Pistol',
    'R8 Revolver': 'Pistol',
    'Nova': 'Shotgun',
    'XM1014': 'Shotgun',
    'MAG-7': 'Shotgun',
    'Sawed-Off': 'Shotgun',
    'M249': 'Heavy',
    'Negev': 'Heavy',
    'MAC-10': 'SMG',
    'MP9': 'SMG',
    'MP7': 'SMG',
    'MP5-SD': 'SMG',
    'UMP-45': 'SMG',
    'P90': 'SMG',
    'PP-Bizon': 'SMG',
    'FAMAS': 'Rifle',
    'Galil AR': 'Rifle',
    'AUG': 'Rifle',
    'SG 553': 'Rifle',
    'SSG 08': 'Sniper Rifle',
    'SCAR-20': 'Sniper Rifle',
    'G3SG1': 'Sniper Rifle',
    'Karambit': 'Knife',
    'Butterfly Knife': 'Knife',
    'Bayonet': 'Knife',
    'M9 Bayonet': 'Knife',
    'Flip Knife': 'Knife',
    'Gut Knife': 'Knife',
    'Falchion Knife': 'Knife',
    'Bowie Knife': 'Knife',
    'Shadow Daggers': 'Knife',
    'Huntsman Knife': 'Knife',
    'Navaja Knife': 'Knife',
    'Stiletto Knife': 'Knife',
    'Talon Knife': 'Knife',
    'Ursus Knife': 'Knife',
    'Classic Knife': 'Knife',
    'Paracord Knife': 'Knife',
    'Survival Knife': 'Knife',
    'Nomad Knife': 'Knife',
    'Skeleton Knife': 'Knife'
  };

  private readonly WEAR_CONDITIONS = [
    'Factory New',
    'Minimal Wear',
    'Field-Tested',
    'Well-Worn',
    'Battle-Scarred'
  ];

  fetchArbitrageOpportunities(): Observable<ArbitrageOpportunity[]> {
    return forkJoin({
      buff163: this.http.get<Buff163Response>(this.BUFF163_URL).pipe(
        catchError(err => {
          console.error('Error fetching Buff163 data:', err);
          return of({} as Buff163Response);
        })
      ),
      csfloat: this.http.get<CSFloatResponse>(this.CSFLOAT_URL).pipe(
        catchError(err => {
          console.error('Error fetching CSFloat data:', err);
          return of({} as CSFloatResponse);
        })
      )
    }).pipe(
      map(({ buff163, csfloat }) => this.mergeAndCalculate(buff163, csfloat))
    );
  }

  private mergeAndCalculate(
    buff163Data: Buff163Response,
    csfloatData: CSFloatResponse
  ): ArbitrageOpportunity[] {
    const opportunities: ArbitrageOpportunity[] = [];
    const allItemNames = new Set([
      ...Object.keys(buff163Data),
      ...Object.keys(csfloatData)
    ]);

    for (const itemName of allItemNames) {
      const buff163Item = buff163Data[itemName];
      const csfloatItem = csfloatData[itemName];

      // Skip if neither platform has data
      if (!buff163Item && !csfloatItem) continue;

      // Use starting_at price for Buff163 (listing price)
      const buff163Price = buff163Item?.starting_at?.price || null;
      // Use price for CSFloat (fallback to avg_price if price not available)
      const csfloatPrice = csfloatItem?.price || csfloatItem?.avg_price || null;

      // Skip if we don't have prices from both platforms
      if (!buff163Price || !csfloatPrice) continue;

      const opportunity = this.calculateArbitrage(
        itemName,
        buff163Price,
        csfloatPrice,
        csfloatItem?.count || null
      );

      opportunities.push(opportunity);
    }

    return opportunities;
  }

  private calculateArbitrage(
    itemName: string,
    buff163Price: number,
    csfloatPrice: number,
    csfloatQty: number | null
  ): ArbitrageOpportunity {
    // Parse item details from name
    const { category, wear, statTrak, souvenir } = this.parseItemName(itemName);

    // Basic price calculations
    const rawPriceDiff = csfloatPrice - buff163Price;
    const absRawDiff = Math.abs(rawPriceDiff);
    const percentDifference = ((rawPriceDiff / buff163Price) * 100);
    const cheaperPlatform = buff163Price < csfloatPrice ? 'Buff163' : 'CSFloat';
    const priceRatio = csfloatPrice / buff163Price;

    // Buff → CSFloat arbitrage (Buy on Buff, Sell on CSFloat)
    const bc_buyCost = buff163Price * (1 + PLATFORM_FEES.buff163.buyerFee);
    const bc_sellReceive = csfloatPrice * (1 - PLATFORM_FEES.csfloat.sellerFee);
    const bc_netProfit = bc_sellReceive - bc_buyCost;
    const bc_roi = (bc_netProfit / bc_buyCost) * 100;

    // CSFloat → Buff arbitrage (Buy on CSFloat, Sell on Buff)
    const cb_buyCost = csfloatPrice * (1 + PLATFORM_FEES.csfloat.buyerFee);
    const cb_sellReceive = buff163Price * (1 - PLATFORM_FEES.buff163.sellerFee);
    const cb_netProfit = cb_sellReceive - cb_buyCost;
    const cb_roi = (cb_netProfit / cb_buyCost) * 100;

    // Determine best direction
    let bestDirection: 'B→C' | 'C→B' | 'N/A' = 'N/A';
    let bestProfit = 0;
    let bestROI = 0;

    if (bc_netProfit > cb_netProfit) {
      bestDirection = 'B→C';
      bestProfit = bc_netProfit;
      bestROI = bc_roi;
    } else {
      bestDirection = 'C→B';
      bestProfit = cb_netProfit;
      bestROI = cb_roi;
    }

    const profitable = bestProfit > 0;

    // Calculate reliability based on quantity
    let reliability: 'High' | 'Medium' | 'Low' | 'N/A' = 'N/A';
    if (csfloatQty !== null) {
      if (csfloatQty >= 50) reliability = 'High';
      else if (csfloatQty >= 20) reliability = 'Medium';
      else reliability = 'Low';
    }

    return {
      itemName,
      category,
      wear,
      statTrak,
      souvenir,
      csfloatPrice,
      buff163Price,
      rawPriceDiff,
      absRawDiff,
      percentDifference,
      cheaperPlatform,
      priceRatio,
      bc_buyCost,
      bc_sellReceive,
      bc_netProfit,
      bc_roi,
      cb_buyCost,
      cb_sellReceive,
      cb_netProfit,
      cb_roi,
      bestDirection,
      bestProfit,
      bestROI,
      profitable,
      csfloatQty,
      volume: null, // Not available in current API
      priceVariance: null, // Would need historical data
      zScore: null, // Would need statistical analysis
      reliability
    };
  }

  private parseItemName(itemName: string): {
    category: string;
    wear: string;
    statTrak: boolean;
    souvenir: boolean;
  } {
    // Check for StatTrak™ or Souvenir
    const statTrak = itemName.includes('StatTrak™');
    const souvenir = itemName.includes('Souvenir');

    // Extract wear condition
    let wear = 'N/A';
    for (const condition of this.WEAR_CONDITIONS) {
      if (itemName.includes(`(${condition})`)) {
        wear = condition;
        break;
      }
    }

    // Extract weapon/item name and find category
    let category = 'Unknown';
    for (const [weapon, weaponCategory] of Object.entries(this.WEAPON_CATEGORIES)) {
      if (itemName.includes(weapon)) {
        category = weaponCategory;
        break;
      }
    }

    // Check for gloves
    if (itemName.includes('Gloves')) {
      category = 'Gloves';
    }

    return { category, wear, statTrak, souvenir };
  }
}
