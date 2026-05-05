package com.sms.service;

import com.sms.dto.*;
import com.sms.entity.*;
import com.sms.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.lang.NonNull;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class StudentService {

    @Autowired private StudentRepository studentRepository;
    @Autowired private CourseRepository courseRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    public List<StudentResponse> getAll() {
        return studentRepository.findAll().stream()
                .map(StudentResponse::from).collect(Collectors.toList());
    }

    public StudentResponse getById(@NonNull Long id) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Student not found: " + id));
        return StudentResponse.from(student);
    }

    public StudentResponse create(StudentRequest req) {
        if (studentRepository.existsByRollNumber(req.getRollNumber()))
            throw new RuntimeException("Roll number already exists: " + req.getRollNumber());
        if (studentRepository.existsByEmail(req.getEmail()))
            throw new RuntimeException("Email already exists: " + req.getEmail());

        Course course = courseRepository.findById(req.getCourseId())
                .orElseThrow(() -> new RuntimeException("Course not found: " + req.getCourseId()));

        Student student = new Student();
        student.setRollNumber(req.getRollNumber());
        student.setFirstName(req.getFirstName());
        student.setLastName(req.getLastName());
        student.setEmail(req.getEmail());
        student.setPhone(req.getPhone());
        student.setAddress(req.getAddress());
        student.setDateOfBirth(req.getDateOfBirth());
        student.setGender(req.getGender());
        student.setCourse(course);
        student.setSemester(req.getSemester());
        student.setStatus(req.getStatus() != null ? req.getStatus() : Student.Status.ACTIVE);
        Student savedStudent = studentRepository.save(student);

        // Create user account for student
        User user = new User();
        user.setUsername(req.getRollNumber());
        user.setPassword(passwordEncoder.encode("student123")); // Default password
        user.setFullName(req.getFirstName() + " " + req.getLastName());
        user.setEmail(req.getEmail());
        user.setPhone(req.getPhone());
        user.setRole(User.Role.STUDENT);
        user.setActive(true);
        userRepository.save(user);

        return StudentResponse.from(savedStudent);
    }

    public StudentResponse update(Long id, StudentRequest req) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Student not found: " + id));

        Course course = courseRepository.findById(req.getCourseId())
                .orElseThrow(() -> new RuntimeException("Course not found: " + req.getCourseId()));

        student.setFirstName(req.getFirstName());
        student.setLastName(req.getLastName());
        student.setEmail(req.getEmail());
        student.setPhone(req.getPhone());
        student.setAddress(req.getAddress());
        student.setDateOfBirth(req.getDateOfBirth());
        student.setGender(req.getGender());
        student.setCourse(course);
        student.setSemester(req.getSemester());
        if (req.getStatus() != null) student.setStatus(req.getStatus());
        return StudentResponse.from(studentRepository.save(student));
    }

    public void delete(@NonNull Long id) {
        if (!studentRepository.existsById(id))
            throw new RuntimeException("Student not found: " + id);
        studentRepository.deleteById(id);
    }

    public StudentResponse getProfile() {
        String rollNumber = SecurityContextHolder.getContext().getAuthentication().getName();
        Student student = studentRepository.findByRollNumber(rollNumber)
                .orElseThrow(() -> new RuntimeException("Student not found"));
        return StudentResponse.from(student);
    }
}
