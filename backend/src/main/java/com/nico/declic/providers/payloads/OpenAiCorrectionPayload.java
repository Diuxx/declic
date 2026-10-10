package com.nico.declic.providers.payloads;

import java.util.List;

public class OpenAiCorrectionPayload {
    public String correction;
    public List<Change> changes;

    public static class Change {
        public String original;
        public String corrected;
        public String explanation;
        public int startIndex;
        public int endIndex;
    }
}
