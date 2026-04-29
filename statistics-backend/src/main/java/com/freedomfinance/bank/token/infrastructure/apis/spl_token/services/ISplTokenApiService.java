package com.freedomfinance.bank.token.infrastructure.apis.spl_token.services;

import com.freedomfinance.bank.token.infrastructure.apis.spl_token.models.SplTokenDto;

public interface ISplTokenApiService {
    SplTokenDto fetchTokenData(String mint);

}
