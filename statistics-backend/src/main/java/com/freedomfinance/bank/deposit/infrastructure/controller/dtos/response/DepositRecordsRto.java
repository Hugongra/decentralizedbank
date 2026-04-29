package com.freedomfinance.bank.deposit.infrastructure.controller.dtos.response;

import com.freedomfinance.bank.common.controller.dtos.RecordRto;
import com.freedomfinance.bank.deposit.domain.models.IDepositRecord;

import java.util.List;

public record DepositRecordsRto(List<RecordRto<Double>> depositAmounts, List<RecordRto<Double>> depositValues) {
    public static DepositRecordsRto factory(List<IDepositRecord> records) {

        List<RecordRto<Double>> depositAmounts = records.stream()
                .map(i -> new RecordRto<Double>(i.getDepositAmount(), i.getTimestamp()))
                .toList();

        List<RecordRto<Double>> depositValues = records.stream()
                .map(i -> new RecordRto<Double>(i.getDepositValue(), i.getTimestamp()))
                .toList();
        return new DepositRecordsRto(depositAmounts, depositValues);
    }

}
