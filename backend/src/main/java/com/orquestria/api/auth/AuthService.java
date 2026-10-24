package com.orquestria.api.auth;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Locale;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {
    private static final Logger LOG = LoggerFactory.getLogger(AuthService.class);

    private final AppUserRepository users;
    private final AuthSessionRepository sessions;
    private final PasswordEncoder passwords;
    private final SecureRandom random = new SecureRandom();

    public AuthService(AppUserRepository users, AuthSessionRepository sessions, PasswordEncoder passwords) {
        this.users = users;
        this.sessions = sessions;
        this.passwords = passwords;
    }

    public static String hash(String token) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(token.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (java.security.NoSuchAlgorithmException ex) {
            throw new IllegalStateException(ex);
        }
    }

    @Transactional
    public LoginResponse login(String identifier, String password) {
        String identity = identifier.trim().toLowerCase(Locale.ROOT);
        // E-mail, nome de usuário e guest usam a mesma senha cadastrada.
        // Nunca consultar por nome de exibição: nomes de exibição podem ser repetidos.
        var found = identity.contains("@")
                ? users.findByEmailIgnoreCase(identity)
                : users.findByUsernameIgnoreCase(identity);
        if (found.isEmpty()) {
            // Estes motivos aparecem somente no log do backend, nunca na resposta pública.
            // Não registrar e-mail, senha, hash, token, ID da conta ou corpo da requisição.
            LOG.warn("[Orquestria][auth] login rejeitado motivo=identificador_nao_encontrado");
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Credenciais inválidas");
        }

        AppUser user = found.get();
        if (!passwords.matches(password, user.getPasswordHash())) {
            LOG.warn("[Orquestria][auth] login rejeitado motivo=senha_incorreta tipo_conta={}", user.getAccountType());
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Credenciais inválidas");
        }

        LOG.info("[Orquestria][auth] login autorizado tipo_conta={}", user.getAccountType());
        return createSession(user);
    }

    @Transactional
    public LoginResponse register(String name, String username, String email, String password) {
        String address = email.trim().toLowerCase(Locale.ROOT);
        String handle = username.trim().toLowerCase(Locale.ROOT);
        if (handle.equals("guest")) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Nome de usuário indisponível");
        }
        if (users.existsByEmailIgnoreCase(address)) {
            LOG.info("[Orquestria][auth] cadastro rejeitado motivo=email_ja_cadastrado");
            throw new ResponseStatusException(HttpStatus.CONFLICT, "E-mail ou usuário já cadastrado");
        }
        if (users.existsByUsernameIgnoreCase(handle)) {
            LOG.info("[Orquestria][auth] cadastro rejeitado motivo=usuario_ja_cadastrado");
            throw new ResponseStatusException(HttpStatus.CONFLICT, "E-mail ou usuário já cadastrado");
        }
        AppUser user;
        try {
            // Força a verificação do índice único agora, inclusive com cadastros simultâneos.
            user = users.saveAndFlush(new AppUser(name.trim(), handle, address,
                    passwords.encode(password), AccountType.USER));
        } catch (DataIntegrityViolationException exception) {
            LOG.info("[Orquestria][auth] cadastro rejeitado motivo=identificador_indisponivel");
            throw new ResponseStatusException(HttpStatus.CONFLICT, "E-mail ou usuário já cadastrado");
        }
        LOG.info("[Orquestria][auth] cadastro concluido tipo_conta=USER");
        return createSession(user);
    }

    private LoginResponse createSession(AppUser user) {
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        Instant expires = Instant.now().plus(7, ChronoUnit.DAYS);
        sessions.save(new AuthSession(user, hash(token), expires));
        return new LoginResponse(token, user.getId(), user.getName(), user.getEmail(), user.getAccountType(), expires);
    }

    @Transactional(readOnly = true)
    public AppUser currentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || !(auth.getPrincipal() instanceof String principal)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Faça login novamente");
        }
        try {
            return users.findById(UUID.fromString(principal))
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sessão inválida"));
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sessão inválida");
        }
    }

    @Transactional
    public void logout(String token) {
        if (token != null && !token.isBlank()) {
            sessions.deleteByTokenHash(hash(token));
        }
    }
}
