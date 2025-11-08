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
    'wear',
    'reliability'
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
  minProfit = signal<number>(0);
  minROI = signal<number>(0);
  profitableOnly = signal<boolean>(false);

  // Pagination
  pageSize = signal<number>(25);
  pageIndex = signal<number>(0);
  totalItems = computed(() => this.filteredOpportunities().length);

  // Sorting
  sortColumn = signal<string>('bestProfit');
  sortDirection = signal<'asc' | 'desc'>('desc');

  categories = ['all', 'Rifle', 'Pistol', 'SMG', 'Sniper Rifle', 'Shotgun', 'Heavy', 'Knife', 'Gloves'];
  wears = ['all', 'Factory New', 'Minimal Wear', 'Field-Tested', 'Well-Worn', 'Battle-Scarred'];

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

    // Min profit filter
    if (this.minProfit() > 0) {
      filtered = filtered.filter(item => item.bestProfit !== null && item.bestProfit >= this.minProfit());
    }

    // Min ROI filter
    if (this.minROI() > 0) {
      filtered = filtered.filter(item => item.bestROI !== null && item.bestROI >= this.minROI());
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
    const value = parseFloat((event.target as HTMLInputElement).value) || 0;
    this.minProfit.set(value);
    this.applyFilters();
  }

  onMinROIChange(event: Event) {
    const value = parseFloat((event.target as HTMLInputElement).value) || 0;
    this.minROI.set(value);
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
    this.minProfit.set(0);
    this.minROI.set(0);
    this.profitableOnly.set(false);
    this.applyFilters();
  }

  getDirectionColor(direction: string): string {
    return direction === 'B→C' ? '#4caf50' : direction === 'C→B' ? '#2196f3' : '#757575';
  }

  getReliabilityColor(reliability: string): string {
    const colors: { [key: string]: string } = {
      'High': '#4caf50',
      'Medium': '#ff9800',
      'Low': '#f44336',
      'N/A': '#757575'
    };
    return colors[reliability] || '#757575';
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
