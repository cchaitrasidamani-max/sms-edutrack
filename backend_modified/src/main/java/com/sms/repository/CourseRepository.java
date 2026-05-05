package com.sms.repository;

import com.sms.entity.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface CourseRepository extends JpaRepository<Course, Long> {
	
	
    Optional<Course> findByCode(String code);
    boolean existsByCode(String code);
}
