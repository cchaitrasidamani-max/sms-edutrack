package com.sms.dto;

import com.sms.entity.Student;
import jakarta.validation.constraints.*;
import java.time.LocalDate;

public class StudentRequest {
    @NotBlank private String rollNumber;
    @NotBlank
    @Pattern(regexp = "[A-Za-z][A-Za-z .'-]*", message = "First name should contain letters only")
    private String firstName;
    @NotBlank
    @Pattern(regexp = "[A-Za-z][A-Za-z .'-]*", message = "Last name should contain letters only")
    private String lastName;
    @Email @NotBlank private String email;
    @Pattern(regexp = "\\d{10}", message = "Phone number must be exactly 10 digits") private String phone;
    private String address;
    @PastOrPresent(message = "Date of birth cannot be in the future")
    private LocalDate dateOfBirth;
    private Student.Gender gender;
    @NotNull private Long courseId;
    @NotNull @Min(1) @Max(8) private Integer semester;
    private Student.Status status;

    public StudentRequest() {}

    public String getRollNumber() { return rollNumber; }
    public void setRollNumber(String rollNumber) { this.rollNumber = rollNumber; }

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public LocalDate getDateOfBirth() { return dateOfBirth; }
    public void setDateOfBirth(LocalDate dateOfBirth) { this.dateOfBirth = dateOfBirth; }

    public Student.Gender getGender() { return gender; }
    public void setGender(Student.Gender gender) { this.gender = gender; }

    public Long getCourseId() { return courseId; }
    public void setCourseId(Long courseId) { this.courseId = courseId; }

    public Integer getSemester() { return semester; }
    public void setSemester(Integer semester) { this.semester = semester; }

    public Student.Status getStatus() { return status; }
    public void setStatus(Student.Status status) { this.status = status; }
}
