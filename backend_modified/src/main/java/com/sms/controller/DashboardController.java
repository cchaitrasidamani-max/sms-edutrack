package com.sms.controller;

import com.sms.dto.ApiResponse;
import com.sms.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    @Autowired private StudentRepository studentRepository;
    @Autowired private CourseRepository courseRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private AttendanceRepository attendanceRepository;
    @Autowired private ResultRepository resultRepository;

    @GetMapping("/stats")
public ResponseEntity<ApiResponse<Map<String, Object>>> getStats() {

    long totalStudents = studentRepository.count();
    long activeStudents = studentRepository.countActiveStudents();
    long totalCourses = courseRepository.count();

    long totalFaculty = userRepository.findAll()
            .stream()
            .filter(u -> u.getRole().name().equals("FACULTY"))
            .count();

    long totalAttendance = attendanceRepository.count();
    long totalResults = resultRepository.count();

    Map<String, Object> stats = new HashMap<>();

    stats.put("totalStudents", totalStudents);
    stats.put("activeStudents", activeStudents);
    stats.put("totalCourses", totalCourses);
    stats.put("totalFaculty", totalFaculty);
    stats.put("totalAttendanceRecords", totalAttendance);
    stats.put("totalResultRecords", totalResults);

    return ResponseEntity.ok(
            ApiResponse.success("Stats fetched", stats)
    );
}
}
