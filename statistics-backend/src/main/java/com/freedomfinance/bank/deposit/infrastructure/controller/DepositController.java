package com.freedomfinance.bank.deposit.infrastructure.controller;

import com.freedomfinance.bank.common.application.exceptions.XException;
import com.freedomfinance.bank.common.controller.dtos.RecordFilterDto;
import com.freedomfinance.bank.deposit.DepositDomain;
import com.freedomfinance.bank.deposit.application.use_cases.IAddDepositRecord;
import com.freedomfinance.bank.deposit.application.use_cases.ICreateDeposit;
import com.freedomfinance.bank.deposit.application.use_cases.IFindDepositRecords;
import com.freedomfinance.bank.deposit.application.use_cases.IGetUserDeposits;
import com.freedomfinance.bank.deposit.infrastructure.controller.dtos.request.AddDepositRecordDto;
import com.freedomfinance.bank.deposit.infrastructure.controller.dtos.request.CreateDepositDto;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

@Controller
@RequestMapping(DepositDomain.path)
public class DepositController {

    private final IGetUserDeposits getUserDeposits;
    private final ICreateDeposit createDeposit;
    private final IAddDepositRecord addDepositRecord;
    private final IFindDepositRecords findDepositRecords;

    @Autowired
    public DepositController(
            IGetUserDeposits getUserDeposits,
            ICreateDeposit createDeposit,
            IAddDepositRecord addDepositRecord,
            IFindDepositRecords findDepositRecords) {
        this.getUserDeposits = getUserDeposits;
        this.createDeposit = createDeposit;
        this.addDepositRecord = addDepositRecord;
        this.findDepositRecords = findDepositRecords;
    }

    @GetMapping(DepositDomain.role.PRIVATE + DepositDomain.pathParam.BANK_PUBLIC_KEY + DepositDomain.pathParam.USER_PUBLIC_KEY + DepositDomain.pathParam.LIST)
    @CrossOrigin(methods = {RequestMethod.GET})
    public ResponseEntity<?> getUserDeposits(@PathVariable @NotBlank String bankPublicKey, @PathVariable @NotBlank String userPublicKey) {
        return new ResponseEntity<>(getUserDeposits.execute(bankPublicKey, userPublicKey), HttpStatus.OK);
    }

    @PutMapping(DepositDomain.role.PRIVATE + DepositDomain.pathParam.DEPOSIT_PUBLIC_KEY + DepositDomain.pathParam.RECORD + DepositDomain.pathParam.FIND)
    @CrossOrigin(methods = {RequestMethod.PUT})
    public ResponseEntity<?> findDepositRecords(
            @PathVariable @NotBlank String depositPublicKey,
            @RequestBody @Valid RecordFilterDto filter) {
        return new ResponseEntity<>(findDepositRecords.execute(depositPublicKey, filter), HttpStatus.OK);
    }

    @PostMapping(DepositDomain.role.ADMIN)
    @CrossOrigin(methods = {RequestMethod.POST})
    public ResponseEntity<?> createDeposit(@RequestParam @NotNull Long logId, @RequestBody @Valid CreateDepositDto createDepositDto) {
        try {
            createDeposit.execute(logId, createDepositDto);
            return new ResponseEntity<>(HttpStatus.OK);
        } catch (XException e) {
            System.out.println(e.getMessage());
            return new ResponseEntity<>(e.getHttpStatus());
        }
    }

    @PostMapping(DepositDomain.role.ADMIN + DepositDomain.pathParam.RECORD)
    @CrossOrigin(methods = {RequestMethod.POST})
    public ResponseEntity<?> addDepositRecord(@RequestParam @NotNull Long logId, @RequestBody @Valid AddDepositRecordDto addDepositRecordDto) {
        try {
            addDepositRecord.execute(logId, addDepositRecordDto);
            return new ResponseEntity<>(HttpStatus.OK);
        } catch (XException e) {
            System.out.println(e.getMessage());
            return new ResponseEntity<>(e.getHttpStatus());
        }
    }

}
