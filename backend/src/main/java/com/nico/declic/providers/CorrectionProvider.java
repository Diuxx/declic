package com.nico.declic.providers;

import com.nico.declic.dtos.CorrectionResult;
import com.nico.declic.dtos.UserQuery;


public interface CorrectionProvider {
    CorrectionResult correct(UserQuery query);
}
