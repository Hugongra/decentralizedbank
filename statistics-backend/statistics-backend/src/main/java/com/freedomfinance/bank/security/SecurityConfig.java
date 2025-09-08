package com.freedomfinance.bank.security;

import com.freedomfinance.bank.bank.BankDomain;
import com.freedomfinance.bank.borrow.BorrowDomain;
import com.freedomfinance.bank.deposit.DepositDomain;
import com.freedomfinance.bank.log.LogDomain;
import com.freedomfinance.bank.transaction.TransactionDomain;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.util.matcher.RegexRequestMatcher;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final Environment environment;

    @Autowired
    public SecurityConfig(Environment environment) {
        this.environment = environment;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http.csrf(AbstractHttpConfigurer::disable)
                .cors(httpSecurityCorsConfigurer -> httpSecurityCorsConfigurer.configurationSource(corsConfigurationSource()))
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(authorize -> authorize
                    .requestMatchers(new RegexRequestMatcher(BankDomain.path + "/.*", null)).permitAll()
                    .requestMatchers(new RegexRequestMatcher(BorrowDomain.path + "/.*", null)).permitAll()
                    .requestMatchers(new RegexRequestMatcher(DepositDomain.path + "/.*", null)).permitAll()
                    .requestMatchers(new RegexRequestMatcher(LogDomain.path + "/.*", null)).permitAll()
                    .requestMatchers(new RegexRequestMatcher(TransactionDomain.path + "/.*", null)).permitAll()
                    .anyRequest().authenticated()
            )
            .addFilterBefore(AuthenticationFilter(), UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    public XAuthenticationFilter AuthenticationFilter() {
        return new XAuthenticationFilter(this.environment);
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList(environment.getProperty("allowed.cors").split(",")));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE"));
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type", "token"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
