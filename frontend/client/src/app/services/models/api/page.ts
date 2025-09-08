export interface Page<T> {
    
    content: T[];
    
    totalElements: number;

    last: boolean;

    size: number;

    number: number;
    
    totalPages: number;
}