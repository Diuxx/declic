package com.nico.declic.providers.adapters;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nico.declic.config.CorrectionPrompt;
import com.nico.declic.dtos.CorrectionChange;
import com.nico.declic.dtos.CorrectionResult;
import com.nico.declic.dtos.UserQuery;
import com.nico.declic.providers.CorrectionProvider;
import com.nico.declic.providers.payloads.OpenAiCorrectionPayload;

public class OllamaAdapter implements CorrectionProvider {

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;
    private final CorrectionPrompt prompt;
    private final String baseUrl;
    private final String model;
    private final Duration readTimeout;

    public OllamaAdapter(
        CorrectionPrompt prompt,
        ObjectMapper objectMapper,
        @Value("${app.ai.ollama.base-url}") String baseUrl,
        @Value("${app.ai.ollama.model}") String model,
        @Value("${app.ai.connect-timeout}") Duration connectTimeout,
        @Value("${app.ai.read-timeout}") Duration readTimeout
    ) {
        if (model == null || model.isBlank()) {
            throw new IllegalStateException(
                "Ollama model is missing. Please set 'app.ai.ollama.model' in your application properties."
            );
        }

        this.prompt = prompt;
        this.objectMapper = objectMapper;
        this.baseUrl = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
        this.model = model;
        this.readTimeout = readTimeout;
        this.httpClient = HttpClient.newBuilder()
            .connectTimeout(connectTimeout)
            .build();
    }

    @Override
    public CorrectionResult correct(UserQuery query) {
        boolean includeExplanations = Boolean.TRUE.equals(query.includeExplanations());

        String instructions = prompt.instructions()
            + "\nLangue : " + query.language() + "\n"
            + (includeExplanations
                ? "Donne une explication brève pour chaque changement."
                : "Chaque explication doit être une chaîne vide.");

        Map<String, Object> requestBody = new LinkedHashMap<>();
        requestBody.put("model", model);
        requestBody.put("stream", false);
        requestBody.put("think", false);
        requestBody.put("format", responseSchema());
        requestBody.put("options", Map.of(
            "temperature", 0,
            "num_predict", 1024
        ));

        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content", instructions));
        messages.add(Map.of("role", "user", "content", query.text()));
        requestBody.put("messages", messages);

        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(baseUrl + "/api/chat"))
            .header("Content-Type", "application/json")
            .timeout(readTimeout)
            .POST(HttpRequest.BodyPublishers.ofString(toJson(requestBody)))
            .build();

        try {
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 400) {
                throw new IllegalStateException(
                    "Appel Ollama échoué avec le statut " + response.statusCode() + ": " + response.body()
                );
            }

            OllamaChatResponse payload = objectMapper.readValue(response.body(), OllamaChatResponse.class);
            String content = payload != null && payload.message != null ? payload.message.content : null;

            if (content == null || content.isBlank()) {
                throw new IllegalStateException("Réponse Ollama vide.");
            }

            return parsePayload(content, includeExplanations);

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Appel Ollama interrompu.", e);
        } catch (IOException e) {
            throw new IllegalStateException("Erreur lors de l'appel à Ollama: " + e.getMessage(), e);
        }
    }

    private Map<String, Object> responseSchema() {
        Map<String, Object> changeSchema = new LinkedHashMap<>();
        changeSchema.put("type", "object");
        changeSchema.put("properties", Map.of(
            "original", Map.of("type", "string"),
            "corrected", Map.of("type", "string"),
            "explanation", Map.of("type", "string"),
            "startIndex", Map.of("type", "integer"),
            "endIndex", Map.of("type", "integer")
        ));
        changeSchema.put("required", Arrays.asList("original", "corrected", "explanation", "startIndex", "endIndex"));
        changeSchema.put("additionalProperties", false);

        Map<String, Object> rootSchema = new LinkedHashMap<>();
        rootSchema.put("type", "object");
        rootSchema.put("properties", Map.of(
            "correction", Map.of("type", "string"),
            "changes", Map.of(
                "type", "array",
                "items", changeSchema
            )
        ));
        rootSchema.put("required", Arrays.asList("correction", "changes"));
        rootSchema.put("additionalProperties", false);

        return rootSchema;
    }

    private CorrectionResult parsePayload(String content, boolean includeExplanations) {
        String json = extractJson(content);
        try {
            OpenAiCorrectionPayload payload = objectMapper.readValue(json, OpenAiCorrectionPayload.class);

            if (payload.correction == null || payload.changes == null) {
                throw new IllegalStateException("Résultat Ollama invalide.");
            }

            var changes = payload.changes.stream()
                .map(change -> new CorrectionChange(
                    change.original,
                    change.corrected,
                    includeExplanations ? change.explanation : "",
                    change.startIndex,
                    change.endIndex
                ))
                .toList();

            return new CorrectionResult(payload.correction, changes);
        } catch (IOException e) {
            throw new IllegalStateException("Impossible de lire la réponse JSON d'Ollama : " + json, e);
        }
    }

    private String extractJson(String content) {
        String cleaned = content.trim();

        int fencedStart = cleaned.indexOf("```json");
        if (fencedStart >= 0) {
            int jsonStart = fencedStart + "```json".length();
            int fencedEnd = cleaned.indexOf("```", jsonStart);
            if (fencedEnd > jsonStart) {
                cleaned = cleaned.substring(jsonStart, fencedEnd).trim();
            }
        } else {
            int markdownStart = cleaned.indexOf("```");
            if (markdownStart >= 0) {
                int markdownEnd = cleaned.lastIndexOf("```");
                if (markdownEnd > markdownStart) {
                    cleaned = cleaned.substring(markdownStart + 3, markdownEnd).trim();
                }
            }
        }

        if (cleaned.startsWith("json")) {
            cleaned = cleaned.substring(4).trim();
        }

        return cleaned;
    }

    private String toJson(Map<String, Object> requestBody) {
        try {
            return objectMapper.writeValueAsString(requestBody);
        } catch (IOException e) {
            throw new IllegalStateException("Impossible de sérialiser la requête Ollama.", e);
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private static class OllamaChatResponse {
        public OllamaMessage message;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private static class OllamaMessage {
        public String content;
    }
}

