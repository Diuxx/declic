package com.nico.declic.dtos;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class APIError {
    private String message;
    private int code;
    private String path;
    private LocalDateTime timestamp;

    public APIError(String message, int code, String path) {
        this.path = path;
        this.message = message;
        this.code = code;
        this.timestamp = LocalDateTime.now();
    }
}