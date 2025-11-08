import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';

export interface SkinOpportunity {
  id: number;
  name: string;
  quality: string;
  buyMarket: string;
  buyPrice: number;
  sellMarket: string;
  sellPrice: number;
  profit: number;
  profitPercent: number;
  rarity: string;
  trend: 'up' | 'down' | 'stable';
}

@Component({
  selector: 'app-opportunities',
  imports: [
    CommonModule,
    RouterLink,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatCardModule,
    MatTooltipModule
  ],
  templateUrl: './opportunities.html',
  styleUrl: './opportunities.scss'
})
export class OpportunitiesComponent implements OnInit {
  displayedColumns: string[] = [
    'name',
    'quality',
    'rarity',
    'buyMarket',
    'buyPrice',
    'sellMarket',
    'sellPrice',
    'profit',
    'profitPercent',
    'trend'
  ];

  // All data
  private allOpportunities = signal<SkinOpportunity[]>([]);

  // Filtered and sorted data
  filteredOpportunities = signal<SkinOpportunity[]>([]);

  // Paginated data to display
  paginatedOpportunities = signal<SkinOpportunity[]>([]);

  // Filter values
  searchTerm = signal<string>('');
  selectedRarity = signal<string>('all');
  selectedMarket = signal<string>('all');
  minProfit = signal<number>(0);

  // Pagination
  pageSize = signal<number>(10);
  pageIndex = signal<number>(0);
  totalItems = computed(() => this.filteredOpportunities().length);

  // Sorting
  sortColumn = signal<string>('profitPercent');
  sortDirection = signal<'asc' | 'desc'>('desc');

  rarities = ['all', 'Consumer Grade', 'Industrial Grade', 'Mil-Spec', 'Restricted', 'Classified', 'Covert'];
  markets = ['all', 'Steam', 'CSGOFloat', 'Buff163', 'Skinport', 'DMarket'];

  ngOnInit() {
    this.loadMockData();
    this.applyFilters();
  }

  loadMockData() {
    const mockData: SkinOpportunity[] = [
      {
        id: 1,
        name: 'AK-47 | Redline',
        quality: 'Field-Tested',
        buyMarket: 'Steam',
        buyPrice: 24.50,
        sellMarket: 'CSGOFloat',
        sellPrice: 28.75,
        profit: 4.25,
        profitPercent: 17.35,
        rarity: 'Classified',
        trend: 'up'
      },
      {
        id: 2,
        name: 'AWP | Asiimov',
        quality: 'Field-Tested',
        buyMarket: 'Buff163',
        buyPrice: 82.30,
        sellMarket: 'Steam',
        sellPrice: 95.60,
        profit: 13.30,
        profitPercent: 16.16,
        rarity: 'Covert',
        trend: 'up'
      },
      {
        id: 3,
        name: 'M4A4 | Howl',
        quality: 'Minimal Wear',
        buyMarket: 'CSGOFloat',
        buyPrice: 3250.00,
        sellMarket: 'DMarket',
        sellPrice: 3580.00,
        profit: 330.00,
        profitPercent: 10.15,
        rarity: 'Covert',
        trend: 'stable'
      },
      {
        id: 4,
        name: 'Glock-18 | Fade',
        quality: 'Factory New',
        buyMarket: 'Steam',
        buyPrice: 445.00,
        sellMarket: 'Skinport',
        sellPrice: 512.00,
        profit: 67.00,
        profitPercent: 15.06,
        rarity: 'Restricted',
        trend: 'up'
      },
      {
        id: 5,
        name: 'Desert Eagle | Blaze',
        quality: 'Factory New',
        buyMarket: 'Buff163',
        buyPrice: 285.50,
        sellMarket: 'Steam',
        sellPrice: 318.20,
        profit: 32.70,
        profitPercent: 11.45,
        rarity: 'Restricted',
        trend: 'down'
      },
      {
        id: 6,
        name: 'USP-S | Kill Confirmed',
        quality: 'Minimal Wear',
        buyMarket: 'Steam',
        buyPrice: 45.80,
        sellMarket: 'CSGOFloat',
        sellPrice: 54.30,
        profit: 8.50,
        profitPercent: 18.56,
        rarity: 'Classified',
        trend: 'up'
      },
      {
        id: 7,
        name: 'Karambit | Doppler',
        quality: 'Factory New',
        buyMarket: 'CSGOFloat',
        buyPrice: 1850.00,
        sellMarket: 'Buff163',
        sellPrice: 2015.00,
        profit: 165.00,
        profitPercent: 8.92,
        rarity: 'Covert',
        trend: 'stable'
      },
      {
        id: 8,
        name: 'M4A1-S | Icarus Fell',
        quality: 'Factory New',
        buyMarket: 'Steam',
        buyPrice: 125.00,
        sellMarket: 'Skinport',
        sellPrice: 148.50,
        profit: 23.50,
        profitPercent: 18.80,
        rarity: 'Restricted',
        trend: 'up'
      },
      {
        id: 9,
        name: 'AK-47 | Fire Serpent',
        quality: 'Field-Tested',
        buyMarket: 'Buff163',
        buyPrice: 865.00,
        sellMarket: 'Steam',
        sellPrice: 975.00,
        profit: 110.00,
        profitPercent: 12.72,
        rarity: 'Covert',
        trend: 'up'
      },
      {
        id: 10,
        name: 'P250 | Asiimov',
        quality: 'Field-Tested',
        buyMarket: 'Steam',
        buyPrice: 3.25,
        sellMarket: 'CSGOFloat',
        sellPrice: 3.95,
        profit: 0.70,
        profitPercent: 21.54,
        rarity: 'Industrial Grade',
        trend: 'stable'
      },
      {
        id: 11,
        name: 'AWP | Dragon Lore',
        quality: 'Factory New',
        buyMarket: 'CSGOFloat',
        buyPrice: 9500.00,
        sellMarket: 'Buff163',
        sellPrice: 10250.00,
        profit: 750.00,
        profitPercent: 7.89,
        rarity: 'Covert',
        trend: 'up'
      },
      {
        id: 12,
        name: 'M4A4 | Neo-Noir',
        quality: 'Factory New',
        buyMarket: 'Steam',
        buyPrice: 18.90,
        sellMarket: 'Skinport',
        sellPrice: 22.40,
        profit: 3.50,
        profitPercent: 18.52,
        rarity: 'Classified',
        trend: 'up'
      },
      {
        id: 13,
        name: 'Butterfly Knife | Fade',
        quality: 'Factory New',
        buyMarket: 'Buff163',
        buyPrice: 2150.00,
        sellMarket: 'DMarket',
        sellPrice: 2385.00,
        profit: 235.00,
        profitPercent: 10.93,
        rarity: 'Covert',
        trend: 'stable'
      },
      {
        id: 14,
        name: 'AK-47 | Vulcan',
        quality: 'Factory New',
        buyMarket: 'Steam',
        buyPrice: 68.50,
        sellMarket: 'CSGOFloat',
        sellPrice: 79.80,
        profit: 11.30,
        profitPercent: 16.50,
        rarity: 'Classified',
        trend: 'up'
      },
      {
        id: 15,
        name: 'Five-SeveN | Case Hardened',
        quality: 'Factory New',
        buyMarket: 'CSGOFloat',
        buyPrice: 12.80,
        sellMarket: 'Steam',
        sellPrice: 15.60,
        profit: 2.80,
        profitPercent: 21.88,
        rarity: 'Mil-Spec',
        trend: 'up'
      }
    ];

    this.allOpportunities.set(mockData);
  }

  applyFilters() {
    let filtered = [...this.allOpportunities()];

    // Search filter
    const search = this.searchTerm().toLowerCase();
    if (search) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(search) ||
        item.quality.toLowerCase().includes(search)
      );
    }

    // Rarity filter
    if (this.selectedRarity() !== 'all') {
      filtered = filtered.filter(item => item.rarity === this.selectedRarity());
    }

    // Market filter
    if (this.selectedMarket() !== 'all') {
      filtered = filtered.filter(
        item => item.buyMarket === this.selectedMarket() || item.sellMarket === this.selectedMarket()
      );
    }

    // Min profit filter
    if (this.minProfit() > 0) {
      filtered = filtered.filter(item => item.profitPercent >= this.minProfit());
    }

    // Apply sorting
    filtered = this.sortData(filtered);

    this.filteredOpportunities.set(filtered);
    this.pageIndex.set(0); // Reset to first page
    this.updatePaginatedData();
  }

  sortData(data: SkinOpportunity[]): SkinOpportunity[] {
    const column = this.sortColumn();
    const direction = this.sortDirection();

    return [...data].sort((a, b) => {
      let aValue = a[column as keyof SkinOpportunity];
      let bValue = b[column as keyof SkinOpportunity];

      // Handle string vs number comparison
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = (bValue as string).toLowerCase();
      }

      const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      return direction === 'asc' ? comparison : -comparison;
    });
  }

  onSortChange(sort: Sort) {
    if (sort.active && sort.direction) {
      this.sortColumn.set(sort.active);
      this.sortDirection.set(sort.direction as 'asc' | 'desc');
      this.applyFilters();
    }
  }

  onSearchChange(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
    this.applyFilters();
  }

  onRarityChange(value: string) {
    this.selectedRarity.set(value);
    this.applyFilters();
  }

  onMarketChange(value: string) {
    this.selectedMarket.set(value);
    this.applyFilters();
  }

  onMinProfitChange(event: Event) {
    const value = parseFloat((event.target as HTMLInputElement).value) || 0;
    this.minProfit.set(value);
    this.applyFilters();
  }

  onPageChange(event: PageEvent) {
    this.pageSize.set(event.pageSize);
    this.pageIndex.set(event.pageIndex);
    this.updatePaginatedData();
  }

  updatePaginatedData() {
    const startIndex = this.pageIndex() * this.pageSize();
    const endIndex = startIndex + this.pageSize();
    this.paginatedOpportunities.set(
      this.filteredOpportunities().slice(startIndex, endIndex)
    );
  }

  clearFilters() {
    this.searchTerm.set('');
    this.selectedRarity.set('all');
    this.selectedMarket.set('all');
    this.minProfit.set(0);
    this.applyFilters();
  }

  getRarityColor(rarity: string): string {
    const colors: { [key: string]: string } = {
      'Consumer Grade': '#b0c3d9',
      'Industrial Grade': '#5e98d9',
      'Mil-Spec': '#4b69ff',
      'Restricted': '#8847ff',
      'Classified': '#d32ce6',
      'Covert': '#eb4b4b'
    };
    return colors[rarity] || '#ffffff';
  }

  getTrendIcon(trend: string): string {
    return trend === 'up' ? 'trending_up' : trend === 'down' ? 'trending_down' : 'trending_flat';
  }

  getTrendColor(trend: string): string {
    return trend === 'up' ? '#4caf50' : trend === 'down' ? '#f44336' : '#ff9800';
  }
}
