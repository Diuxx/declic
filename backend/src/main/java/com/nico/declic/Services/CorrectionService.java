package com.nico.declic.Services;

import org.springframework.stereotype.Service;

import com.nico.declic.dtos.CorrectionResult;
import com.nico.declic.dtos.UserQuery;
import com.nico.declic.providers.CorrectionProvider;

@Service
public class CorrectionService {

    private final CorrectionProvider provider;

    public CorrectionService(CorrectionProvider provider) {
        this.provider = provider;
    }

    public CorrectionResult correct(UserQuery query) {
        return provider.correct(query);
    }
}
