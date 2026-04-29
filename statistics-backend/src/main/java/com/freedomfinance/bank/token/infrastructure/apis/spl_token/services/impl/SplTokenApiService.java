package com.freedomfinance.bank.token.infrastructure.apis.spl_token.services.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.freedomfinance.bank.token.infrastructure.apis.spl_token.models.SplTokenDto;
import com.freedomfinance.bank.token.infrastructure.apis.spl_token.services.ISplTokenApiService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.http.HttpClient;
import java.net.http.HttpResponse;
import java.util.List;

@Service
public class SplTokenApiService implements ISplTokenApiService {

    private final HttpClient HTTP = HttpClient.newHttpClient();
    private final String URL = "https://cdn.jsdelivr.net/gh/solana-labs/token-list@latest/src/tokens/solana.tokenlist.json";
    private final boolean isDev;
    private final String USDC_MINT;
    private final String BTC_MINT;
    private final String ETH_MINT;
    private final String USDT_MINT;
    private final String XRP_MINT;
    private final String ADA_MINT;

    @Autowired
    public SplTokenApiService(Environment environment) {
        isDev = environment.getProperty("environment").equals("dev");
        USDC_MINT = environment.getProperty("USDC_MINT_ADDRESS");
        BTC_MINT = environment.getProperty("BTC_MINT_ADDRESS");
        ETH_MINT = environment.getProperty("ETH_MINT_ADDRESS");
        USDT_MINT = environment.getProperty("USDT_MINT_ADDRESS");
        XRP_MINT = environment.getProperty("XRP_MINT_ADDRESS");
        ADA_MINT = environment.getProperty("ADA_MINT_ADDRESS");
    }

    @Override
    public SplTokenDto fetchTokenData(String mint) {
        var request = java.net.http.HttpRequest.newBuilder()
                .uri(java.net.URI.create(URL))
                .header("Accept", "application/json")
                .build();
        try {
            HttpResponse<String> response = HTTP.send(request, java.net.http.HttpResponse.BodyHandlers.ofString());
            assert response.statusCode() == 200;
            ObjectMapper objectMapper = new ObjectMapper();
            JsonNode rootNode = objectMapper.readTree(response.body());
            JsonNode tokensNode = rootNode.path("tokens");
            List<SplTokenDto> tokens = objectMapper.readValue(tokensNode.toString(), new TypeReference<List<SplTokenDto>>() {});
            return tokens.stream()
                    .filter(token -> token.getAddress().equals(cleanMint(mint)))
                    .findFirst()
                    .orElse(null);
        } catch (IOException | InterruptedException e) {
            throw new RuntimeException(e);
        }
    }

    private String cleanMint(String mint) {
        // This method is used to clean the mint address in case is SOL that by default will be saved as Default mint
        if (mint.equals("11111111111111111111111111111111")) {
            return "So11111111111111111111111111111111111111112";
        }
        if (isDev) {
            if (mint.equals(USDC_MINT)) {
                return "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
            } else if (mint.equals(BTC_MINT)) {
                return "9n4nbM75f5Ui33ZbPYXn59EwSgE8CGsHtAeTH5YFeJ9E";
            } else if (mint.equals(BTC_MINT)) {
                return "9n4nbM75f5Ui33ZbPYXn59EwSgE8CGsHtAeTH5YFeJ9E";
            } else if (mint.equals(ETH_MINT)) {
                return "7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs";
            } else if (mint.equals(USDT_MINT)) {
                return "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB";
            } else if (mint.equals(XRP_MINT)) {
                return "Ga2AXHpfAF6mv2ekZwcsJFqu7wB4NV331qNH7fW9Nst8";
            } else if (mint.equals(ADA_MINT)) {
                return "4U7hSJxbgDoAcQqL2SZpB3hik225ZuG3L33VyrpZD8BA";
            }
        }
        return mint;
    }

}
