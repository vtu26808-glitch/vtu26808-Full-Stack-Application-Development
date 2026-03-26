-- ============================================================
-- Real-Time Event Synchronization Engine - Database Schema
-- ============================================================

CREATE DATABASE IF NOT EXISTS event_sync_engine
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE event_sync_engine;

-- -----------------------------------------------------------
-- Users table
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    username    VARCHAR(50)  NOT NULL UNIQUE,
    email       VARCHAR(100) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,
    avatar_color VARCHAR(7)  DEFAULT '#6C63FF',
    created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- -----------------------------------------------------------
-- Events table
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS events (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    title       VARCHAR(150) NOT NULL,
    description TEXT,
    category    ENUM('meeting','workshop','webinar','social','other') DEFAULT 'other',
    status      ENUM('upcoming','ongoing','completed','cancelled') DEFAULT 'upcoming',
    event_date  DATETIME     NOT NULL,
    location    VARCHAR(200),
    created_by  INT          NOT NULL,
    created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- -----------------------------------------------------------
-- Event Updates (audit log for status changes)
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS event_updates (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    event_id    INT          NOT NULL,
    user_id     INT          NOT NULL,
    old_status  VARCHAR(20),
    new_status  VARCHAR(20)  NOT NULL,
    message     TEXT,
    created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id)  REFERENCES users(id)  ON DELETE CASCADE
) ENGINE=InnoDB;

-- -----------------------------------------------------------
-- Notifications
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT          NOT NULL,
    event_id    INT,
    message     VARCHAR(255) NOT NULL,
    is_read     TINYINT(1)   DEFAULT 0,
    created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id)  REFERENCES users(id)  ON DELETE CASCADE,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL
) ENGINE=InnoDB;
