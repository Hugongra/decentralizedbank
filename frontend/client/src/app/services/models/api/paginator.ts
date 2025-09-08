export class Paginator {

    page: number;

    size: number;

    sortBy: string;

    sortDirection: SortDirection;

    constructor(page: number, size: number, sortBy: string, sortDirection: SortDirection = SortDirection.DESC) {
        this.page = page;
        this.size = size;
        this.sortBy = sortBy;
        this.sortDirection = sortDirection;
    }

}

enum SortDirection {
    ASC = 'ASC',
    DESC = 'DESC'
}