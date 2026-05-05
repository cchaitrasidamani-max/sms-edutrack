package com.sms.service;

import com.sms.dto.NotificationResponse;
import com.sms.dto.ResultResponse;
import com.sms.entity.Student;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Transactional
public class NotificationService {

    @Autowired
    private ResultService resultService;

    @Autowired
    private AttendanceService attendanceService;

    public List<NotificationResponse> getMyNotifications() {
        String rollNumber = SecurityContextHolder.getContext().getAuthentication().getName();
        Student student = resultService.getStudentByRollNumber(rollNumber);

        List<NotificationResponse> notifications = new ArrayList<>();
        List<ResultResponse> results = resultService.getByStudent(student.getId());

        if (!results.isEmpty()) {
            ResultResponse latest = results.get(0);
            Map<String, Object> meta = new HashMap<>();
            meta.put("resultCount", results.size());
            meta.put("latestSubject", latest.getSubject());
            meta.put("latestExamType", latest.getExamType());
            meta.put("latestResultDate", latest.getResultDate());
            notifications.add(new NotificationResponse(
                    "New Results Available",
                    String.format("Your %s result for %s is ready. Tap to review your scores.", latest.getExamType(), latest.getSubject()),
                    "/my-results",
                    "RESULT",
                    meta,
                    "Your exam results are available",
                    String.format("Dear %s,\n\nYour %s result for %s is now available on EduTrack. Please log in to view your updated scores and details.\n\nThank you,\nEduTrack Team", student.getFirstName(), latest.getExamType(), latest.getSubject())
            ));
        }

        Map<String, Object> attendanceSummary = attendanceService.getSummary(student.getId());
        notifications.add(new NotificationResponse(
                "Attendance Summary",
                String.format("You have attended %s of %s classes (%.1f%%).", attendanceSummary.get("totalPresent"), attendanceSummary.get("totalClasses"), attendanceSummary.get("overallPercentage")),
                "/attendance",
                "ATTENDANCE",
                attendanceSummary,
                "Monthly attendance summary",
                String.format("Dear %s,\n\nYour attendance summary is ready. You have attended %s out of %s classes, which is %.1f%%. Visit the attendance section to review full details.\n\nRegards,\nEduTrack Team",
                        student.getFirstName(), attendanceSummary.get("totalPresent"), attendanceSummary.get("totalClasses"), attendanceSummary.get("overallPercentage"))
        ));

        notifications.add(new NotificationResponse(
                "Profile Reminder",
                "Keep your profile details up to date so you never miss important notifications.",
                "/profile",
                "PROFILE",
                null,
                "Please verify your student profile",
                String.format("Dear %s,\n\nPlease make sure your contact details and profile information are up to date. Accurate information ensures you receive all important messages and alerts.\n\nBest,\nEduTrack Team", student.getFirstName())
        ));

        return notifications;
    }
}
