package com.freedomfinance.bank.security;

import com.freedomfinance.bank.common.controller.constants.XDomain;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Objects;

@Component
public class XAuthenticationFilter extends OncePerRequestFilter {

    private final String ADMIN_PASSWORD;

    @Autowired
    public XAuthenticationFilter(Environment environment) {
        this.ADMIN_PASSWORD = environment.getProperty("admin.password");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String scope = "/" + request.getRequestURI().split("/")[5];
        if (scope.isBlank()) {
            response.setStatus(HttpServletResponse.SC_NOT_FOUND);
            return;
        } else if (scope.equals(XDomain.role.PUBLIC)) {
            chain.doFilter(request, response);
            return;
        } else {
            if (scope.equals(XDomain.role.PRIVATE)) {
                // TODO: Implement authentication for private endpoints
            } else {
                String token = request.getHeader("token");
                String remoteAddr = request.getRemoteAddr();
                if (!"127.0.0.1".equals(remoteAddr) && !"0:0:0:0:0:0:0:1".equals(remoteAddr)) {
                    response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                    return;
                }
                if (!Objects.equals(token, ADMIN_PASSWORD)) {
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    return;
                }
            }
        }
        try {
            chain.doFilter(request, response);
        } finally {
            SecurityContextHolder.clearContext();
        }
    }

}
