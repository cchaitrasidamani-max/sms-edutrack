package com.sms.repository;

import com.sms.entity.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.util.List;

public interface AttendanceRepository extends JpaRepository<Attendance, Long> {

    List<Attendance> findByStudentId(Long studentId);

    List<Attendance> findByStudentIdOrderByAttendanceDateDescCreatedAtDesc(Long studentId);

    List<Attendance> findByStudentIdAndSubject(Long studentId, String subject);

    List<Attendance> findBySubjectAndAttendanceDate(String subject, LocalDate date);

    @Query("SELECT a FROM Attendance a WHERE a.student.course.id = :courseId AND a.subject = :subject AND a.attendanceDate = :date")
    List<Attendance> findByCourseAndSubjectAndDate(@Param("courseId") Long courseId,
                                                    @Param("subject") String subject,
                                                    @Param("date") LocalDate date);
    
    @Query("SELECT a FROM Attendance a WHERE a.student.id = :studentId AND a.subject = :subject AND a.attendanceDate = :date")
    List<Attendance> findByStudentAndSubjectAndDate(@Param("studentId") Long studentId,
                                                     @Param("subject") String string,
                                                     @Param("date") LocalDate date);

    @Query("SELECT COUNT(a) FROM Attendance a WHERE a.student.id = :studentId AND a.subject = :subject AND a.status = 'PRESENT'")
    long countPresent(@Param("studentId") Long studentId, @Param("subject") String subject);

    @Query("SELECT COUNT(a) FROM Attendance a WHERE a.student.id = :studentId AND a.subject = :subject")
    long countTotal(@Param("studentId") Long studentId, @Param("subject") String subject);
}
