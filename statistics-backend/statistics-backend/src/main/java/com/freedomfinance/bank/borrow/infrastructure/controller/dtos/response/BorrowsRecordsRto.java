package com.freedomfinance.bank.borrow.infrastructure.controller.dtos.response;

import com.freedomfinance.bank.borrow.domain.models.IBorrowRecord;
import com.freedomfinance.bank.common.controller.dtos.RecordRto;

import java.util.List;

public record BorrowsRecordsRto(List<RecordRto<Double>> borrowAmounts, List<RecordRto<Double>> borrowValues) {
    public static BorrowsRecordsRto factory(List<IBorrowRecord> records) {

        List<RecordRto<Double>> borrowAmounts = records.stream()
                .map(i -> new RecordRto<Double>(i.getBorrowAmount(), i.getTimestamp()))
                .toList();

        List<RecordRto<Double>> borrowValues = records.stream()
                .map(i -> new RecordRto<Double>(i.getBorrowAmount(), i.getTimestamp()))
                .toList();
        return new BorrowsRecordsRto(borrowAmounts, borrowValues);
    }

}
