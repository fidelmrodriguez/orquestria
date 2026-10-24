package com.orquestria.api.auth;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.util.Optional;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

class AuthServiceTest {

    @Test
    void createsDifferentSessionTokensForConcurrentGuestLogins() {
        var users = mock(AppUserRepository.class);
        var sessions = mock(AuthSessionRepository.class);
        var encoder = mock(PasswordEncoder.class);
        var guest = new AppUser("Guest", "guest", GuestBootstrap.GUEST_EMAIL, "encoded", AccountType.GUEST);
        when(users.findByUsernameIgnoreCase("guest")).thenReturn(Optional.of(guest));
        when(encoder.matches("public-password", "encoded")).thenReturn(true);
        when(sessions.save(any(AuthSession.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var service = new AuthService(users, sessions, encoder);
        var first = service.login("guest", "public-password");
        var second = service.login("guest", "public-password");

        assertNotEquals(first.token(), second.token());
        assertEquals(first.id(), second.id());
        assertEquals(AccountType.GUEST, first.accountType());
        assertEquals(64, AuthService.hash(first.token()).length());
        verify(sessions, times(2)).save(any(AuthSession.class));
    }

    @Test
    void newlyRegisteredUserCanLogInAfterRegistration() {
        var users = mock(AppUserRepository.class);
        var sessions = mock(AuthSessionRepository.class);
        var encoder = new BCryptPasswordEncoder();
        var createdUser = new AtomicReference<AppUser>();
        when(users.saveAndFlush(any(AppUser.class))).thenAnswer(invocation -> {
            AppUser user = invocation.getArgument(0);
            createdUser.set(user);
            return user;
        });
        when(users.findByEmailIgnoreCase("teste@exemplo.com"))
                .thenAnswer(invocation -> Optional.ofNullable(createdUser.get()));
        when(users.findByUsernameIgnoreCase("teste"))
                .thenAnswer(invocation -> Optional.ofNullable(createdUser.get()));
        when(sessions.save(any(AuthSession.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var service = new AuthService(users, sessions, encoder);
        var registration = service.register("Teste", "teste", "TESTE@EXEMPLO.COM", "SenhaDeTeste123!");
        var loggedIn = service.login("  TESTE@EXEMPLO.COM ", "SenhaDeTeste123!");
        var usernameLogin = service.login("  TeStE  ", "SenhaDeTeste123!");

        assertEquals(registration.id(), loggedIn.id());
        assertEquals(registration.id(), usernameLogin.id());
        assertEquals(AccountType.USER, loggedIn.accountType());
        assertNotEquals(registration.token(), loggedIn.token());
        assertNotEquals("SenhaDeTeste123!", createdUser.get().getPasswordHash());
        verify(sessions, times(3)).save(any(AuthSession.class));
    }

    @Test
    void returnsSamePublic401ForUnknownAccountAndWrongPassword() {
        var users = mock(AppUserRepository.class);
        var sessions = mock(AuthSessionRepository.class);
        var encoder = new BCryptPasswordEncoder();
        var existing = new AppUser("Teste", "teste", "teste@exemplo.com", encoder.encode("SenhaCorreta123!"), AccountType.USER);
        when(users.findByEmailIgnoreCase("ausente@exemplo.com")).thenReturn(Optional.empty());
        when(users.findByEmailIgnoreCase("teste@exemplo.com")).thenReturn(Optional.of(existing));
        var service = new AuthService(users, sessions, encoder);

        var unknown = assertThrows(ResponseStatusException.class,
                () -> service.login("ausente@exemplo.com", "SenhaCorreta123!"));
        var wrongPassword = assertThrows(ResponseStatusException.class,
                () -> service.login("teste@exemplo.com", "SenhaErrada123!"));

        assertEquals(HttpStatus.UNAUTHORIZED, unknown.getStatusCode());
        assertEquals(HttpStatus.UNAUTHORIZED, wrongPassword.getStatusCode());
        verify(sessions, never()).save(any(AuthSession.class));
    }
    @Test
    void blocksDuplicateUsernameAndReservedGuest() {
        var users = mock(AppUserRepository.class);
        var sessions = mock(AuthSessionRepository.class);
        var service = new AuthService(users, sessions, new BCryptPasswordEncoder());
        when(users.existsByUsernameIgnoreCase("repetido")).thenReturn(true);

        var duplicate = assertThrows(ResponseStatusException.class,
                () -> service.register("Uma Pessoa", "Repetido", "novo@exemplo.com", "SenhaForte123!"));
        var reserved = assertThrows(ResponseStatusException.class,
                () -> service.register("Outra Pessoa", "guest", "outro@exemplo.com", "SenhaForte123!"));
        assertEquals(HttpStatus.CONFLICT, duplicate.getStatusCode());
        assertEquals(HttpStatus.CONFLICT, reserved.getStatusCode());
        verify(users, never()).saveAndFlush(any(AppUser.class));
    }
}
