package com.freedomfinance.bank.bank.application.user_cases.impl;

import com.freedomfinance.bank.bank.application.user_cases.IFindAssetRecords;
import com.freedomfinance.bank.bank.domain.models.IAssetRecord;
import com.freedomfinance.bank.bank.domain.services.IAssetRecordCrudService;
import com.freedomfinance.bank.bank.infrastructure.controller.dtos.response.AssetAprRecordsRto;
import com.freedomfinance.bank.bank.infrastructure.controller.dtos.response.AssetRateRecordsRto;
import com.freedomfinance.bank.common.controller.dtos.RecordFilterDto;
import com.freedomfinance.bank.common.controller.dtos.RecordRto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class FindAssetRecords implements IFindAssetRecords {

    private final IAssetRecordCrudService assetRecordCrudService;

    @Autowired
    public FindAssetRecords(IAssetRecordCrudService assetRecordCrudService) {
        this.assetRecordCrudService = assetRecordCrudService;
    }
    @Override
    public AssetRateRecordsRto rates(String assetPublicKey, RecordFilterDto filter) {
        List<IAssetRecord> assetRecords = assetRecordCrudService.findByDate(assetPublicKey, filter.getTimeUnit());
        return AssetRateRecordsRto.factory(assetRecords);
    }

    @Override
    public AssetAprRecordsRto aprs(String assetPublicKey, RecordFilterDto filter) {
        List<IAssetRecord> assetRecords = assetRecordCrudService.findByDate(assetPublicKey, filter.getTimeUnit());
        return AssetAprRecordsRto.factory(assetRecords);
    }

    @Override
    public List<RecordRto<Double>> utilizationRates(String assetPublicKey, RecordFilterDto filter) {
        List<IAssetRecord> assetRecords = assetRecordCrudService.findByDate(assetPublicKey, filter.getTimeUnit());
        return assetRecords.stream()
                .map(i -> new RecordRto<Double>((i.getBorrowAmount()/i.getDepositAmount()), i.getTimestamp()))
                .toList();
    }

}
