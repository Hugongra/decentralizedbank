package com.freedomfinance.bank.common.controller.dtos;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

public class PaginatorDto {

    private int page;

    private int size;

    private Sort.Direction sortDirection;

    private String sortBy;

    public int getPage() {
        return page;
    }

    public void setPage(int page) {
        this.page = page;
    }

    public int getSize() {
        return size;
    }

    public void setSize(int size) {
        this.size = size;
    }

    public Sort.Direction getSortDirection() {
        return sortDirection;
    }

    public void setSortDirection(Sort.Direction sortDirection) {
        this.sortDirection = sortDirection;
    }

    public String getSortBy() {
        return sortBy;
    }

    public void setSortBy(String sortBy) {
        this.sortBy = sortBy;
    }

    public Pageable getPageable() {
        Sort sort = getSortDirection().name().equals(Sort.Direction.ASC.name()) ?
                Sort.by(getSortBy()).ascending() :
                Sort.by(getSortBy()).descending();
        return PageRequest.of(getPage(), getSize(), sort);
    }

}
