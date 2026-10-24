package com.orquestria.api.auth;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api/auth")
public class AuthController {
    private final AuthService service;
    public AuthController(AuthService service){this.service=service;}
    @PostMapping("/login") public LoginResponse login(@Valid @RequestBody LoginRequest req){
        return service.login(req.identifier(),req.password());
    }
    @PostMapping("/register") public LoginResponse register(@Valid @RequestBody RegisterRequest req){
        return service.register(req.name(),req.email(),req.password());
    }
    @GetMapping("/me") public UserResponse me(){
        AppUser user=service.currentUser();
        return new UserResponse(user.getId(),user.getName(),user.getEmail(),user.getAccountType());
    }
    @PostMapping("/logout") public void logout(@RequestHeader(value="Authorization",required=false) String auth){
        if(auth!=null&&auth.startsWith("Bearer "))service.logout(auth.substring(7));
    }
    public record UserResponse(java.util.UUID id,String name,String email,AccountType accountType) {}
}
