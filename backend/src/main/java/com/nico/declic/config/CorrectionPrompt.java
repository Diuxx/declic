package com.nico.declic.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Component;
import java.io.IOException;
import java.nio.charset.StandardCharsets;

@Component 
public class CorrectionPrompt {
    
    private final String instructions;

    public CorrectionPrompt(
        @Value("${app.correction.prompt-location}") Resource resource
    ) throws IOException {
        try (var input = resource.getInputStream()) {
            instructions = new String(
                input.readAllBytes(),
                StandardCharsets.UTF_8
            );
        }

        if (instructions.isBlank()) {
            throw new IllegalStateException(
                "Le prompt de correction est vide."
            );
        }
    }

    public String instructions() {
        return instructions;
    }
}
