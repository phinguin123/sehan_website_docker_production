-- MySQL dump 10.13  Distrib 8.0.44, for Linux (x86_64)
--
-- Host: sehan-ibp-database.cnei022gkt6q.ap-northeast-2.rds.amazonaws.com    Database: sehanDB
-- ------------------------------------------------------
-- Server version	8.0.43

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
SET @MYSQLDUMP_TEMP_LOG_BIN = @@SESSION.SQL_LOG_BIN;
SET @@SESSION.SQL_LOG_BIN= 0;

--
-- GTID state at the beginning of the backup 
--

SET @@GLOBAL.GTID_PURGED=/*!80000 '+'*/ '';

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
  `class_id` int DEFAULT NULL,
  `subject_id` int DEFAULT NULL,
  `level_id` int DEFAULT NULL,
  `mode_id` int DEFAULT NULL,
  `grade_id` int DEFAULT NULL,
  `day_id` int DEFAULT NULL,
  `time_slot_id` varchar(36) DEFAULT NULL,
  `start_time` time DEFAULT NULL,
  `end_time` time DEFAULT NULL,
  `teacher_id` int DEFAULT NULL,
  PRIMARY KEY (`attendance_id`),
  KEY `fk_student` (`student_id`),
  KEY `idx_class_id` (`class_id`),
  KEY `idx_subject_id` (`subject_id`),
  KEY `idx_level_id` (`level_id`),
  KEY `idx_mode_id` (`mode_id`),
  KEY `idx_grade_id` (`grade_id`),
  KEY `idx_day_id` (`day_id`),
  KEY `idx_time_slot_id` (`time_slot_id`),
  KEY `idx_teacher_id` (`teacher_id`),
  KEY `idx_attendance_date_class` (`attendance_date`,`class_id`),
  KEY `idx_attendance_date_subject` (`attendance_date`,`subject_id`),
  KEY `fk_attendance_timetable` (`timetable_id`),
  CONSTRAINT `fk_attendance_class` FOREIGN KEY (`class_id`) REFERENCES `classes` (`class_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_attendance_day` FOREIGN KEY (`day_id`) REFERENCES `days` (`day_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_attendance_grade` FOREIGN KEY (`grade_id`) REFERENCES `grades` (`grade_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_attendance_level` FOREIGN KEY (`level_id`) REFERENCES `levels` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_attendance_mode` FOREIGN KEY (`mode_id`) REFERENCES `modes` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_attendance_subject` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`subject_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_attendance_teacher` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_attendance_time_slot` FOREIGN KEY (`time_slot_id`) REFERENCES `time_slots` (`time_slot_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_attendance_timetable` FOREIGN KEY (`timetable_id`) REFERENCES `timetable` (`timetable_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=39486 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `attendance`
--

LOCK TABLES `attendance` WRITE;
/*!40000 ALTER TABLE `attendance` DISABLE KEYS */;
/*!40000 ALTER TABLE `attendance` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `attendance_code`
--

LOCK TABLES `attendance_code` WRITE;
/*!40000 ALTER TABLE `attendance_code` DISABLE KEYS */;
INSERT INTO `attendance_code` VALUES (1,'4561','2026-01-12 06:11:09');
/*!40000 ALTER TABLE `attendance_code` ENABLE KEYS */;
UNLOCK TABLES;

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
  UNIQUE KEY `unique_class_combo` (`subject_id`,`level_id`,`grade_id`,`mode_id`),
  KEY `classes_ibfk_2` (`level_id`),
  KEY `classes_ibfk_3` (`mode_id`),
  KEY `classes_ibfk_4` (`grade_id`),
  CONSTRAINT `classes_ibfk_1` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`subject_id`) ON DELETE CASCADE,
  CONSTRAINT `classes_ibfk_2` FOREIGN KEY (`level_id`) REFERENCES `levels` (`id`) ON DELETE CASCADE,
  CONSTRAINT `classes_ibfk_3` FOREIGN KEY (`mode_id`) REFERENCES `modes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `classes_ibfk_4` FOREIGN KEY (`grade_id`) REFERENCES `grades` (`grade_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=102 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `classes`
--

LOCK TABLES `classes` WRITE;
/*!40000 ALTER TABLE `classes` DISABLE KEYS */;
/*!40000 ALTER TABLE `classes` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `days`
--

LOCK TABLES `days` WRITE;
/*!40000 ALTER TABLE `days` DISABLE KEYS */;
INSERT INTO `days` VALUES (5,'Friday'),(1,'Monday'),(6,'Saturday'),(7,'Sunday'),(4,'Thursday'),(2,'Tuesday'),(3,'Wednesday');
/*!40000 ALTER TABLE `days` ENABLE KEYS */;
UNLOCK TABLES;

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
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `grades`
--

LOCK TABLES `grades` WRITE;
/*!40000 ALTER TABLE `grades` DISABLE KEYS */;
INSERT INTO `grades` VALUES (1,'11'),(2,'12'),(3,'pre-IB'),(4,'MYP');
/*!40000 ALTER TABLE `grades` ENABLE KEYS */;
UNLOCK TABLES;

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
) ENGINE=InnoDB AUTO_INCREMENT=1759 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `homework`
--

LOCK TABLES `homework` WRITE;
/*!40000 ALTER TABLE `homework` DISABLE KEYS */;
/*!40000 ALTER TABLE `homework` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `levels`
--

LOCK TABLES `levels` WRITE;
/*!40000 ALTER TABLE `levels` DISABLE KEYS */;
INSERT INTO `levels` VALUES (1,'SL'),(2,'HL'),(3,'SL/HL');
/*!40000 ALTER TABLE `levels` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `modes`
--

LOCK TABLES `modes` WRITE;
/*!40000 ALTER TABLE `modes` DISABLE KEYS */;
INSERT INTO `modes` VALUES (1,'Online'),(2,'Offline');
/*!40000 ALTER TABLE `modes` ENABLE KEYS */;
UNLOCK TABLES;

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
) ENGINE=InnoDB AUTO_INCREMENT=666 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `parents`
--

LOCK TABLES `parents` WRITE;
/*!40000 ALTER TABLE `parents` DISABLE KEYS */;
/*!40000 ALTER TABLE `parents` ENABLE KEYS */;
UNLOCK TABLES;

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
) ENGINE=InnoDB AUTO_INCREMENT=753 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `parents_students`
--

LOCK TABLES `parents_students` WRITE;
/*!40000 ALTER TABLE `parents_students` DISABLE KEYS */;
/*!40000 ALTER TABLE `parents_students` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `settings`
--

DROP TABLE IF EXISTS `settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `settings` (
  `setting_key` varchar(255) NOT NULL,
  `setting_value` text,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `settings`
--

LOCK TABLES `settings` WRITE;
/*!40000 ALTER TABLE `settings` DISABLE KEYS */;
INSERT INTO `settings` VALUES ('report_notice_text','안녕하세요. 겨울특강 1주차 레포트카드 보내드립니다.\n만약 PDF파일 다운로드가 안되는 경우 \nwww.sehanib.kr/parent 접속 후 겨울특강 등록 시 알려주신 학부모님 이메일과 비밀번호 2550으로 로그인 하시면 됩니다.\n\n*그래도 다운로드 안되거나 문의사항은 카카오톡 채널로 연락 바랍니다.','2025-12-23 02:53:32');
/*!40000 ALTER TABLE `settings` ENABLE KEYS */;
UNLOCK TABLES;

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
) ENGINE=InnoDB AUTO_INCREMENT=2270 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_classes`
--

LOCK TABLES `student_classes` WRITE;
/*!40000 ALTER TABLE `student_classes` DISABLE KEYS */;
/*!40000 ALTER TABLE `student_classes` ENABLE KEYS */;
UNLOCK TABLES;

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
) ENGINE=InnoDB AUTO_INCREMENT=6777 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_comments`
--

LOCK TABLES `student_comments` WRITE;
/*!40000 ALTER TABLE `student_comments` DISABLE KEYS */;
/*!40000 ALTER TABLE `student_comments` ENABLE KEYS */;
UNLOCK TABLES;

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
) ENGINE=InnoDB AUTO_INCREMENT=20577 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_homework_submission`
--

LOCK TABLES `student_homework_submission` WRITE;
/*!40000 ALTER TABLE `student_homework_submission` DISABLE KEYS */;
/*!40000 ALTER TABLE `student_homework_submission` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `student_subjects`
--

LOCK TABLES `student_subjects` WRITE;
/*!40000 ALTER TABLE `student_subjects` DISABLE KEYS */;
/*!40000 ALTER TABLE `student_subjects` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `student_time_slot`
--

LOCK TABLES `student_time_slot` WRITE;
/*!40000 ALTER TABLE `student_time_slot` DISABLE KEYS */;
/*!40000 ALTER TABLE `student_time_slot` ENABLE KEYS */;
UNLOCK TABLES;

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
) ENGINE=InnoDB AUTO_INCREMENT=855 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `students`
--

LOCK TABLES `students` WRITE;
/*!40000 ALTER TABLE `students` DISABLE KEYS */;
/*!40000 ALTER TABLE `students` ENABLE KEYS */;
UNLOCK TABLES;

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
) ENGINE=InnoDB AUTO_INCREMENT=42 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `subjects`
--

LOCK TABLES `subjects` WRITE;
/*!40000 ALTER TABLE `subjects` DISABLE KEYS */;
INSERT INTO `subjects` VALUES (4,'Biology','#77E900','#1B330C','#E0FE52'),(5,'Business','#FF9100','#3B2100','#FFC247'),(6,'Chemistry','#ffcdfe','#380C10','#fa5c96'),(7,'CompSci','#c94aff','#6a0e78','#d096ff'),(8,'Economics','#FF5733','#330D00','#FFA07A'),(9,'English A','#4A90E2','#0C1F33','#87CEFA'),(10,'Math AA','#FFD700','#332B00','#FFF68F'),(11,'Korean LL','#FF1493','#330033','#FF69B4'),(12,'Physics','#63D6F8','#112B33','#75FBB0'),(13,'English B','#32CD32','#0B330B3','#90EE90'),(14,'Korean Lit','#8A2BE2','#1A0033','#9370DB'),(15,'Math AI','#FF4500','#330F00','#FF7F50'),(16,'Manager','#000000','#000000','#000000'),(17,'Pre-Math','#ffe8f7','#330014','#FFC0CB'),(18,'Pre-English','#afeeee','#002F33','#00ced1'),(28,'Math AA PS','#77E900','#1B330C','#E0FE52'),(29,'English A PS','#77E900','#1B330C','#E0FE52'),(30,'English B PS','#77E900','#1B330C','#E0FE52'),(31,'Physics PS','#77E900','#1B330C','#E0FE52'),(32,'Biology PS','#77E900','#1B330C','#E0FE52'),(33,'Chemistry PS','#77E900','#1B330C','#E0FE52'),(34,'Economics PS','#77E900','#1B330C','#E0FE52'),(35,'Pre-Math PS','#77E900','#1B330C','#E0FE52'),(36,'Pre-English PS','#77E900','#1B330C','#E0FE52'),(38,'MYP English','#5DADE2','#154360','#D6EAF8'),(39,'MYP Science','#48C9B0','#0E6251','#A3E4D7'),(40,'MYP Math','#F5B041','#7D6608','#F9E79F'),(41,'MYP CompSci','#AF7AC5','#5B2C6F','#EBDEF0');
/*!40000 ALTER TABLE `subjects` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `teacher_time_slots`
--

LOCK TABLES `teacher_time_slots` WRITE;
/*!40000 ALTER TABLE `teacher_time_slots` DISABLE KEYS */;
/*!40000 ALTER TABLE `teacher_time_slots` ENABLE KEYS */;
UNLOCK TABLES;

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
) ENGINE=InnoDB AUTO_INCREMENT=101 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `teachers`
--

LOCK TABLES `teachers` WRITE;
/*!40000 ALTER TABLE `teachers` DISABLE KEYS */;
INSERT INTO `teachers` VALUES (10,'Jitae','CompSci','2024-11-02 19:59:53','koysr20@gmail.com','eyJzdiI6IjAwMDAwMiIsImFsZyI6IkhTNTEyIiwidiI6IjIuMCIsImtpZCI6IjdiMjc2YTNkLTAxZDMtNDIyOC1iYTNiLWZmYzRhYzEzZDdhOCJ9.eyJhdWQiOiJodHRwczovL29hdXRoLnpvb20udXMiLCJ1aWQiOiJiMWJmRmhIZVFqYXAtMWpwZDJVbGNRIiwidmVyIjoxMCwiYXVpZCI6IjllYTZjMDQ3ZWY3NjkxOGU2OGU4YjMxNzY1OTYxMWY1MDQ4MDM5NjAyMTFlODY0M2JjOTBmYTMxYmY1Mzk5NjQiLCJuYmYiOjE3NDY3NjA4NDMsImNvZGUiOiJiejJ6ZEVoNWV3dHJaTVNYTUdmUnM2UnZMa2Z3OUdHTVEiLCJpc3MiOiJ6bTpjaWQ6em1CbXF6VFdpM2hmbTc3b2JseEEiLCJnbm8iOjAsImV4cCI6MTc0Njc2NDQ0MywidHlwZSI6MCwiaWF0IjoxNzQ2NzYwODQzLCJhaWQiOiJUWERIbFZRRlI5dXFuWGV0NWhNMW1BIn0.260W_gVDcq1J_ym1IJoCf6_AZVrT6EiyusaC6ghwm5mnpGc4V1Kcq5VTG3xwgXCLDZaqbUUrFwXYPWrHQjNYAw','eyJzdiI6IjAwMDAwMiIsImFsZyI6IkhTNTEyIiwidiI6IjIuMCIsImtpZCI6ImQxMzBlM2Q4LTcwMjMtNDQyNC05YWFiLWMzOGZlZmU0OWU4NCJ9.eyJhdWQiOiJodHRwczovL29hdXRoLnpvb20udXMiLCJ1aWQiOiJiMWJmRmhIZVFqYXAtMWpwZDJVbGNRIiwidmVyIjoxMCwiYXVpZCI6IjllYTZjMDQ3ZWY3NjkxOGU2OGU4YjMxNzY1OTYxMWY1MDQ4MDM5NjAyMTFlODY0M2JjOTBmYTMxYmY1Mzk5NjQiLCJuYmYiOjE3NDY3NjA4NDMsImNvZGUiOiJiejJ6ZEVoNWV3dHJaTVNYTUdmUnM2UnZMa2Z3OUdHTVEiLCJpc3MiOiJ6bTpjaWQ6em1CbXF6VFdpM2hmbTc3b2JseEEiLCJnbm8iOjAsImV4cCI6MTc1NDUzNjg0MywidHlwZSI6MSwiaWF0IjoxNzQ2NzYwODQzLCJhaWQiOiJUWERIbFZRRlI5dXFuWGV0NWhNMW1BIn0.a0tG9IbVV8VZ2jXRjGP_q0ALqHU4MA517ItzCwNWUNqQrqMxw1qk857UIMXbkOWZhRYyuVPiXzsTaaxvMuQVzA','2025-05-09 13:20:42','test1','test1','teacher');
/*!40000 ALTER TABLE `teachers` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `teachers_subjects`
--

LOCK TABLES `teachers_subjects` WRITE;
/*!40000 ALTER TABLE `teachers_subjects` DISABLE KEYS */;
INSERT INTO `teachers_subjects` VALUES (10,7);
/*!40000 ALTER TABLE `teachers_subjects` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `time_slots`
--

LOCK TABLES `time_slots` WRITE;
/*!40000 ALTER TABLE `time_slots` DISABLE KEYS */;
/*!40000 ALTER TABLE `time_slots` ENABLE KEYS */;
UNLOCK TABLES;

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
) ENGINE=InnoDB AUTO_INCREMENT=6727 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `timetable`
--

LOCK TABLES `timetable` WRITE;
/*!40000 ALTER TABLE `timetable` DISABLE KEYS */;
/*!40000 ALTER TABLE `timetable` ENABLE KEYS */;
UNLOCK TABLES;
SET @@SESSION.SQL_LOG_BIN = @MYSQLDUMP_TEMP_LOG_BIN;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-01-14  3:04:25
