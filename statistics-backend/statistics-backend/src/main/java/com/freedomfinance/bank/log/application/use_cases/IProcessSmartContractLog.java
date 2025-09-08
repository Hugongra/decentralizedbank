package com.freedomfinance.bank.log.application.use_cases;

import com.freedomfinance.bank.log.application.exceptions.SmartContractLogNotFoundException;

public interface IProcessSmartContractLog {
    void execute(Long id) throws SmartContractLogNotFoundException;
}
