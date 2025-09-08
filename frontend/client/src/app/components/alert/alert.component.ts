import { BooleanInput, coerceBooleanProperty } from '@angular/cdk/coercion';
import { NgIf } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, HostBinding, inject, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, ViewEncapsulation } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { filter, Subject, takeUntil } from 'rxjs';
import { fadeOutRight } from '../../core/animations/fade';
import { shake } from '../../core/animations/shake';
import { AlertService } from './alert.service';
import { LayoutService } from '../../layout/layout.service';
import { AlertAppearance, AlertType } from './alert.types';

@Component({
    selector       : 'alert',
    templateUrl    : './alert.component.html',
    styleUrls      : ['./alert.component.scss'],
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations     : [shake, fadeOutRight],
    exportAs       : 'kamalaAlert',
    standalone     : true,
    imports        : [NgIf, MatIconModule, MatButtonModule],
})
export class AlertComponent implements OnChanges, OnInit, OnDestroy {

    #alertService = inject(AlertService);
    #latyoutService = inject(LayoutService);
    #changeDetectorRef = inject(ChangeDetectorRef);
    
    /* eslint-disable @typescript-eslint/naming-convention */
    static ngAcceptInputType_dismissible: BooleanInput;
    static ngAcceptInputType_dismissed: BooleanInput;
    static ngAcceptInputType_showIcon: BooleanInput;
    /* eslint-enable @typescript-eslint/naming-convention */

    @Input() id: string = '';
    @Input() appearance: AlertAppearance = 'soft';
    @Input() dismissed: boolean = false;
    @Input() dismissible: boolean = false;
    @Input() name: string = '';
    @Input() showIcon: boolean = true;
    @Input() type: AlertType = 'primary';
    @Output() readonly dismissedChanged: EventEmitter<boolean> = new EventEmitter<boolean>();

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Host binding for component classes
     */
    @HostBinding('class') get classList(): any
    {
        /* eslint-disable @typescript-eslint/naming-convention */
        return {
            'alert-appearance-border' : this.appearance === 'border',
            'alert-appearance-fill'   : this.appearance === 'fill',
            'alert-appearance-outline': this.appearance === 'outline',
            'alert-appearance-soft'   : this.appearance === 'soft',
            'alert-dismissed'         : this.dismissed,
            'alert-dismissible'       : this.dismissible,
            'alert-show-icon'         : this.showIcon,
            'alert-type-primary'      : this.type === 'primary',
            'alert-type-accent'       : this.type === 'accent',
            'alert-type-warn'         : this.type === 'warn',
            'alert-type-basic'        : this.type === 'basic',
            'alert-type-info'         : this.type === 'info',
            'alert-type-success'      : this.type === 'success',
            'alert-type-warning'      : this.type === 'warning',
            'alert-type-error'        : this.type === 'error',
        };
        /* eslint-enable @typescript-eslint/naming-convention */
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    ngOnChanges(changes: SimpleChanges): void {
        // Dismissed
        if ( 'dismissed' in changes )
        {
            // Coerce the value to a boolean
            this.dismissed = coerceBooleanProperty(changes['dismissed'].currentValue);

            // Dismiss/show the alert
            this._toggleDismiss(this.dismissed);
        }

        // Dismissible
        if ( 'dismissible' in changes )
        {
            // Coerce the value to a boolean
            this.dismissible = coerceBooleanProperty(changes['dismissible'].currentValue);
        }

        // Show icon
        if ( 'showIcon' in changes )
        {
            // Coerce the value to a boolean
            this.showIcon = coerceBooleanProperty(changes['showIcon'].currentValue);
        }
    }

    /**
     * On init
     */
    ngOnInit(): void
    {
        // Subscribe to the dismiss calls
        this.#alertService.onDismiss
            .pipe(
                filter(name => this.name === name),
                takeUntil(this._unsubscribeAll),
            )
            .subscribe(() =>
            {
                // Dismiss the alert
                this.dismiss();
            });

        // Subscribe to the show calls
        this.#alertService.onShow
            .pipe(
                filter(name => this.name === name),
                takeUntil(this._unsubscribeAll),
            )
            .subscribe(() =>
            {
                // Show the alert
                this.show();
            });

        setTimeout(() => {
            this.dismiss();
            if (this.id) {
                setTimeout(() => {
                this.#latyoutService.removeAlert(this.id);
                }, 400);
            }
            }, 5000);
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void
    {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    dismiss(): void {
        // Return if the alert is already dismissed
        if ( this.dismissed )
        {
            return;
        }
        // Dismiss the alert
        this._toggleDismiss(true);
        this.#latyoutService.removeAlert(this.id);
    }

    show(): void {
        // Return if the alert is already showing
        if ( !this.dismissed )
        {
            return;
        }

        // Show the alert
        this._toggleDismiss(false);
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Private methods
    // -----------------------------------------------------------------------------------------------------

    private _toggleDismiss(dismissed: boolean): void {
        // Return if the alert is not dismissible
        if ( !this.dismissible )
        {
            return;
        }

        // Set the dismissed
        this.dismissed = dismissed;

        // Execute the observable
        this.dismissedChanged.next(this.dismissed);

        // Notify the change detector
        this.#changeDetectorRef.markForCheck();
    }
}
