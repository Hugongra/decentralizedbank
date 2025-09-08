package com.freedomfinance.bank.bank.application.user_cases;

import com.freedomfinance.bank.bank.infrastructure.controller.dtos.response.AssetAprRecordsRto;
import com.freedomfinance.bank.bank.infrastructure.controller.dtos.response.AssetRateRecordsRto;
import com.freedomfinance.bank.common.controller.dtos.RecordFilterDto;
import com.freedomfinance.bank.common.controller.dtos.RecordRto;

import java.util.List;

public interface IFindAssetRecords {
    AssetRateRecordsRto rates(String assetPublicKey, RecordFilterDto filter);

    AssetAprRecordsRto aprs(String assetPublicKey, RecordFilterDto filter);

    List<RecordRto<Double>> utilizationRates(String assetPublicKey, RecordFilterDto filter);
}
