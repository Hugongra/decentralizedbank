package com.freedomfinance.bank.bank.infrastructure.controller.dtos.response;

import com.freedomfinance.bank.bank.domain.models.IAssetRecord;
import com.freedomfinance.bank.common.controller.dtos.RecordRto;

import java.util.List;

public record AssetRateRecordsRto(List<RecordRto<Double>> depositGlobalRates, List<RecordRto<Double>> borrowGlobalRates) {
    public static AssetRateRecordsRto factory(List<IAssetRecord> assetRecords) {

        List<RecordRto<Double>> depositGlobalRates = assetRecords.stream()
                .map(i -> new RecordRto<Double>(i.getDepositGlobalRate(), i.getTimestamp()))
                .toList();

        List<RecordRto<Double>> borrowGlobalRates = assetRecords.stream()
                .map(i -> new RecordRto<Double>(i.getBorrowGlobalRate(), i.getTimestamp()))
                .toList();
        return new AssetRateRecordsRto(depositGlobalRates, borrowGlobalRates);
    }
}
