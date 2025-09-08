package com.freedomfinance.bank.bank.infrastructure.controller;

import com.freedomfinance.bank.bank.BankDomain;
import com.freedomfinance.bank.bank.application.user_cases.*;
import com.freedomfinance.bank.bank.infrastructure.controller.dtos.request.CreateAssetDto;
import com.freedomfinance.bank.bank.infrastructure.controller.dtos.request.CreateBankDto;
import com.freedomfinance.bank.common.application.exceptions.XException;
import com.freedomfinance.bank.common.controller.dtos.RecordFilterDto;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping(BankDomain.path)
public class BankController {

    private final ICreateBank createBank;
    private final IGetBankAssets getBankAssets;
    private final IGetTokenPriceRecords getTokenPriceRecords;
    private final ICreateAsset createAsset;
    private final IAddAssetRecord addAssetRecord;
    private final IFindAssetRecords findAssetRecords;

    @Autowired
    public BankController(
            ICreateBank createBank,
            IGetBankAssets getBankAssets,
            IGetTokenPriceRecords getTokenPriceRecords,
            ICreateAsset createAsset,
            IAddAssetRecord addAssetRecord,
            IFindAssetRecords findAssetRecords) {
        this.createBank = createBank;
        this.getBankAssets = getBankAssets;
        this.getTokenPriceRecords = getTokenPriceRecords;
        this.createAsset = createAsset;
        this.addAssetRecord = addAssetRecord;
        this.findAssetRecords = findAssetRecords;
    }

    @PostMapping(BankDomain.role.ADMIN)
    @CrossOrigin(methods = {RequestMethod.POST})
    public ResponseEntity<?> createBank(@RequestParam @NotNull Long logId, @RequestBody @Valid CreateBankDto bankDto) {
        try {
            createBank.execute(logId, bankDto);
            return new ResponseEntity<>(HttpStatus.OK);
        } catch (XException e) {
            return new ResponseEntity<>(e.getHttpStatus());
        }
    }

    @GetMapping(BankDomain.role.PRIVATE + BankDomain.pathParam.BANK_PUBLIC_KEY + BankDomain.endpoint.ASSET + BankDomain.pathParam.LIST)
    @CrossOrigin(methods = {RequestMethod.GET})
    public ResponseEntity<?> getBankAssets(@PathVariable @NotBlank String bankPublicKey) {
        try {
            return new ResponseEntity<>(getBankAssets.execute(bankPublicKey), HttpStatus.OK);
        } catch (XException e) {
            return new ResponseEntity<>(e.getHttpStatus());
        }
    }

    @GetMapping(BankDomain.role.PRIVATE + BankDomain.pathParam.BANK_PUBLIC_KEY + BankDomain.endpoint.TOKEN + BankDomain.pathParam.RECORD + BankDomain.pathParam.LIST)
    @CrossOrigin(methods = {RequestMethod.GET})
    public ResponseEntity<?> getTokenPriceRecords(@PathVariable @NotBlank String bankPublicKey) {
        try {
            return new ResponseEntity<>(getTokenPriceRecords.execute(bankPublicKey), HttpStatus.OK);
        } catch (XException e) {
            return new ResponseEntity<>(e.getHttpStatus());
        }
    }

    @PutMapping(BankDomain.role.PRIVATE + BankDomain.endpoint.ASSET + BankDomain.pathParam.ASSET_PUBLIC_KEY + BankDomain.pathParam.RECORD + ":rate" + BankDomain.pathParam.FIND)
    @CrossOrigin(methods = {RequestMethod.PUT})
    public ResponseEntity<?> findAssetRateRecords(
            @PathVariable @NotBlank String assetPublicKey,
            @RequestBody @Valid RecordFilterDto filter) {
        return new ResponseEntity<>(findAssetRecords.rates(assetPublicKey, filter), HttpStatus.OK);
    }

    @PutMapping(BankDomain.role.PRIVATE + BankDomain.endpoint.ASSET + BankDomain.pathParam.ASSET_PUBLIC_KEY + BankDomain.pathParam.RECORD + ":utilizationRate" + BankDomain.pathParam.FIND)
    @CrossOrigin(methods = {RequestMethod.PUT})
    public ResponseEntity<?> findAssetUtilizationRatesRecords(
            @PathVariable @NotBlank String assetPublicKey,
            @RequestBody @Valid RecordFilterDto filter) {
        return new ResponseEntity<>(findAssetRecords.utilizationRates(assetPublicKey, filter), HttpStatus.OK);
    }

    @PutMapping(BankDomain.role.PRIVATE + BankDomain.endpoint.ASSET + BankDomain.pathParam.ASSET_PUBLIC_KEY + BankDomain.pathParam.RECORD + ":apr" + BankDomain.pathParam.FIND)
    @CrossOrigin(methods = {RequestMethod.PUT})
    public ResponseEntity<?> findAssetAprRecords(
            @PathVariable @NotBlank String assetPublicKey,
            @RequestBody @Valid RecordFilterDto filter) {
        return new ResponseEntity<>(findAssetRecords.aprs(assetPublicKey, filter), HttpStatus.OK);
    }

    @PostMapping(BankDomain.role.ADMIN + BankDomain.endpoint.ASSET)
    @CrossOrigin(methods = {RequestMethod.POST})
    public ResponseEntity<?> createAsset(@RequestParam @NotNull Long logId, @RequestBody @Valid CreateAssetDto createAssetDto) {
        try {
            createAsset.execute(logId, createAssetDto);
            return new ResponseEntity<>(HttpStatus.OK);
        } catch (XException e) {
            System.out.println(e.getMessage());
            return new ResponseEntity<>(e.getHttpStatus());
        }
    }

    @PostMapping(BankDomain.role.ADMIN + BankDomain.endpoint.ASSET + BankDomain.pathParam.RECORD)
    @CrossOrigin(methods = {RequestMethod.POST})
    public ResponseEntity<?> addAssetRecord(
            @RequestBody @Valid CreateAssetDto createAssetDto) {
        try {
            addAssetRecord.execute(createAssetDto);
            return new ResponseEntity<>(HttpStatus.OK);
        } catch (XException e) {
            System.out.println(e.getMessage());
            return new ResponseEntity<>(e.getHttpStatus());
        }
    }

}
