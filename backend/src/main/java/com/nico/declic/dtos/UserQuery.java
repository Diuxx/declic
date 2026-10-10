package com.nico.declic.dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UserQuery(
    @NotBlank (message = "The text must not be blank.")
    @Size (
        max = 2000,
        message = "The text must not exceed 2000 characters."
    )
    String text,

    @NotBlank (message = "The language must not be blank.")
    @Pattern (
        regexp = "fr|en",
        message = "The language must be either 'fr' or 'en'."
    )
    String language,
    Boolean includeExplanations
) { 
    public UserQuery {
        includeExplanations = 
            Boolean.TRUE.equals(includeExplanations);
    }
}