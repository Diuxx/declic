package com.nico.declic.providers.adapters;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import com.nico.declic.dtos.CorrectionResult;
import com.nico.declic.dtos.UserQuery;
import com.nico.declic.providers.CorrectionProvider;

@Component
@ConditionalOnProperty(
    name = "app.ai.provider",
    havingValue = "ollama"
)
public class OllamaAdapter implements CorrectionProvider {

    @Override
    public CorrectionResult correct(UserQuery query) {
        // Implement the correction logic using Ollama API
        return null;
    }
}

