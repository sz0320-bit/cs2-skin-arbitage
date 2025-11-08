import { Component, signal } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-landing',
  imports: [MatToolbarModule, MatCardModule, MatButtonModule, MatIconModule, MatChipsModule, RouterLink],
  templateUrl: './landing.html',
  styleUrl: './landing.scss',
})
export class Landing {
  protected readonly title = signal('CS2 Skin Arbitrage');
  protected readonly subtitle = signal('Track and analyze CS2 skin prices across markets');
}
