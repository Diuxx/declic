package com.nico.declic.controllers;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import jakarta.validation.Valid;

import com.nico.declic.Services.CorrectionService;
import com.nico.declic.dtos.CorrectionResult;
import com.nico.declic.dtos.UserQuery;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;


@RestController
@RequestMapping("/api/v1/correction")
public class CorrectionController {
    
    private final CorrectionService correctionService;

    public CorrectionController(CorrectionService correctionService) {
        this.correctionService = correctionService;
    }

    @PostMapping
    public CorrectionResult correct(@Valid @RequestBody UserQuery query) {
        //TODO: process POST request
        return correctionService.correct(query);
    }
    
}
