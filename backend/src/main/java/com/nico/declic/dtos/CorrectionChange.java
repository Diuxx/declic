package com.nico.declic.dtos;

public record CorrectionChange(
    String original,
    String corrected,
    String explanation,
    int startIndex,
    int endIndex
) { /* */ }
