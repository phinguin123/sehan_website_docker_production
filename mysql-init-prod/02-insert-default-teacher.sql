-- Insert default teacher: phinguin
-- Password: phinguin (bcrypt hashed)

USE sehanDB;

-- Insert default teacher with bcrypt hashed password
INSERT INTO `pt_teachers` (`name`, `username`, `password_hash`) 
VALUES ('phinguin', 'phinguin', '$2b$12$ygwL1d3eIf59hg5y3G1W/eOV4zxVTpUy3gyM/ADAFzHmI9oXU6F.m')
ON DUPLICATE KEY UPDATE 
    `name` = 'phinguin',
    `password_hash` = '$2b$12$ygwL1d3eIf59hg5y3G1W/eOV4zxVTpUy3gyM/ADAFzHmI9oXU6F.m',
    `updated_at` = CURRENT_TIMESTAMP;










