use sehanDB;

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
