package com.freedomfinance.bank.bank.domain.services;

import com.freedomfinance.bank.bank.domain.models.IAssetRecord;

import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.List;

public interface IAssetRecordCrudService {

    IAssetRecord getLast(String assetPublicKey);

    List<IAssetRecord> findByDate(String assetPublicKey, ChronoUnit unit);

    IAssetRecord save(IAssetRecord record);

}
