export type DateFilter = 'DAY' | 'WEEK' | 'MONTH' | 'YEAR';

export type SortType = 'ASC' | 'DESC';

export const ONE_DAY = new Date().getTime() - (24 * 60 * 60 * 1000);
export const ONE_WEEK = new Date().getTime() - (7 * 24 * 60 * 60 * 1000);
export const ONE_MONTH = new Date().getTime() - (30 * 24 * 60 * 60 * 1000);
export const ONE_YEAR = new Date().getTime() - (365 * 24 * 60 * 60 * 1000);

export function dateFilterToTimestamp(dateFilter: DateFilter): number {
    switch (dateFilter) {
        case 'DAY':
        return ONE_DAY;
        case 'WEEK':
        return ONE_WEEK;
        case 'MONTH':
        return ONE_MONTH;
        case 'YEAR':
        return ONE_YEAR;
    }
}

export function getRandomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}