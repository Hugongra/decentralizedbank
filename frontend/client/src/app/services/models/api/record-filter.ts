export class RecordFilter {
    
    timeUnit: TimeUnit;

    constructor(timeUnit: TimeUnit) {
        this.timeUnit = timeUnit;
    }

}

export enum TimeUnit {
    DAYS = 'DAYS',
    MONTHS = 'MONTHS',
    YEARS = 'YEARS'
}

export function timeUnitFormat(timeUnit: TimeUnit): string {
    if (timeUnit === TimeUnit.DAYS) {
        return "hh:mm";
    }
    else if (timeUnit === TimeUnit.MONTHS) {
        return "DD";
    }
    else {
        return "MMM";
    }
}
