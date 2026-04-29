package com.freedomfinance.bank.log.infrastructure.controller;

import com.freedomfinance.bank.common.application.exceptions.XException;
import com.freedomfinance.bank.log.LogDomain;
import com.freedomfinance.bank.log.application.LogsHandler;
import com.freedomfinance.bank.log.infrastructure.controller.dtos.SmartContractDto;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

@Controller
@RequestMapping(LogDomain.path)
public class LogsController {

    private final LogsHandler handler;

    @Autowired
    public LogsController(LogsHandler handler) {
        this.handler = handler;
    }

    @GetMapping(LogDomain.role.ADMIN + LogDomain.endpoint.SMART_CONTRACT)
    @CrossOrigin(methods = {RequestMethod.GET})
    public ResponseEntity<?> getLastSmartContract() {
        return ResponseEntity.ok(handler.getLast());
    }

    @GetMapping(LogDomain.role.ADMIN + LogDomain.endpoint.SMART_CONTRACT + LogDomain.pathParam.LIST)
    @CrossOrigin(methods = {RequestMethod.GET})
    public ResponseEntity<?> getSmartContractUnprocessedLogs() {
        return ResponseEntity.ok(handler.getSmartContractUnprocessedLogs());
    }

    @PostMapping(LogDomain.role.ADMIN + LogDomain.endpoint.SMART_CONTRACT)
    @CrossOrigin(methods = {RequestMethod.POST})
    public ResponseEntity<?> createSmartContactLog(@RequestBody @Valid SmartContractDto smartContractDto) {
        try {
            handler.createSmartContractLog(smartContractDto);
            return new ResponseEntity<>(HttpStatus.OK);
        } catch (XException e) {
            return new ResponseEntity<>(e.getHttpStatus());
        }
    }

    @PutMapping (LogDomain.role.ADMIN + LogDomain.endpoint.SMART_CONTRACT)
    @CrossOrigin(methods = {RequestMethod.PUT})
    public ResponseEntity<?> processSmartContactLog(@RequestParam @NotNull Long logId) {
        try {
            handler.processSmartContractLog(logId);
            return new ResponseEntity<>(HttpStatus.OK);
        } catch (XException e) {
            return new ResponseEntity<>(e.getHttpStatus());
        }
    }

}
