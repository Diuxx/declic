package com.nico.declic.Services;

import java.util.List;

import org.apache.catalina.User;
import org.springframework.stereotype.Service;

import com.nico.declic.dtos.CorrectionResult;
import com.nico.declic.dtos.UserQuery;

@Service 
public class CorrectionService {
    
    /**
     * Corrects the given text.
     *
     * @param text the text to be corrected
     * @return the result of the correction
     */
    public CorrectionResult correct(UserQuery query) {
        // Implement the correction logic here
        // For now, let's just return the input text as the corrected text
        return new CorrectionResult(query.text(), List.of());
    }
}
