package com.orquestria.api.auth;
import jakarta.persistence.EntityManager;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
@Component
public class GuestBootstrap implements ApplicationRunner {
    public static final String GUEST_EMAIL="guest@orquestria.demo";
    private final AppUserRepository users;private final PasswordEncoder encoder;private final EntityManager em;
    private final String guestPassword;
    public GuestBootstrap(AppUserRepository users, PasswordEncoder encoder, EntityManager em,
         @Value("${APP_GUEST_PASSWORD:OrquestriaDemo2026!}") String guestPassword){
        this.users=users;this.encoder=encoder;this.em=em;this.guestPassword=guestPassword;
    }
    @Override @Transactional public void run(ApplicationArguments args) {
        // O guest só é criado se estiver ausente; seu identificador jamais muda.
        AppUser guest=users.findByAccountType(AccountType.GUEST).orElseGet(()->
            users.saveAndFlush(new AppUser("Guest",GUEST_EMAIL,encoder.encode(guestPassword),AccountType.GUEST)));
        // Backfill seguro: os registros pré-autenticação são transferidos para o ambiente de demonstração.
        em.createNativeQuery("UPDATE workspaces SET owner_id=:id WHERE owner_id IS NULL")
          .setParameter("id",guest.getId()).executeUpdate();
        em.createNativeQuery("UPDATE projects SET owner_id=:id WHERE owner_id IS NULL")
          .setParameter("id",guest.getId()).executeUpdate();
    }
}
