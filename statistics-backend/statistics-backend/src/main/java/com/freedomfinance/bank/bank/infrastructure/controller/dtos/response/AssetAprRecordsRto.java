package com.freedomfinance.bank.bank.infrastructure.controller.dtos.response;

import com.freedomfinance.bank.bank.domain.models.IAssetRecord;
import com.freedomfinance.bank.common.controller.dtos.RecordRto;

import java.util.List;

public record AssetAprRecordsRto(List<RecordRto<Short>> depositAprs, List<RecordRto<Short>> borrowAprs) {
    public static AssetAprRecordsRto factory(List<IAssetRecord> assetRecords) {

        List<RecordRto<Short>> depositAprs = assetRecords.stream()
                .map(i -> new RecordRto<Short>(i.getDepositApr(), i.getTimestamp()))
                .toList();

        List<RecordRto<Short>> borrowAprs = assetRecords.stream()
                .map(i -> new RecordRto<Short>(i.getBorrowApr(), i.getTimestamp()))
                .toList();
        return new AssetAprRecordsRto(depositAprs, borrowAprs);
    }
}
