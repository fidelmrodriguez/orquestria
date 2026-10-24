package com.orquestria.api.auth;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;

class AuthServiceTest {
    @Test
    void createsDifferentSessionTokensForConcurrentGuestLogins() {
        var users=mock(AppUserRepository.class);
        var sessions=mock(AuthSessionRepository.class);
        var encoder=mock(PasswordEncoder.class);
        var guest=new AppUser("Guest", GuestBootstrap.GUEST_EMAIL,"encoded",AccountType.GUEST);
        when(users.findByEmailIgnoreCase(GuestBootstrap.GUEST_EMAIL)).thenReturn(Optional.of(guest));
        when(encoder.matches("public-password","encoded")).thenReturn(true);
        when(sessions.save(any(AuthSession.class))).thenAnswer(invocation->invocation.getArgument(0));
        var service=new AuthService(users,sessions,encoder);
        var first=service.login("guest","public-password");
        var second=service.login("guest","public-password");
        assertNotEquals(first.token(),second.token());
        assertEquals(first.id(),second.id());
        assertEquals(AccountType.GUEST,first.accountType());
        assertEquals(64,AuthService.hash(first.token()).length());
        verify(sessions,times(2)).save(any(AuthSession.class));
    }
}
