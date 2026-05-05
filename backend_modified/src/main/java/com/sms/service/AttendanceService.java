package com.sms.service;

import com.sms.dto.*;
import com.sms.entity.*;
import com.sms.repository.*;
import com.sms.security.UserDetailsImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional
public class AttendanceService {

    @Autowired
    private AttendanceRepository attendanceRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private UserRepository userRepository;

    private User getCurrentUser() {
        var auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth != null && auth.getPrincipal() instanceof UserDetailsImpl ud) {
            return userRepository.findById(ud.getId()).orElse(null);
        }

        return null;
    }

    public AttendanceResponse mark(AttendanceRequest req) {

        Student student = studentRepository.findById(req.getStudentId())
                .orElseThrow(() -> new RuntimeException("Student not found"));
        
        List<Attendance> byStudentAndSubjectAndDate = attendanceRepository.findByStudentAndSubjectAndDate(req.getStudentId(), req.getSubject(), req.getAttendanceDate());

        Attendance attendance = byStudentAndSubjectAndDate.isEmpty()
                ? new Attendance()
                : byStudentAndSubjectAndDate.get(0);
        attendance.setStudent(student);
        attendance.setSubject(req.getSubject());
        attendance.setAttendanceDate(req.getAttendanceDate());
        attendance.setStatus(req.getStatus());
        attendance.setMarkedBy(getCurrentUser());
        attendance.setRemarks(req.getRemarks());

        return AttendanceResponse.from(attendanceRepository.save(attendance));
    }

    public List<AttendanceResponse> markBulk(List<AttendanceRequest> requests) {

        return requests.stream()
                .map(this::mark)
                .collect(Collectors.toList());
    }

    public List<AttendanceResponse> getByStudent(Long studentId) {

        return attendanceRepository
                .findByStudentIdOrderByAttendanceDateDescCreatedAtDesc(studentId)
                .stream()
                .map(AttendanceResponse::from)
                .collect(Collectors.toList());
    }

    public List<AttendanceResponse> getByCourseSubjectDate(Long courseId, String subject, java.time.LocalDate date) {

        return attendanceRepository
                .findByCourseAndSubjectAndDate(courseId, subject, date)
                .stream()
                .map(AttendanceResponse::from)
                .collect(Collectors.toList());
    }

    public Map<String, Object> getSummary(Long studentId) {

        List<Attendance> records = attendanceRepository.findByStudentIdOrderByAttendanceDateDescCreatedAtDesc(studentId);

        Map<String, Long> totalBySubject = new HashMap<>();
        Map<String, Long> presentBySubject = new HashMap<>();

        for (Attendance a : records) {

            String subject = a.getSubject();

            totalBySubject.merge(subject, 1L, (a1, b1) -> a1 + b1);

            if (a.getStatus() == Attendance.AttendanceStatus.PRESENT) {
                presentBySubject.merge(subject, 1L, (a1, b1) -> a1 + b1);
            }
        }

        Map<String, Double> percentageBySubject = new HashMap<>();

        totalBySubject.forEach((subject, total) -> {

            long present = presentBySubject.getOrDefault(subject, 0L);

            percentageBySubject.put(
                    subject,
                    (double) present / total * 100
            );
        });

        long totalPresent = records.stream()
                .filter(a -> a.getStatus() == Attendance.AttendanceStatus.PRESENT)
                .count();

        double overallPercentage = records.isEmpty()
                ? 0
                : (double) totalPresent / records.size() * 100;

        return Map.of(
                "totalClasses", records.size(),
                "totalPresent", totalPresent,
                "overallPercentage", Math.round(overallPercentage * 10.0) / 10.0,
                "subjectWise", percentageBySubject,
                "records", records.stream()
                        .map(AttendanceResponse::from)
                        .collect(Collectors.toList())
        );
    }
}
