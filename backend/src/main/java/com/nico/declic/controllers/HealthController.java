package com.nico.declic.controllers;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.nico.declic.dtos.HealthResponse;

import org.springframework.web.bind.annotation.GetMapping;

@RestController 
@RequestMapping("/api/v1/health")
public class HealthController {
    
    @GetMapping
    public HealthResponse health() {
        return new HealthResponse("UP");
    }
}
