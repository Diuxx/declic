package com.nico.declic.providers.adapters;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import com.nico.declic.config.CorrectionPrompt;
import com.nico.declic.dtos.CorrectionChange;
import com.nico.declic.dtos.CorrectionResult;
import com.nico.declic.dtos.UserQuery;
import com.nico.declic.providers.CorrectionProvider;
import com.nico.declic.providers.payloads.OpenAiCorrectionPayload;
import com.openai.client.OpenAIClient;
import com.openai.models.responses.ResponseCreateParams;
import com.openai.models.responses.ResponseStatus;

@Component
@ConditionalOnProperty(
    name = "app.ai.provider",
    havingValue = "openai"
)
public class OpenAiAdapter implements CorrectionProvider {
    
    private final OpenAIClient client;
    private final CorrectionPrompt prompt;
    private final String model;

    public OpenAiAdapter(
        OpenAIClient client,
        CorrectionPrompt prompt,
        @Value("${app.ai.openai.api-model}") String model
    ) {
        if (model.isBlank()) {
            throw new IllegalStateException(
                "OpenAI model configuration is missing. Please set 'app.ai.openai.api-model' in your application properties."
            );
        }
        this.client = client;
        this.prompt = prompt;
        this.model = model;
    }

    @Override
    public CorrectionResult correct(UserQuery query) {
        boolean includeExplanations =
            Boolean.TRUE.equals(query.includeExplanations());

        String instructions = prompt.instructions()
            + "\nLangue : " + query.language()
            + "\n"
            + (includeExplanations
                ? "Donne une explication brève pour chaque changement."
                : "Chaque explanation doit être une chaîne vide.");

        // Le SDK construit le schéma JSON depuis la classe.
        var params = ResponseCreateParams.builder()
            .model(model)
            .instructions(instructions)
            .input(query.text())
            .store(false)
            .text(OpenAiCorrectionPayload.class)
            .build();

        var response = client.responses().create(params);

        if (response.status().isEmpty()
                || !ResponseStatus.COMPLETED.equals(
                    response.status().get())) {
            throw new IllegalStateException(
                "Réponse OpenAI incomplète."
            );
        }

        var contents = response.output().stream()
            .flatMap(item -> item.message().stream())
            .flatMap(message -> message.content().stream())
            .toList();

        if (contents.stream().anyMatch(
                content -> content.refusal().isPresent())) {
            throw new IllegalStateException(
                "La demande a été refusée par OpenAI."
            );
        }

        var results = contents.stream()
            .flatMap(content -> content.outputText().stream())
            .toList();

        if (results.size() != 1) {
            throw new IllegalStateException(
                "Une unique correction était attendue."
            );
        }

        var payload = results.getFirst();

        if (payload.correction == null || payload.changes == null) {
            throw new IllegalStateException(
                "Résultat OpenAI invalide."
            );
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
    }
}
