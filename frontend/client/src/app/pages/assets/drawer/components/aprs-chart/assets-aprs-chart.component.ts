import { Component, DestroyRef, inject, Input, OnInit, signal } from '@angular/core';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { BehaviorSubject, catchError, combineLatest, delay, filter, map, of, skip, switchMap, tap } from 'rxjs';
import { PublicKey } from '@solana/web3.js';
import { CanvasJSAngularChartsModule } from '@canvasjs/angular-charts';
import { ApiService } from '../../../../../services/api.service';
import { LayoutService } from '../../../../../layout/layout.service';
import { DateFilterComponent } from '../../../../../components/date-filter/date-filter.component';
import { RecordFilter, TimeUnit, timeUnitFormat } from '../../../../../services/models/api/record-filter';


@Component({
  selector: 'assets-aprs-chart',
  templateUrl: './assets-aprs-chart.component.html',
  styles: `:host {
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
export class AssetsAprsChartComponent implements OnInit {

  @Input({required: true}) set pubKey(value: PublicKey) {
    this.#publicKey$.next(value.toBase58());
  }

  #destroyRef = inject(DestroyRef);
  #layoutService = inject(LayoutService);
  #apiService = inject(ApiService);

  #publicKey$ = new BehaviorSubject<string>('');
  #timeUnit$ = new BehaviorSubject<TimeUnit>(TimeUnit.DAYS);

  loadingS = signal(true);
  chartOptionsS = toSignal(combineLatest([
    this.#publicKey$,
    this.#timeUnit$
  ]).pipe(
    filter(([publicKey, _timeUnit]) => publicKey !== ''),
    takeUntilDestroyed(this.#destroyRef),
    tap(() => this.loadingS.set(true)),
    takeUntilDestroyed(this.#destroyRef),
    switchMap(([pubKey, timeUnit]) => this.#apiService.getAssetAprRecords(pubKey, new RecordFilter(timeUnit)).pipe(catchError((error) => of(null)))),
    filter((assetRecords) => assetRecords !== null),
    map((assetRecords) => {
      console.log(assetRecords);
      console.log(assetRecords.depositAprs.map(record => ({x: new Date(record.timestamp), y: record.value})));
      const chartOptions = {...CHART_OPTIONS};
      chartOptions.axisX.valueFormatString = timeUnitFormat(this.#timeUnit$.value);
      chartOptions.data[0].dataPoints = assetRecords.depositAprs.map(record => ({x: new Date(record.timestamp), y: record.value}));
      chartOptions.data[1].dataPoints = assetRecords.borrowAprs.map(record => ({x: new Date(record.timestamp), y: record.value}));
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
  data: [
    {
      type: "line",
      lineColor: "rgb(22 163 74)",
      color: "rgb(22 163 74)",
      lineThickness: 5,
      markerSize: 0,
      dataPoints: []
    },
    {
      type: "line",
      lineColor: "rgb(220 38 38)",
      color: "rgb(220 38 38)",
      markerSize: 0,
      lineThickness: 5,
      dataPoints: []
    },
  ]
}