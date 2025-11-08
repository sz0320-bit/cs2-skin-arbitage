import { Component, OnInit, signal, computed, inject } from '@angular/core';
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
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { RouterLink } from '@angular/router';
import { PriceService } from '../services/price.service';
import { ArbitrageOpportunity } from '../models/arbitrage.models';

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
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatCheckboxModule
  ],
  templateUrl: './opportunities.html',
  styleUrl: './opportunities.scss'
})
export class OpportunitiesComponent implements OnInit {
  private priceService = inject(PriceService);

  displayedColumns: string[] = [
    'itemName',
    'csfloatPrice',
    'buff163Price',
    'rawPriceDiff',
    'percentDifference',
    'cheaperPlatform',
    'bestDirection',
    'bestProfit',
    'bestROI',
    'bc_roi',
    'cb_roi',
    'profitable',
    'category',
    'wear'
  ];

  // All data
  private allOpportunities = signal<ArbitrageOpportunity[]>([]);

  // Filtered and sorted data
  filteredOpportunities = signal<ArbitrageOpportunity[]>([]);

  // Paginated data to display
  paginatedOpportunities = signal<ArbitrageOpportunity[]>([]);

  // Loading state
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);

  // Filter values
  searchTerm = signal<string>('');
  selectedCategory = signal<string>('all');
  selectedWear = signal<string>('all');
  selectedPlatform = signal<string>('all');
  selectedDirection = signal<string>('all');
  minProfit = signal<number | null>(null);
  maxProfit = signal<number | null>(null);
  minROI = signal<number | null>(null);
  maxROI = signal<number | null>(null);
  minPrice = signal<number | null>(null);
  maxPrice = signal<number | null>(null);
  profitableOnly = signal<boolean>(false);
  
  // Available filter options (computed from data)
  availableCategories = computed(() => {
    const cats = new Set(this.allOpportunities().map(o => o.category));
    return ['all', ...Array.from(cats).sort()];
  });
  
  availableWears = computed(() => {
    const wears = new Set(this.allOpportunities().map(o => o.wear).filter(w => w !== 'N/A'));
    return ['all', ...Array.from(wears).sort()];
  });
  
  platforms = ['all', 'CSFloat', 'Buff163'];
  directions = ['all', 'B→C', 'C→B'];
  
  // Active filters count
  activeFiltersCount = computed(() => {
    let count = 0;
    if (this.searchTerm()) count++;
    if (this.selectedCategory() !== 'all') count++;
    if (this.selectedWear() !== 'all') count++;
    if (this.selectedPlatform() !== 'all') count++;
    if (this.selectedDirection() !== 'all') count++;
    if (this.minProfit() !== null) count++;
    if (this.maxProfit() !== null) count++;
    if (this.minROI() !== null) count++;
    if (this.maxROI() !== null) count++;
    if (this.minPrice() !== null) count++;
    if (this.maxPrice() !== null) count++;
    if (this.profitableOnly()) count++;
    return count;
  });

  // Pagination
  pageSize = signal<number>(25);
  pageIndex = signal<number>(0);
  totalItems = computed(() => this.filteredOpportunities().length);

  // Sorting
  sortColumn = signal<string>('bestProfit');
  sortDirection = signal<'asc' | 'desc'>('desc');

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.isLoading.set(true);
    this.error.set(null);

    this.priceService.fetchArbitrageOpportunities().subscribe({
      next: (opportunities) => {
        this.allOpportunities.set(opportunities);
        this.applyFilters();
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading opportunities:', err);
        this.error.set('Failed to load opportunities. Please try again.');
        this.isLoading.set(false);
      }
    });
  }

  applyFilters() {
    let filtered = [...this.allOpportunities()];

    // Search filter
    const search = this.searchTerm().toLowerCase();
    if (search) {
      filtered = filtered.filter(item =>
        item.itemName.toLowerCase().includes(search)
      );
    }

    // Category filter
    if (this.selectedCategory() !== 'all') {
      filtered = filtered.filter(item => item.category === this.selectedCategory());
    }

    // Wear filter
    if (this.selectedWear() !== 'all') {
      filtered = filtered.filter(item => item.wear === this.selectedWear());
    }

    // Platform filter (cheaper platform)
    if (this.selectedPlatform() !== 'all') {
      filtered = filtered.filter(item => item.cheaperPlatform === this.selectedPlatform());
    }

    // Direction filter
    if (this.selectedDirection() !== 'all') {
      filtered = filtered.filter(item => item.bestDirection === this.selectedDirection());
    }

    // Price range filter
    if (this.minPrice() !== null) {
      filtered = filtered.filter(item => 
        (item.csfloatPrice !== null && item.csfloatPrice >= this.minPrice()!) ||
        (item.buff163Price !== null && item.buff163Price >= this.minPrice()!)
      );
    }
    if (this.maxPrice() !== null) {
      filtered = filtered.filter(item => 
        (item.csfloatPrice !== null && item.csfloatPrice <= this.maxPrice()!) ||
        (item.buff163Price !== null && item.buff163Price <= this.maxPrice()!)
      );
    }

    // Profit range filter
    if (this.minProfit() !== null) {
      filtered = filtered.filter(item => item.bestProfit !== null && item.bestProfit >= this.minProfit()!);
    }
    if (this.maxProfit() !== null) {
      filtered = filtered.filter(item => item.bestProfit !== null && item.bestProfit <= this.maxProfit()!);
    }

    // ROI range filter
    if (this.minROI() !== null) {
      filtered = filtered.filter(item => item.bestROI !== null && item.bestROI >= this.minROI()!);
    }
    if (this.maxROI() !== null) {
      filtered = filtered.filter(item => item.bestROI !== null && item.bestROI <= this.maxROI()!);
    }

    // Profitable only filter
    if (this.profitableOnly()) {
      filtered = filtered.filter(item => item.profitable);
    }

    // Apply sorting
    filtered = this.sortData(filtered);

    this.filteredOpportunities.set(filtered);
    this.pageIndex.set(0); // Reset to first page
    this.updatePaginatedData();
  }

  sortData(data: ArbitrageOpportunity[]): ArbitrageOpportunity[] {
    const column = this.sortColumn();
    const direction = this.sortDirection();

    return [...data].sort((a, b) => {
      let aValue = a[column as keyof ArbitrageOpportunity];
      let bValue = b[column as keyof ArbitrageOpportunity];

      // Handle null values
      if (aValue === null && bValue === null) return 0;
      if (aValue === null) return direction === 'asc' ? 1 : -1;
      if (bValue === null) return direction === 'asc' ? -1 : 1;

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

  onCategoryChange(value: string) {
    this.selectedCategory.set(value);
    this.applyFilters();
  }

  onWearChange(value: string) {
    this.selectedWear.set(value);
    this.applyFilters();
  }

  onMinProfitChange(event: Event) {
    const value = parseFloat((event.target as HTMLInputElement).value);
    this.minProfit.set(isNaN(value) ? null : value);
    this.applyFilters();
  }

  onMinROIChange(event: Event) {
    const value = parseFloat((event.target as HTMLInputElement).value);
    this.minROI.set(isNaN(value) ? null : value);
    this.applyFilters();
  }

  onProfitableOnlyChange(value: boolean) {
    this.profitableOnly.set(value);
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
    this.selectedCategory.set('all');
    this.selectedWear.set('all');
    this.selectedPlatform.set('all');
    this.selectedDirection.set('all');
    this.minProfit.set(null);
    this.maxProfit.set(null);
    this.minROI.set(null);
    this.maxROI.set(null);
    this.minPrice.set(null);
    this.maxPrice.set(null);
    this.profitableOnly.set(false);
    this.applyFilters();
  }

  onPlatformChange(value: string) {
    this.selectedPlatform.set(value);
    this.applyFilters();
  }

  onDirectionChange(value: string) {
    this.selectedDirection.set(value);
    this.applyFilters();
  }

  onMinPriceChange(event: Event) {
    const value = parseFloat((event.target as HTMLInputElement).value);
    this.minPrice.set(isNaN(value) ? null : value);
    this.applyFilters();
  }

  onMaxPriceChange(event: Event) {
    const value = parseFloat((event.target as HTMLInputElement).value);
    this.maxPrice.set(isNaN(value) ? null : value);
    this.applyFilters();
  }

  onMaxProfitChange(event: Event) {
    const value = parseFloat((event.target as HTMLInputElement).value);
    this.maxProfit.set(isNaN(value) ? null : value);
    this.applyFilters();
  }

  onMaxROIChange(event: Event) {
    const value = parseFloat((event.target as HTMLInputElement).value);
    this.maxROI.set(isNaN(value) ? null : value);
    this.applyFilters();
  }

  getDirectionColor(direction: string): string {
    return direction === 'B→C' ? '#4caf50' : direction === 'C→B' ? '#2196f3' : '#757575';
  }

  formatCurrency(value: number | null): string {
    if (value === null) return 'N/A';
    return `$${value.toFixed(2)}`;
  }

  formatPercent(value: number | null): string {
    if (value === null) return 'N/A';
    return `${value.toFixed(2)}%`;
  }
}
