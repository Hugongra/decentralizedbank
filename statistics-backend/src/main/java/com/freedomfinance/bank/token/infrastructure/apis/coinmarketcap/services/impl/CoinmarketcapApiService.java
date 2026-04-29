package com.freedomfinance.bank.token.infrastructure.apis.coinmarketcap.services.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.freedomfinance.bank.token.infrastructure.apis.coinmarketcap.models.TokenPriceDto;
import com.freedomfinance.bank.token.infrastructure.apis.coinmarketcap.services.ICoinmarketcapApiService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.HttpStatusCodeException;

import java.io.IOException;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.ArrayList;
import java.util.List;

@Service
public class CoinmarketcapApiService implements ICoinmarketcapApiService {

    private final HttpClient HTTP = HttpClient.newHttpClient();
    private final String API_KEY;

    @Autowired
    public CoinmarketcapApiService(Environment environment) {
        API_KEY = environment.getProperty("coinmarketcap.api-key");
    }

    private JsonNode execute(String param) throws HttpServerErrorException {
        var request = HttpRequest.newBuilder()
                .uri(java.net.URI.create("https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=" + param))
                .header("Accept", "application/json")
                .header("X-CMC_PRO_API_KEY", API_KEY)
                .build();
        try {
            HttpResponse<String> response = HTTP.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 200) {
                ObjectMapper objectMapper = new ObjectMapper();
                JsonNode rootNode = objectMapper.readTree(response.body());
                return rootNode.path("data");
            }
            throw new HttpServerErrorException(HttpStatus.INTERNAL_SERVER_ERROR) {};
        } catch (IOException | InterruptedException e) {
            throw new HttpServerErrorException(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    private Double gatherPrice(JsonNode node) {
        return node.path("quote").path("USD").path("price").asDouble();
    }

    @Override
    public Double fetchTokenPrice(String symbol) throws HttpServerErrorException {
        JsonNode dataNode = execute(symbol);
        JsonNode tokenNode = dataNode.path(symbol);
        return gatherPrice(tokenNode);
    }

    @Override
    public List<TokenPriceDto> fetchTokenPrices(List<String> symbols) throws HttpServerErrorException {
        var param = String.format("%s", String.join(",", symbols));
        List<TokenPriceDto> prices = new ArrayList<>();
        JsonNode dataNode = execute(param);
        for (String symbol : symbols) {
            JsonNode tokenNode = dataNode.path(symbol);
            Double price = gatherPrice(tokenNode);
            prices.add(new TokenPriceDto(symbol, price));
        }
        return prices;
    }

}
