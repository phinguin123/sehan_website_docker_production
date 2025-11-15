-- MySQL dump 10.13  Distrib 8.0.42, for Linux (aarch64)
--
-- Host: localhost    Database: sehanDB
-- ------------------------------------------------------
-- Server version	8.0.42

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

-- Create database
CREATE DATABASE IF NOT EXISTS sehanDB;
USE sehanDB;

--
-- Table structure for table `attendance`
--

DROP TABLE IF EXISTS `attendance`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `attendance` (
  `attendance_id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `subject_name` varchar(100) NOT NULL,
  `level` varchar(10) NOT NULL,
  `attendance_date` date NOT NULL,
  `status` enum('present','absent','late','excused','recorded','reset') NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `timetable_id` int DEFAULT NULL,
  PRIMARY KEY (`attendance_id`),
  KEY `fk_student` (`student_id`),
  KEY `fk_attendance_timetable` (`timetable_id`),
  CONSTRAINT `fk_attendance_timetable` FOREIGN KEY (`timetable_id`) REFERENCES `timetable` (`timetable_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=33191 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `attendance_code`
--

DROP TABLE IF EXISTS `attendance_code`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `attendance_code` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(4) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `classes`
--

DROP TABLE IF EXISTS `classes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `classes` (
  `class_id` int NOT NULL AUTO_INCREMENT,
  `subject_id` int NOT NULL,
  `level_id` int NOT NULL,
  `mode_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `grade_id` int NOT NULL,
  PRIMARY KEY (`class_id`),
  KEY `classes_ibfk_1` (`subject_id`),
  KEY `classes_ibfk_2` (`level_id`),
  KEY `classes_ibfk_3` (`mode_id`),
  KEY `classes_ibfk_4` (`grade_id`),
  CONSTRAINT `classes_ibfk_1` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`subject_id`) ON DELETE CASCADE,
  CONSTRAINT `classes_ibfk_2` FOREIGN KEY (`level_id`) REFERENCES `levels` (`id`) ON DELETE CASCADE,
  CONSTRAINT `classes_ibfk_3` FOREIGN KEY (`mode_id`) REFERENCES `modes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `classes_ibfk_4` FOREIGN KEY (`grade_id`) REFERENCES `grades` (`grade_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=99 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `days`
--

DROP TABLE IF EXISTS `days`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `days` (
  `day_id` int NOT NULL AUTO_INCREMENT,
  `day_name` varchar(10) NOT NULL,
  PRIMARY KEY (`day_id`),
  UNIQUE KEY `day_name` (`day_name`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `grades`
--

DROP TABLE IF EXISTS `grades`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `grades` (
  `grade_id` int NOT NULL AUTO_INCREMENT,
  `grade` varchar(10) NOT NULL,
  PRIMARY KEY (`grade_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `homework`
--

DROP TABLE IF EXISTS `homework`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `homework` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `description` text,
  `assignedDate` date NOT NULL,
  `dueDate` date NOT NULL,
  `is_over` tinyint(1) NOT NULL,
  `createdDate` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `file_name` varchar(255) DEFAULT NULL,
  `subject_id` int NOT NULL,
  `grade_id` int NOT NULL,
  `level_id` int NOT NULL,
  `type` enum('homework','exam') NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_homework_grade_id` (`grade_id`),
  KEY `fk_homework_level_id` (`level_id`),
  KEY `fk_homework_subject_id` (`subject_id`),
  CONSTRAINT `fk_homework_grade_id` FOREIGN KEY (`grade_id`) REFERENCES `grades` (`grade_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_homework_level_id` FOREIGN KEY (`level_id`) REFERENCES `levels` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_homework_subject_id` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`subject_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1373 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `levels`
--

DROP TABLE IF EXISTS `levels`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `levels` (
  `id` int NOT NULL AUTO_INCREMENT,
  `level_name` enum('SL','HL','SL/HL') DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `modes`
--

DROP TABLE IF EXISTS `modes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `modes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `mode_name` enum('Online','Offline') DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `parents`
--

DROP TABLE IF EXISTS `parents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `parents` (
  `parent_id` int NOT NULL AUTO_INCREMENT,
  `parent_name` varchar(255) NOT NULL,
  `phone_number` varchar(16) DEFAULT NULL,
  `kakao_user_id` varchar(255) DEFAULT NULL,
  `kakao_access_token` text,
  `kakao_refresh_token` text,
  `google_user_id` varchar(255) DEFAULT NULL,
  `google_access_token` text,
  `google_refresh_token` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `email` varchar(100) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`parent_id`)
) ENGINE=InnoDB AUTO_INCREMENT=491 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `parents_students`
--

DROP TABLE IF EXISTS `parents_students`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `parents_students` (
  `id` int NOT NULL AUTO_INCREMENT,
  `parent_id` int NOT NULL,
  `student_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `parent_id` (`parent_id`),
  KEY `student_id` (`student_id`),
  CONSTRAINT `parents_students_ibfk_1` FOREIGN KEY (`parent_id`) REFERENCES `parents` (`parent_id`) ON DELETE CASCADE,
  CONSTRAINT `parents_students_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=562 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `pt_alerts`
--

DROP TABLE IF EXISTS `pt_alerts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pt_alerts` (
  `alert_id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `subject_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `alert_type` enum('sessions_completed','sessions_warning','sessions_transferred') COLLATE utf8mb4_unicode_ci DEFAULT 'sessions_completed',
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('active','dismissed','resolved') COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`alert_id`),
  KEY `idx_student_subject` (`student_id`,`subject_name`),
  KEY `idx_type_status` (`alert_type`,`status`),
  CONSTRAINT `pt_alerts_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `pt_students` (`student_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `pt_application_ledger`
--

DROP TABLE IF EXISTS `pt_application_ledger`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pt_application_ledger` (
  `ledger_id` int NOT NULL AUTO_INCREMENT,
  `application_id` int NOT NULL,
  `transaction_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `transaction_type` enum('purchase','refund','xfer_out','xfer_in','usage','credit') NOT NULL,
  `sessions_changed` decimal(3,1) NOT NULL,
  `notes` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`ledger_id`),
  KEY `idx_application_id` (`application_id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `pt_grades`
--

DROP TABLE IF EXISTS `pt_grades`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pt_grades` (
  `grade_id` int NOT NULL AUTO_INCREMENT,
  `grade` tinyint NOT NULL,
  PRIMARY KEY (`grade_id`),
  UNIQUE KEY `grade` (`grade`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `pt_schedules`
--

DROP TABLE IF EXISTS `pt_schedules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pt_schedules` (
  `schedule_id` int NOT NULL AUTO_INCREMENT,
  `application_id` int NOT NULL,
  `student_id` int NOT NULL,
  `teacher_id` int NOT NULL,
  `subject_id` int NOT NULL,
  `start_time` datetime NOT NULL,
  `end_time` datetime NOT NULL,
  `scheduled_duration` decimal(3,1) NOT NULL DEFAULT '1.0',
  `status` enum('scheduled','cancelled','completed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'scheduled',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `display_title` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `color` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`schedule_id`),
  KEY `idx_student_subject` (`student_id`),
  KEY `idx_status` (`status`),
  KEY `idx_teacher_id` (`teacher_id`),
  CONSTRAINT `fk_pt_schedules_teacher_id` FOREIGN KEY (`teacher_id`) REFERENCES `pt_teachers` (`teacher_id`) ON DELETE RESTRICT,
  CONSTRAINT `pt_schedules_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `pt_students` (`student_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `pt_session_applications`
--

DROP TABLE IF EXISTS `pt_session_applications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pt_session_applications` (
  `application_id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `subject_id` int NOT NULL,
  `initial_sessions` int NOT NULL DEFAULT '1',
  `application_type` enum('initial','additional','transfer') COLLATE utf8mb4_unicode_ci DEFAULT 'initial',
  `status` enum('active','completed','cancelled') COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`application_id`),
  KEY `idx_student_subject` (`student_id`,`subject_id`),
  KEY `idx_status` (`status`),
  KEY `subject_id` (`subject_id`),
  CONSTRAINT `pt_session_applications_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `pt_students` (`student_id`) ON DELETE CASCADE,
  CONSTRAINT `pt_session_applications_ibfk_2` FOREIGN KEY (`subject_id`) REFERENCES `pt_subjects` (`subject_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `pt_session_audit`
--

DROP TABLE IF EXISTS `pt_session_audit`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pt_session_audit` (
  `audit_id` int NOT NULL AUTO_INCREMENT,
  `session_id` int NOT NULL,
  `action` enum('CREATED','CANCELLED','DURATION_UPDATED','NOTES_UPDATED','NO_SHOW') COLLATE utf8mb4_unicode_ci NOT NULL,
  `session_notes` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `teacher_id` int NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`audit_id`),
  KEY `idx_teacher_id` (`teacher_id`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `pt_session_summary`
--

DROP TABLE IF EXISTS `pt_session_summary`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pt_session_summary` (
  `summary_id` int NOT NULL AUTO_INCREMENT,
  `session_id` int NOT NULL,
  `start_time` datetime NOT NULL,
  `end_time` datetime NOT NULL,
  `duration_hours` decimal(3,1) NOT NULL,
  `student_id` int NOT NULL,
  `student_name` varchar(100) NOT NULL,
  `grade_id` int NOT NULL,
  `grade_name` varchar(50) NOT NULL,
  `teacher_id` int NOT NULL,
  `teacher_name` varchar(100) NOT NULL,
  `subject_id` int NOT NULL,
  `subject_name` varchar(100) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`summary_id`),
  KEY `idx_session_id` (`session_id`),
  KEY `fk_summary_grade` (`grade_id`),
  KEY `fk_summary_student` (`student_id`),
  KEY `fk_summary_teacher` (`teacher_id`),
  KEY `fk_summary_subject` (`subject_id`),
  CONSTRAINT `fk_summary_grade` FOREIGN KEY (`grade_id`) REFERENCES `pt_grades` (`grade_id`),
  CONSTRAINT `fk_summary_session` FOREIGN KEY (`session_id`) REFERENCES `pt_sessions` (`session_id`),
  CONSTRAINT `fk_summary_student` FOREIGN KEY (`student_id`) REFERENCES `pt_students` (`student_id`),
  CONSTRAINT `fk_summary_subject` FOREIGN KEY (`subject_id`) REFERENCES `pt_subjects` (`subject_id`),
  CONSTRAINT `fk_summary_teacher` FOREIGN KEY (`teacher_id`) REFERENCES `pt_teachers` (`teacher_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `pt_sessions`
--

DROP TABLE IF EXISTS `pt_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pt_sessions` (
  `session_id` int NOT NULL AUTO_INCREMENT,
  `application_id` int NOT NULL,
  `schedule_id` int DEFAULT NULL,
  `student_id` int NOT NULL,
  `grade_id` int NOT NULL,
  `teacher_id` int NOT NULL,
  `subject_id` int NOT NULL,
  `start_time` datetime NOT NULL,
  `end_time` datetime NOT NULL,
  `duration_hours` decimal(3,1) NOT NULL,
  `status` enum('completed','cancelled','no_show','teacher_cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'completed',
  `session_notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`session_id`),
  UNIQUE KEY `schedule_id` (`schedule_id`),
  KEY `idx_student_subject` (`student_id`),
  KEY `idx_status` (`status`),
  KEY `subject_id` (`subject_id`),
  KEY `fk_session_grade` (`grade_id`),
  CONSTRAINT `fk_session_grade` FOREIGN KEY (`grade_id`) REFERENCES `pt_grades` (`grade_id`),
  CONSTRAINT `pt_sessions_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `pt_students` (`student_id`) ON DELETE CASCADE,
  CONSTRAINT `pt_sessions_ibfk_2` FOREIGN KEY (`subject_id`) REFERENCES `pt_subjects` (`subject_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `pt_student_subjects`
--

DROP TABLE IF EXISTS `pt_student_subjects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pt_student_subjects` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `subject_id` int NOT NULL,
  `subject_level` enum('SL','HL') COLLATE utf8mb4_unicode_ci DEFAULT 'SL',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_student_subject` (`student_id`,`subject_id`),
  KEY `idx_student_id` (`student_id`),
  KEY `idx_subject_id` (`subject_id`),
  CONSTRAINT `pt_student_subjects_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `pt_students` (`student_id`) ON DELETE CASCADE,
  CONSTRAINT `pt_student_subjects_ibfk_2` FOREIGN KEY (`subject_id`) REFERENCES `pt_subjects` (`subject_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `pt_students`
--

DROP TABLE IF EXISTS `pt_students`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pt_students` (
  `student_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `grade_id` int DEFAULT NULL,
  `school` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `parent_phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`student_id`),
  KEY `idx_name` (`name`),
  KEY `idx_grade` (`grade_id`),
  CONSTRAINT `fk_students_grade` FOREIGN KEY (`grade_id`) REFERENCES `pt_grades` (`grade_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `pt_subjects`
--

DROP TABLE IF EXISTS `pt_subjects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pt_subjects` (
  `subject_id` int NOT NULL AUTO_INCREMENT,
  `subject_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `color` varchar(7) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`subject_id`),
  UNIQUE KEY `subject_name` (`subject_name`),
  KEY `idx_active` (`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=55 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `pt_teacher_subjects`
--

DROP TABLE IF EXISTS `pt_teacher_subjects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pt_teacher_subjects` (
  `teacher_subject_id` int NOT NULL AUTO_INCREMENT,
  `teacher_id` int NOT NULL,
  `subject_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`teacher_subject_id`),
  UNIQUE KEY `unique_teacher_subject` (`teacher_id`,`subject_id`),
  KEY `subject_id` (`subject_id`),
  CONSTRAINT `pt_teacher_subjects_ibfk_1` FOREIGN KEY (`teacher_id`) REFERENCES `pt_teachers` (`teacher_id`) ON DELETE CASCADE,
  CONSTRAINT `pt_teacher_subjects_ibfk_2` FOREIGN KEY (`subject_id`) REFERENCES `pt_subjects` (`subject_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `pt_teachers`
--

DROP TABLE IF EXISTS `pt_teachers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pt_teachers` (
  `teacher_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`teacher_id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `student_classes`
--

DROP TABLE IF EXISTS `student_classes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_classes` (
  `student_class_id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `class_id` int NOT NULL,
  `level_id` int NOT NULL,
  PRIMARY KEY (`student_class_id`),
  KEY `student_id` (`student_id`),
  KEY `class_id` (`class_id`),
  KEY `fk_student_classes_level_id` (`level_id`),
  CONSTRAINT `fk_student_classes_level_id` FOREIGN KEY (`level_id`) REFERENCES `levels` (`id`),
  CONSTRAINT `student_classes_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`) ON DELETE CASCADE,
  CONSTRAINT `student_classes_ibfk_2` FOREIGN KEY (`class_id`) REFERENCES `classes` (`class_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1746 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `student_comments`
--

DROP TABLE IF EXISTS `student_comments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_comments` (
  `comment_id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `teacher_id` int NOT NULL,
  `comment_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `comment_text` text,
  `subject_name` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`comment_id`),
  KEY `student_comments_fk_student_id` (`student_id`),
  KEY `student_comments_ibfk_2` (`teacher_id`),
  CONSTRAINT `student_comments_fk_student_id` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`) ON DELETE CASCADE,
  CONSTRAINT `student_comments_ibfk_2` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5735 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `student_homework_submission`
--

DROP TABLE IF EXISTS `student_homework_submission`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_homework_submission` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int DEFAULT NULL,
  `homework_id` int DEFAULT NULL,
  `submission_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `marks` int DEFAULT NULL,
  `raw_marks` int DEFAULT NULL,
  `raw_score` int DEFAULT NULL,
  `total_score` int DEFAULT NULL,
  `comment` text,
  `student_name` varchar(100) DEFAULT NULL,
  `file_name` varchar(255) DEFAULT NULL,
  `teacher_comment_file_name` varchar(255) DEFAULT NULL,
  `graded_by` varchar(255) DEFAULT NULL,
  `text_attachment` text,
  PRIMARY KEY (`id`),
  KEY `fk_student_id` (`student_id`),
  KEY `student_homework_submission_ibfk_2` (`homework_id`),
  CONSTRAINT `fk_student_id` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`),
  CONSTRAINT `student_homework_submission_ibfk_2` FOREIGN KEY (`homework_id`) REFERENCES `homework` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=17216 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `student_subjects`
--

DROP TABLE IF EXISTS `student_subjects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_subjects` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int DEFAULT NULL,
  `subject_id` int DEFAULT NULL,
  `level` varchar(10) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `subject_id` (`subject_id`),
  KEY `student_subjects_ibfk_1` (`student_id`),
  CONSTRAINT `student_subjects_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`) ON DELETE CASCADE,
  CONSTRAINT `student_subjects_ibfk_2` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`subject_id`)
) ENGINE=InnoDB AUTO_INCREMENT=717 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `student_time_slot`
--

DROP TABLE IF EXISTS `student_time_slot`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_time_slot` (
  `student_time_slot_id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `time_slot_id` int NOT NULL,
  PRIMARY KEY (`student_time_slot_id`),
  KEY `fk_time_slot` (`time_slot_id`),
  KEY `student_id` (`student_id`),
  CONSTRAINT `student_time_slot_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=677 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `students`
--

DROP TABLE IF EXISTS `students`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `students` (
  `student_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) DEFAULT NULL,
  `kakao_user_id` varchar(50) DEFAULT NULL,
  `kakao_thumbnail_url` varchar(255) DEFAULT NULL,
  `kakao_access_token` text,
  `kakao_refresh_token` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `duplicate` varchar(10) DEFAULT NULL,
  `grade` varchar(10) DEFAULT NULL,
  `school` text,
  `email` varchar(100) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`student_id`),
  UNIQUE KEY `kakao_user_id` (`kakao_user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=648 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `subjects`
--

DROP TABLE IF EXISTS `subjects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `subjects` (
  `subject_id` int NOT NULL AUTO_INCREMENT,
  `subject_name` varchar(100) NOT NULL,
  `fg_color` varchar(10) DEFAULT NULL,
  `bg_color` varchar(10) DEFAULT NULL,
  `gradient` varchar(10) DEFAULT NULL,
  PRIMARY KEY (`subject_id`)
) ENGINE=InnoDB AUTO_INCREMENT=38 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `teacher_time_slots`
--

DROP TABLE IF EXISTS `teacher_time_slots`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `teacher_time_slots` (
  `time_slot_id` int NOT NULL AUTO_INCREMENT,
  `day_id` int DEFAULT NULL,
  `teacher_id` int NOT NULL,
  `grade_id` int NOT NULL,
  `subject_id` int NOT NULL,
  `start_time` time NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`time_slot_id`),
  KEY `subject_id` (`subject_id`),
  KEY `fk_day_id` (`day_id`),
  KEY `teacher_id` (`teacher_id`),
  CONSTRAINT `fk_day_id` FOREIGN KEY (`day_id`) REFERENCES `days` (`day_id`) ON DELETE CASCADE,
  CONSTRAINT `teacher_time_slots_ibfk_2` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`subject_id`),
  CONSTRAINT `teacher_time_slots_ibfk_3` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2459 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `teachers`
--

DROP TABLE IF EXISTS `teachers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `teachers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `subject` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `zoom_user_id` varchar(100) DEFAULT NULL,
  `zoom_access_token` text,
  `zoom_refresh_token` text,
  `zoom_expires_in` datetime DEFAULT NULL,
  `username` varchar(100) NOT NULL,
  `password` varchar(255) DEFAULT NULL,
  `teacher_type` varchar(10) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=89 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `teachers_subjects`
--

DROP TABLE IF EXISTS `teachers_subjects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `teachers_subjects` (
  `teacher_id` int NOT NULL,
  `subject_id` int NOT NULL,
  PRIMARY KEY (`teacher_id`,`subject_id`),
  KEY `subject_id` (`subject_id`),
  CONSTRAINT `teachers_subjects_ibfk_1` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `teachers_subjects_ibfk_2` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`subject_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `time_slots`
--

DROP TABLE IF EXISTS `time_slots`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `time_slots` (
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `time_slot_id` varchar(36) NOT NULL,
  PRIMARY KEY (`time_slot_id`),
  UNIQUE KEY `uuid` (`time_slot_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `timetable`
--

DROP TABLE IF EXISTS `timetable`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `timetable` (
  `timetable_id` int NOT NULL AUTO_INCREMENT,
  `day_id` int NOT NULL,
  `time_slot_id` varchar(36) NOT NULL,
  `teacher_id` int NOT NULL,
  `class_id` int NOT NULL,
  PRIMARY KEY (`timetable_id`),
  KEY `timetable_ibfk_1` (`day_id`),
  KEY `fk_teacher_id` (`teacher_id`),
  KEY `fk_time_slot_id` (`time_slot_id`),
  KEY `fk_class_id` (`class_id`),
  CONSTRAINT `fk_class_id` FOREIGN KEY (`class_id`) REFERENCES `classes` (`class_id`),
  CONSTRAINT `fk_teacher_id` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`id`),
  CONSTRAINT `fk_time_slot_id` FOREIGN KEY (`time_slot_id`) REFERENCES `time_slots` (`time_slot_id`),
  CONSTRAINT `timetable_ibfk_1` FOREIGN KEY (`day_id`) REFERENCES `days` (`day_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5849 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-11-13  3:35:18
