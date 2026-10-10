package com.nico.declic.config;

import java.time.Duration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.openai.client.OpenAIClient;
import com.openai.client.okhttp.OpenAIOkHttpClient;

@Configuration
@ConditionalOnProperty(
    name = "app.ai.provider",
    havingValue = "openai"
)
public class OpenAIConfiguration {
    
    @Bean(destroyMethod = "close")
    public OpenAIClient openAIClient(
        @Value("${app.ai.openai.api-key}") String apiKey,
        @Value("${app.ai.connect-timeout}") Duration timeout,
        @Value("${app.ai.max-retries}") int maxRetries
    ) {
        if (apiKey.isBlank()) {
            throw new IllegalStateException(
                "OpenAI API key configuration is missing. Please set 'app.ai.openai.api-key' in your application properties."
            );
        }

        return new OpenAIOkHttpClient.Builder()
            .apiKey(apiKey)
            .timeout(timeout)
            .maxRetries(maxRetries)
            .build();
    }

}
