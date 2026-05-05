package com.sms.config;

import java.time.LocalDate;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.sms.entity.Course;
import com.sms.entity.Student;
import com.sms.entity.User;
import com.sms.repository.CourseRepository;
import com.sms.repository.StudentRepository;
import com.sms.repository.UserRepository;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired private UserRepository userRepository;
    @Autowired private CourseRepository courseRepository;
    @Autowired private StudentRepository studentRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {

        if (userRepository.count() > 0) return;

        // ── Users ──
        User admin = new User();
        admin.setUsername("admin");
        admin.setPassword(passwordEncoder.encode("admin123"));
        admin.setFullName("System Administrator");
        admin.setEmail("admin@college.edu");
        admin.setRole(User.Role.ADMIN);
        admin = userRepository.save(admin);

        if (admin == null) return;

        User faculty1 = new User();
        faculty1.setUsername("faculty1");
        faculty1.setPassword(passwordEncoder.encode("faculty123"));
        faculty1.setFullName("Dr. Ramesh Kumar");
        faculty1.setEmail("ramesh@college.edu");
        faculty1.setRole(User.Role.FACULTY);
        faculty1 = userRepository.save(faculty1);

        if (faculty1 == null) return;

        User faculty2 = new User();
        faculty2.setUsername("faculty2");
        faculty2.setPassword(passwordEncoder.encode("faculty123"));
        faculty2.setFullName("Prof. Priya Sharma");
        faculty2.setEmail("priya@college.edu");
        faculty2.setRole(User.Role.FACULTY);
        faculty2 = userRepository.save(faculty2);

        if (faculty2 == null) return;

        // ── Courses ──
        Course btech = new Course();
        btech.setCode("BTECH-CS");
        btech.setName("B.Tech Computer Science");
        btech.setDescription("Bachelor of Technology in Computer Science & Engineering");
        btech.setDurationYears(4);
        btech.setTotalSemesters(8);
        btech.setMaxStudents(60);
        btech = courseRepository.save(btech);

        Course bca = new Course();
        bca.setCode("BCA");
        bca.setName("Bachelor of Computer Applications");
        bca.setDescription("BCA - Undergraduate program in Computer Applications");
        bca.setDurationYears(3);
        bca.setTotalSemesters(6);
        bca.setMaxStudents(40);
        bca = courseRepository.save(bca);

        Course mca = new Course();
        mca.setCode("MCA");
        mca.setName("Master of Computer Applications");
        mca.setDescription("MCA - Postgraduate program in Computer Applications");
        mca.setDurationYears(2);
        mca.setTotalSemesters(4);
        mca.setMaxStudents(30);
        courseRepository.save(mca);

        // ── Students ──
        String[] firstNames = {"Aarav","Priya","Rohit","Sneha","Arjun","Meera","Vikram","Divya","Karan","Ananya"};
        String[] lastNames = {"Sharma","Patel","Singh","Gupta","Reddy","Nair","Joshi","Mehta","Iyer","Pillai"};

        for (int i = 0; i < 10; i++) {
            Student student = new Student();
            student.setRollNumber(String.format("BTECH%04d", i + 1));
            student.setFirstName(firstNames[i]);
            student.setLastName(lastNames[i]);
            student.setEmail(firstNames[i].toLowerCase() + "." + lastNames[i].toLowerCase() + "@student.edu");
            student.setPhone("98765" + String.format("%05d", i));
            student.setCourse(btech);
            student.setSemester((i % 4) + 1);
            student.setDateOfBirth(LocalDate.of(2001 + (i % 3), (i % 12) + 1, (i % 28) + 1));
            student.setGender(i % 2 == 0 ? Student.Gender.MALE : Student.Gender.FEMALE);
            student.setStatus(Student.Status.ACTIVE);

            studentRepository.save(student);

            User studentUser = new User();
            studentUser.setUsername(student.getRollNumber());
            studentUser.setPassword(passwordEncoder.encode("student123"));
            studentUser.setFullName(student.getFirstName() + " " + student.getLastName());
            studentUser.setEmail(student.getEmail());
            studentUser.setPhone(student.getPhone());
            studentUser.setRole(User.Role.STUDENT);
            studentUser.setActive(true);
            userRepository.save(studentUser);
        }

        String[] bcaFirstNames = {"Neha","Rahul","Pooja","Aditya","Kavya"};
        String[] bcaLastNames = {"Verma","Das","Bose","Chopra","Menon"};

        for (int i = 0; i < 5; i++) {
            Student student = new Student();
            student.setRollNumber(String.format("BCA%04d", i + 1));
            student.setFirstName(bcaFirstNames[i]);
            student.setLastName(bcaLastNames[i]);
            student.setEmail(bcaFirstNames[i].toLowerCase() + "." + bcaLastNames[i].toLowerCase() + "@student.edu");
            student.setPhone("91234" + String.format("%05d", i));
            student.setCourse(bca);
            student.setSemester((i % 3) + 1);
            student.setDateOfBirth(LocalDate.of(2002 + (i % 2), (i % 12) + 1, (i % 28) + 1));
            student.setGender(i % 2 == 0 ? Student.Gender.FEMALE : Student.Gender.MALE);
            student.setStatus(Student.Status.ACTIVE);

            studentRepository.save(student);

            User studentUser = new User();
            studentUser.setUsername(student.getRollNumber());
            studentUser.setPassword(passwordEncoder.encode("student123"));
            studentUser.setFullName(student.getFirstName() + " " + student.getLastName());
            studentUser.setEmail(student.getEmail());
            studentUser.setPhone(student.getPhone());
            studentUser.setRole(User.Role.STUDENT);
            studentUser.setActive(true);
            userRepository.save(studentUser);
        }

        System.out.println("=== SMS Data Initialized ===");
        System.out.println("Admin: admin / admin123");
        System.out.println("Faculty: faculty1 / faculty123");
        System.out.println("Students: rollNumber / student123 for seeded student accounts");
    }
}