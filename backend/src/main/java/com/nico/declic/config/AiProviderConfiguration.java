package com.nico.declic.config;

import java.time.Duration;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nico.declic.providers.CorrectionProvider;
import com.nico.declic.providers.adapters.OllamaAdapter;
import com.nico.declic.providers.adapters.OpenAiAdapter;
import com.openai.client.OpenAIClient;

@Configuration
public class AiProviderConfiguration {

    @Bean
    public ObjectMapper objectMapper() {
        return new ObjectMapper();
    }

    @Bean
    public CorrectionProvider correctionProvider(
        CorrectionPrompt prompt,
        ObjectMapper objectMapper,
        ObjectProvider<OpenAIClient> openAIClient,
        @Value("${app.ai.provider:ollama}") String provider,
        @Value("${app.ai.ollama.base-url}") String ollamaBaseUrl,
        @Value("${app.ai.ollama.model}") String ollamaModel,
        @Value("${app.ai.openai.api-model}") String openAiModel,
        @Value("${app.ai.connect-timeout}") Duration connectTimeout,
        @Value("${app.ai.read-timeout}") Duration readTimeout
    ) {
        if ("ollama".equalsIgnoreCase(provider)) {
            return new OllamaAdapter(
                prompt,
                objectMapper,
                ollamaBaseUrl,
                ollamaModel,
                connectTimeout,
                readTimeout
            );
        }

        if ("openai".equalsIgnoreCase(provider)) {
            OpenAIClient client = openAIClient.getIfAvailable();
            if (client == null) {
                throw new IllegalStateException("OpenAI client is not available.");
            }
            return new OpenAiAdapter(client, prompt, openAiModel);
        }

        throw new IllegalStateException("Unsupported AI provider: " + provider);
    }
}
