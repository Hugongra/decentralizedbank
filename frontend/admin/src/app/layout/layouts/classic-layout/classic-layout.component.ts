import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NgIf } from '@angular/common';
import { NgClass } from '@angular/common';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { toSignal } from '@angular/core/rxjs-interop';
import { combineLatest, combineLatestWith, map } from 'rxjs';
import { NavigationComponent } from '../../components/navigation/navigation.component';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { AlertComponent } from '../../../components/alert/alert.component';
import { LayoutService } from '../../layout.service';

const SIZE = {
  zero: '0px',
  small: '60px',
  large: '280px'
};

@Component({
  selector: 'classic-layout',
  templateUrl: './classic-layout.component.html',
  styleUrl: './classic-layout.component.scss',
  imports: [
    RouterOutlet,
    NgIf,
    NgClass,
    NavigationComponent,
    NavbarComponent,
    AlertComponent
  ],
  animations: [
    trigger('openClose', [
        state('opened', style({
            width: SIZE.large
        })),
        state('closed-desktop', style({
            width: SIZE.zero
        })),
        state('closed-mobile', style({
            width: SIZE.small
        })),
        transition('closed-desktop => opened', [
            style({ width: '0px' }),
            animate('300ms ease-out', style({ width: SIZE.large }))
        ]),
        transition('closed-mobile => opened', [
            style({ width: SIZE.small }),
            animate('300ms ease-out', style({ width: SIZE.large }))
        ]),
        transition('opened => closed-desktop', [
            style({ width: SIZE.large }),
            animate('300ms ease-in', style({ width: '0px' }))
        ]),
        transition('opened => closed-mobile', [
            style({ width: SIZE.large }),
            animate('300ms ease-in', style({ width: SIZE.small }))
        ]),
      ],
    )
  ]
})
export class ClassicLayoutComponent {

  #layoutService = inject(LayoutService);

  animationStateS = toSignal(combineLatest([
    this.#layoutService.navigationOpen$,
    this.#layoutService.mobile$,
  ])
  .pipe(
    map(([open, mobile]) => {
      return open ? 'opened' : `closed-${mobile ? 'mobile' : 'desktop'}`;
    })
  ))
  mobileS = toSignal(this.#layoutService.mobile$);
  isNavigationOverS = toSignal(
    this.#layoutService.navigationOpen$
    .pipe(
      combineLatestWith(this.#layoutService.mobile$),
      map(([open, isMobile]) => open && isMobile))
  );
  isNavigationVisibleS = toSignal(
    combineLatest([
      this.#layoutService.navigationOpen$,
      this.#layoutService.mobile$,
      this.#layoutService.drawerStatus$.pipe(map(status => status === 'opened'))
    ])
    .pipe(
      map(([navigationOpen, drawerOpen, isMobile]) => {
        if (drawerOpen) {
          return !isMobile || (isMobile && navigationOpen);
        } else {
          return navigationOpen || isMobile;
        }
      })
    )
  );
  overflowActiveS = toSignal(this.#layoutService.overflowActive$);
  alertsS = toSignal(this.#layoutService.alerts$);

  close(): void {
    this.#layoutService.toggleNavigation(false);
  }

}
