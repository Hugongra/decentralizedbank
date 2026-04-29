package com.freedomfinance.bank.token.infrastructure.apis.coinmarketcap.services;

import com.freedomfinance.bank.token.infrastructure.apis.coinmarketcap.models.TokenPriceDto;
import org.springframework.web.client.HttpServerErrorException;

import java.util.List;

public interface ICoinmarketcapApiService {

    Double fetchTokenPrice(String symbol) throws HttpServerErrorException;
    List<TokenPriceDto> fetchTokenPrices(List<String> symbols) throws HttpServerErrorException;

}
