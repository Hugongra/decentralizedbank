import { Component, DestroyRef, inject, Input, OnInit, signal } from '@angular/core';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { BehaviorSubject, catchError, combineLatest, delay, filter, map, of, skip, switchMap, tap } from 'rxjs';
import { CanvasJSAngularChartsModule } from '@canvasjs/angular-charts';
import { LayoutService } from '../../../../../layout/layout.service';
import { PublicKey } from '@solana/web3.js';
import { ApiService } from '../../../../../services/api.service';
import { RecordFilter, TimeUnit, timeUnitFormat } from '../../../../../services/models/api/record-filter';
import { DateFilterComponent } from '../../../../../components/date-filter/date-filter.component';
import { Record } from '../../../../../services/models/api/record';



@Component({
  selector: 'assets-utilization-rate-chart',
  templateUrl: './assets-utilization-rate-chart.component.html',
  styles: `
  :host {
    display: block;
    width: 100%;
    height: 450px;
  }`,
  imports: [
    MatProgressSpinner,
    CanvasJSAngularChartsModule,
    DateFilterComponent
  ],
})
export class AssetsUtilizationRateChartComponent implements OnInit {

  @Input({required: true}) set pubKey(value: PublicKey) {
    this.#publicKey$.next(value.toBase58());
  }

  #destroyRef = inject(DestroyRef);
  #layoutService = inject(LayoutService);
  #apiService = inject(ApiService);

  #publicKey$ = new BehaviorSubject<string>('');
  #timeUnit$ = new BehaviorSubject<TimeUnit>(TimeUnit.YEARS);

  loadingS = signal(true);
  chartOptionsS = toSignal(combineLatest([
    this.#publicKey$,
    this.#timeUnit$]
  ).pipe(
    filter(([publicKey, _timeUnit]) => publicKey !== ''),
    takeUntilDestroyed(this.#destroyRef),
    tap(() => this.loadingS.set(true)),
    switchMap(([pubKey, timeUnit]) => this.#apiService.getAssetUtilizationRateRecords(pubKey, new RecordFilter(timeUnit)).pipe(catchError((error) => of([] as Record[])))),
    filter((assetRecords) => assetRecords.length > 0),
    map((assetRecords) => {
      const chartOptions = {...CHART_OPTIONS};
      chartOptions.axisX.valueFormatString = timeUnitFormat(this.#timeUnit$.value);
      chartOptions.data[0].dataPoints = assetRecords.map(record => ({x: new Date(record.timestamp), y: record.value}));
      return chartOptions;
    }),
    delay(500),
    tap(() => this.loadingS.set(false))
  ));
  timeUnitS = toSignal(this.#timeUnit$);
  
  // -----------------------------------------------------------------------------------------------------
  // @ Lifecycle hooks
  // -----------------------------------------------------------------------------------------------------
    
  ngOnInit(): void {
    this.#layoutService.mobile$.pipe(
      skip(1),
      takeUntilDestroyed(this.#destroyRef),
      tap(() => this.loadingS.set(true)),
      delay(500),
      tap(() => this.loadingS.set(false)),
    ).subscribe();
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Public methods
  // -----------------------------------------------------------------------------------------------------

  onDateFilterChange(dateFilter: TimeUnit): void {
    this.#timeUnit$.next(dateFilter);
  }

}

const CHART_OPTIONS = {
  theme: "light2",
  animationEnabled: true,
  zoomEnabled: true,
  backgroundColor: "transparent",
  axisY: {
    labelFontColor: 'white',
    gridColor: 'rgb(17 24 39)',
    gridThickness: 1,
  },
  axisX: {
    labelFontColor: 'white',
    gridColor: 'rgb(17 24 39)',
    gridThickness: 1,
    valueFormatString:  "Y"
  },
  toolTip: {
    backgroundColor: "rgba(168, 189, 235, 0.3)",
    borderColor: "transparent",
    cornerRadius: 8,
    contentFormatter: function(e) {
      const point = e.entries[0];
      const date = new Date(point.dataPoint.x);
      const formattedDate = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      const formattedTime = date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      });
      return `
      <div style="display: flex; flex-direction: column; row-gap: 2px; color: white;">
        <span style="font-size: 11px">${formattedDate}</span>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 12px">${point.dataPoint.y}%</span>
          <span style="font-size: 9px">${formattedTime}</span>
        </div>
      </div>
      `;
    }
  },
  data: [{
    type: "area",
    lineColor: "#0037FF",
    lineThickness: 5,
    color: "#ADBFFF",
    dataPoints: []
  }]
}