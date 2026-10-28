-- Run this only against the local XAMPP/MariaDB server while connected as
-- a database administrator. It creates a separate empty staging database
-- and a least-privilege account; it does not modify digiink_crm.
CREATE DATABASE IF NOT EXISTS `digiink_crm_staging`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'digiink_staging'@'127.0.0.1'
  IDENTIFIED BY 'REPLACE_WITH_URL_SAFE_RANDOM_PASSWORD';

GRANT ALL PRIVILEGES ON `digiink_crm_staging`.*
  TO 'digiink_staging'@'127.0.0.1';

FLUSH PRIVILEGES;
