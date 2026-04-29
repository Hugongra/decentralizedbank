package com.freedomfinance.bank.transaction.infrastructure.controller;

import com.freedomfinance.bank.borrow.BorrowDomain;
import com.freedomfinance.bank.transaction.TransactionDomain;
import com.freedomfinance.bank.transaction.application.use_cases.IFindUserTransactions;
import com.freedomfinance.bank.transaction.infrastructure.controller.dtos.request.TransactionFilterDto;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

@Controller
@RequestMapping(TransactionDomain.path)
public class TransactionController {
    private final IFindUserTransactions findUserTransactions;

    @Autowired
    public TransactionController(IFindUserTransactions findUserTransactions) {
        this.findUserTransactions = findUserTransactions;
    }

    @PutMapping(BorrowDomain.role.PRIVATE + BorrowDomain.pathParam.FIND)
    @CrossOrigin(methods = {RequestMethod.PUT})
    public ResponseEntity<?> addBorrowRecord(@RequestBody @Valid TransactionFilterDto filter) {
        return new ResponseEntity<>(findUserTransactions.execute(filter), HttpStatus.OK);
    }

}
