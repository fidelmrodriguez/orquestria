package com.orquestria.api.common;

import java.net.URI;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Destino de navegação do navegador que desperta o container no Blitz.
 * Assim que o Java responde, devolve o usuário à interface Netlify.
 * A URL de retorno é fixa para impedir open redirects.
 */
@RestController
public class BrowserWakeController {
    @GetMapping("/api/public/wake")
    public ResponseEntity<Void> wakeAndReturn() {
        return ResponseEntity.status(HttpStatus.FOUND)
            .location(URI.create("https://orquestria.netlify.app/?api-wake=1"))
            .build();
    }
}
