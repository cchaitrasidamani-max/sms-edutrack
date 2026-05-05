package com.sms.controller;

import com.sms.dto.*;
import com.sms.entity.Student;
import com.sms.service.ResultService;
import jakarta.validation.Valid;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/results")
public class ResultController {

    @Autowired
    private ResultService resultService;

    // Add result (Admin or Faculty)
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','FACULTY')")
    public ResponseEntity<ApiResponse<ResultResponse>> add(
            @Valid @RequestBody ResultRequest request) {

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Result added",
                        resultService.add(request)
                )
        );
    }

    // Get results by student
    @GetMapping("/student/{studentId}")
    public ResponseEntity<ApiResponse<List<ResultResponse>>> getByStudent(
            @PathVariable Long studentId) {

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Results fetched",
                        resultService.getByStudent(studentId)
                )
        );
    }

    // Get results by semester
    @GetMapping("/student/{studentId}/semester/{semester}")
    public ResponseEntity<ApiResponse<List<ResultResponse>>> getBySemester(
            @PathVariable Long studentId,
            @PathVariable Integer semester) {

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Results fetched",
                        resultService.getBySemester(studentId, semester)
                )
        );
    }

    // Get student report
    @GetMapping("/report/{studentId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getReport(
            @PathVariable Long studentId) {

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Report generated",
                        resultService.getReport(studentId)
                )
        );
    }

    // Student login → view own results
    @GetMapping("/my")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<List<ResultResponse>>> getMyResults() {

        String rollNumber = SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getName();

        Student student =
                resultService.getStudentByRollNumber(rollNumber);

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Results fetched",
                        resultService.getByStudent(student.getId())
                )
        );
    }
}