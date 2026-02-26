import { Component, inject, OnInit } from '@angular/core';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { TelemetryService } from '@tmp-dac/telemetry';

@Component({
  imports: [RouterModule],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  protected title = 'portal';
  private router = inject(Router);
  private telemetry = inject(TelemetryService);

  ngOnInit() {
    // 1. Initialize theme based on user's system OS preference
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    if (darkModeMediaQuery.matches) {
      document.body.classList.add('dark-theme');
    }

    // 2. Listen for OS-level theme changes while the app is open
    darkModeMediaQuery.addEventListener('change', (e) => {
      if (e.matches) {
        document.body.classList.add('dark-theme');
      } else {
        document.body.classList.remove('dark-theme');
      }
    });

    // 3. Setup Telemetry
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.telemetry.trackPageView(event.urlAfterRedirects);
    });
  }
}
