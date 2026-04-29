package com.freedomfinance.bank.token.infrastructure.schedules;

import com.freedomfinance.bank.token.application.use_cases.IAddTokenPriceRecord;
import com.freedomfinance.bank.token.domain.models.IToken;
import com.freedomfinance.bank.token.domain.services.ITokenCrudService;
import com.freedomfinance.bank.token.infrastructure.apis.coinmarketcap.models.TokenPriceDto;
import com.freedomfinance.bank.token.infrastructure.apis.coinmarketcap.services.impl.CoinmarketcapApiService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class TokenPriceSchedule {

    private final ITokenCrudService tokenCrudService;
    private final IAddTokenPriceRecord addTokenPriceRecord;
    private final CoinmarketcapApiService coinmarketcapApiService;

    @Autowired
    public TokenPriceSchedule(
            ITokenCrudService tokenCrudService,
            IAddTokenPriceRecord addTokenPriceRecord,
            CoinmarketcapApiService coinmarketcapApiService) {
        this.tokenCrudService = tokenCrudService;
        this.addTokenPriceRecord = addTokenPriceRecord;
        this.coinmarketcapApiService = coinmarketcapApiService;
    }

    @Scheduled(fixedRate = 300000)
    public void reportCurrentTime() {
        try {
            List<IToken> tokens = tokenCrudService.getAll();
            if (!tokens.isEmpty()) {
                List<TokenPriceDto> tokenPriceDtos = coinmarketcapApiService.fetchTokenPrices(tokens.stream().map(IToken::getSymbol).toList());
                for(IToken token : tokens) {
                    tokenPriceDtos.stream()
                            .filter(t -> t.getSymbol().equals(token.getSymbol()))
                            .findFirst()
                            .ifPresent(tokenPriceDto -> addTokenPriceRecord.execute(token, tokenPriceDto.getPrice()));
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
