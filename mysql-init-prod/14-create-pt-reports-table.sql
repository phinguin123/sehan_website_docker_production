-- Create pt_reports table for Private Tutoring Reports feature
-- This table stores progress reports that can be saved as drafts or sent to parents

USE sehanDB;

CREATE TABLE IF NOT EXISTS pt_reports (
    report_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    subject_id INT NOT NULL,
    predicted_grade_level ENUM('low', 'mid', 'high') NOT NULL,
    predicted_grade_min_level ENUM('low', 'mid', 'high') NULL,
    predicted_grade_min INT NOT NULL CHECK (predicted_grade_min >= 1 AND predicted_grade_min <= 7),
    predicted_grade_max_level ENUM('low', 'mid', 'high') NULL,
    predicted_grade_max INT NOT NULL CHECK (predicted_grade_max >= 1 AND predicted_grade_max <= 7),
    parent_message TEXT NOT NULL,
    summary_points JSON NOT NULL,
    action_plan_points JSON NOT NULL,
    status ENUM('draft', 'sent') DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    sent_at TIMESTAMP NULL,
    FOREIGN KEY (student_id) REFERENCES pt_students(student_id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES pt_subjects(subject_id) ON DELETE CASCADE,
    INDEX idx_student_subject (student_id, subject_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Note: If table already exists, run these ALTER statements separately
-- ALTER TABLE pt_reports 
-- ADD COLUMN predicted_grade_min_level ENUM('low', 'mid', 'high') NULL AFTER predicted_grade_level;
-- ALTER TABLE pt_reports 
-- ADD COLUMN predicted_grade_max_level ENUM('low', 'mid', 'high') NULL AFTER predicted_grade_max;

