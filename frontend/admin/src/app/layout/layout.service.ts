import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, filter, map, Observable, ReplaySubject, tap } from 'rxjs';
import { BANK_NAVIGATION_ITEM, ASSETS_NAVIGATION_ITEM, NavigationItem } from './components/navigation/navigation.component';
import { NavigationEnd, Router } from '@angular/router';
import { BankService } from '../services/app/bank.service';
import { Alert } from '../components/alert/alert.types';

@Injectable({
  providedIn: 'root'
})
export class LayoutService {

  #router = inject(Router);
  #breakpointObserver = inject(BreakpointObserver);
  #bankService = inject(BankService);

  #overflowActive$ = new BehaviorSubject<boolean>(true);
  #navigationOpen$ = new BehaviorSubject<boolean>(true);
  #navigationItems$ = new ReplaySubject<NavigationItem[]>;
  #selectedNavigationItem$ = new ReplaySubject<string>();
  #alerts = new BehaviorSubject<Alert[]>([]);
  #drawerStatus$ = new BehaviorSubject<DrawerStatus>('init');
  #previousLayout: 'mobile' | 'desktop' = 'desktop';

  constructor() {
    this.#breakpointObserver.observe(Breakpoints.XSmall).pipe(
      map(result => result.matches)).subscribe(isMobile => {
        if (isMobile && this.#previousLayout === 'desktop') {
          this.#navigationOpen$.next(false);
        }
        if (!isMobile && this.#previousLayout === 'mobile') {
          this.#navigationOpen$.next(true);
        }
    });
    this.#navigationItems$.next([BANK_NAVIGATION_ITEM]);
    combineLatest([
      this.#router.events.pipe(filter((e) => e.constructor.name === 'NavigationEnd')),
      this.#bankService.bank$.pipe(filter(bank => !!bank))
    ]).pipe(
      tap(([routerEvent, bank]) => {
        if (bank.init) {
          this.#navigationItems$.next([BANK_NAVIGATION_ITEM, ASSETS_NAVIGATION_ITEM]);
        }
        this.selectedNavigationItem = (routerEvent as NavigationEnd).url.split('/')[1];
      }
    ))
    .subscribe();
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Accessors
  // -----------------------------------------------------------------------------------------------------

  get overflowActive$(): Observable<boolean> {
    return this.#overflowActive$.asObservable();
  }

  set overflowActive(value: boolean) {
    this.#overflowActive$.next(value);
  }

  get mobile$(): Observable<boolean> {
    return this.#breakpointObserver.observe(Breakpoints.XSmall)
    .pipe(
      map((result) => result.matches),
      tap(mobile => {
        if (mobile) {
          this.#previousLayout = 'mobile';
        } else {
          this.#previousLayout = 'desktop';
        }
        return mobile;
      })
    );
  }

  get isTablet$(): Observable<boolean> {
    return this.#breakpointObserver.observe(['(max-width: 1200px)']).pipe(map((result) => {
      return result.matches
    }));
  }

  get navigationOpen$(): Observable<boolean> {
    return this.#navigationOpen$.asObservable();
  }

  get navigationItems$(): Observable<NavigationItem[]> {
    return this.#navigationItems$.asObservable();
  }

  get selectedNavigationItem$(): Observable<string> {
    return this.#selectedNavigationItem$.asObservable();
  }

  set selectedNavigationItem(value: string) {
    this.#selectedNavigationItem$.next(value);
  }

  get drawerStatus$() {
    return this.#drawerStatus$.asObservable();
  }

  get alerts$(): Observable<Alert[]> {
    return this.#alerts.asObservable();
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Public methods
  // -----------------------------------------------------------------------------------------------------

  toggleNavigation(value?: boolean): void {
    if (value === undefined) {
      this.#navigationOpen$.next(!this.#navigationOpen$.value);
    } else {
      this.#navigationOpen$.next(value);
    }
  }

  initDrawer() {
    this.#drawerStatus$.next('init');
    this.overflowActive = true;
  }

  openDrawer() {
    this.#drawerStatus$.next('opened');
    this.overflowActive = false;
  }

  closeDrawer() {
    if (this.#drawerStatus$.value === 'opened') {
      this.#drawerStatus$.next('closed');
      this.overflowActive = true;
    }
  }

  observeWidth(width: number): Observable<boolean> {
    return this.#breakpointObserver.observe([`(max-width: ${width}px)`]).pipe(
      map((result) => result.matches));
  }

  addAlert(alert: Alert): void {
    const alerts = this.#alerts.getValue();
    alerts.push(alert);
    this.#alerts.next(alerts);
  }

  removeAlert(id: string): void {
    const alerts = this.#alerts.getValue().filter(alert => alert.id !== id);
    this.#alerts.next(alerts);
  }

}

export type Layout = 'mobile' | 'desktop';

export type DrawerStatus = 'init' | 'opened' | 'closed';
