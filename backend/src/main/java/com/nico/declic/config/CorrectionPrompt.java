package com.nico.declic.config;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
public class CorrectionPrompt {

    private final String instructions;

    public CorrectionPrompt(
        @Value("${app.correction.prompt-location:}") String configuredLocation,
        ResourceLoader resourceLoader
    ) throws IOException {
        List<String> candidates = new ArrayList<>();

        if (StringUtils.hasText(configuredLocation)) {
            candidates.add(configuredLocation);
        }

        candidates.add("file:./config/prompts/correction.txt");
        candidates.add("file:./backend/config/prompts/correction.txt");
        candidates.add("classpath:/config/prompts/correction.txt");
        candidates.add("classpath:config/prompts/correction.txt");

        Resource resource = null;
        for (String candidate : candidates) {
            Resource candidateResource = resourceLoader.getResource(candidate);
            if (candidateResource.exists()) {
                resource = candidateResource;
                break;
            }
        }

        if (resource == null) {
            throw new IllegalStateException(
                "Le fichier de prompt de correction est introuvable. Chemins testés : " + candidates
            );
        }

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
