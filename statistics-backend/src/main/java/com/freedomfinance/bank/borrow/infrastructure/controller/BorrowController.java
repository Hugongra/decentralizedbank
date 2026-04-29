package com.freedomfinance.bank.borrow.infrastructure.controller;

import com.freedomfinance.bank.borrow.BorrowDomain;
import com.freedomfinance.bank.borrow.application.use_cases.IAddBorrowRecord;
import com.freedomfinance.bank.borrow.application.use_cases.IFindBorrowRecords;
import com.freedomfinance.bank.borrow.application.use_cases.IGetUserBorrows;
import com.freedomfinance.bank.borrow.infrastructure.controller.dtos.request.BorrowRecordDto;
import com.freedomfinance.bank.common.application.exceptions.XException;
import com.freedomfinance.bank.common.controller.dtos.RecordFilterDto;
import com.freedomfinance.bank.deposit.DepositDomain;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

@Controller
@RequestMapping(BorrowDomain.path)
public class BorrowController {
    private final IAddBorrowRecord addBorrowRecord;
    private final IGetUserBorrows getUserBorrows;
    private final IFindBorrowRecords findBorrowRecords;

    @Autowired
    public BorrowController(
            IAddBorrowRecord addBorrowRecord,
            IGetUserBorrows getUserBorrows,
            IFindBorrowRecords findBorrowRecords) {
        this.addBorrowRecord = addBorrowRecord;
        this.getUserBorrows = getUserBorrows;
        this.findBorrowRecords = findBorrowRecords;
    }

    @GetMapping(DepositDomain.role.PRIVATE + DepositDomain.pathParam.BANK_PUBLIC_KEY + DepositDomain.pathParam.USER_PUBLIC_KEY + DepositDomain.pathParam.LIST)
    @CrossOrigin(methods = {RequestMethod.GET})
    public ResponseEntity<?> getUserDeposits(@PathVariable @NotBlank String bankPublicKey, @PathVariable @NotBlank String userPublicKey) {
        return new ResponseEntity<>(getUserBorrows.execute(bankPublicKey, userPublicKey), HttpStatus.OK);
    }

    @PutMapping(BorrowDomain.role.PRIVATE + BorrowDomain.pathParam.BORROW_PUBLIC_KEY + BorrowDomain.pathParam.RECORD + BorrowDomain.pathParam.FIND)
    @CrossOrigin(methods = {RequestMethod.PUT})
    public ResponseEntity<?> findBorrowRecords(
            @PathVariable @NotBlank String borrowPublicKey,
            @RequestBody @Valid RecordFilterDto filter) {
        return new ResponseEntity<>(findBorrowRecords.execute(borrowPublicKey, filter), HttpStatus.OK);
    }

    @PostMapping(BorrowDomain.role.ADMIN + BorrowDomain.pathParam.RECORD)
    @CrossOrigin(methods = {RequestMethod.POST})
    public ResponseEntity<?> addBorrowRecord(@RequestParam @NotNull Long logId, @RequestBody @Valid BorrowRecordDto borrowRecordDto) {
        try {
            addBorrowRecord.execute(logId, borrowRecordDto);
            return new ResponseEntity<>(HttpStatus.OK);
        } catch (XException e) {
            System.out.println(e.getMessage());
            return new ResponseEntity<>(e.getHttpStatus());
        }
    }

}
