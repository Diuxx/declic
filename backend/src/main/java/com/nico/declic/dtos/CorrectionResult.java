package com.nico.declic.dtos;

import java.util.List;

public record CorrectionResult(
    String correction,
    List<CorrectionChange> changes
) { /* */ }
