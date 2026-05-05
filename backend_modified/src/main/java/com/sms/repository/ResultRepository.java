package com.sms.repository;

import com.sms.entity.Result;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface ResultRepository extends JpaRepository<Result, Long> {

    List<Result> findByStudentId(Long studentId);

    List<Result> findByStudentIdOrderByResultDateDescCreatedAtDesc(Long studentId);

    List<Result> findByStudentIdAndSemester(Long studentId, Integer semester);

    List<Result> findByStudentIdAndSubject(Long studentId, String subject);

    Optional<Result> findFirstByStudentIdAndSubjectAndExamTypeAndSemester(
            Long studentId,
            String subject,
            Result.ExamType examType,
            Integer semester);

    @Query("SELECT AVG(r.marksObtained / r.maxMarks * 100) FROM Result r WHERE r.student.id = :studentId")
    Double findAveragePercentage(@Param("studentId") Long studentId);
}
