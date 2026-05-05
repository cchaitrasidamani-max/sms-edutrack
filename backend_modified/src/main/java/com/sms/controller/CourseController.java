package com.sms.controller;

import com.sms.dto.ApiResponse;
import com.sms.entity.Course;
import com.sms.repository.CourseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/courses")
public class CourseController {

    @Autowired private CourseRepository courseRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Course>>> getAll() {
    	List<Course> all = courseRepository.findAll();
    	System.out.println(all);
        return ResponseEntity.ok(ApiResponse.success("Courses fetched", courseRepository.findAll()));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Course>> create(@RequestBody Course course) {
        course.setId(null);

        return ResponseEntity.ok(ApiResponse.success("Course created", courseRepository.save(course)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Course>> update(@PathVariable Long id, @RequestBody Course course) {
        course.setId(id);
        return ResponseEntity.ok(ApiResponse.success("Course updated", courseRepository.save(course)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        courseRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.success("Course deleted", null));
    }
}
