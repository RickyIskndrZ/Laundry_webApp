CREATE DATABASE IF NOT EXISTS laundry_app;
USE laundry_app;

CREATE TABLE IF NOT EXISTS level (
    id_level INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    level_name VARCHAR(255) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user (
    id_user INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    id_level INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT user_id_level_fkey FOREIGN KEY (id_level) REFERENCES level (id_level) ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS customer (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    customer_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS type_of_service (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    service_name VARCHAR(255) NOT NULL,
    price DECIMAL(15,2) NOT NULL,
    description TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS trans_order (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    id_customer INT NOT NULL,
    order_code VARCHAR(50) NOT NULL UNIQUE,
    order_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    order_end_date DATETIME NULL,
    order_status INT NOT NULL DEFAULT 0,
    order_pay DECIMAL(15,2) NULL,
    order_change DECIMAL(15,2) NULL,
    total DECIMAL(15,2) NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT trans_order_id_customer_fkey FOREIGN KEY (id_customer) REFERENCES customer (id) ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS trans_order_detail (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    id_order INT NOT NULL,
    id_service INT NOT NULL,
    qty DECIMAL(10,2) NOT NULL DEFAULT 0,
    subtotal DECIMAL(15,2) NOT NULL DEFAULT 0,
    notes TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT trans_order_detail_id_order_fkey FOREIGN KEY (id_order) REFERENCES trans_order (id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT trans_order_detail_id_service_fkey FOREIGN KEY (id_service) REFERENCES type_of_service (id) ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS trans_laundry_pickup (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    id_order INT NOT NULL,
    id_customer INT NOT NULL,
    id_user INT NULL,
    pickup_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    notes TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT trans_laundry_pickup_id_order_fkey FOREIGN KEY (id_order) REFERENCES trans_order (id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT trans_laundry_pickup_id_customer_fkey FOREIGN KEY (id_customer) REFERENCES customer (id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT trans_laundry_pickup_id_user_fkey FOREIGN KEY (id_user) REFERENCES user (id_user) ON DELETE SET NULL ON UPDATE CASCADE
);

-- Seed Initial Data
INSERT IGNORE INTO level (id_level, level_name) VALUES (1, 'Admin'), (2, 'Operator'), (3, 'Pimpinan');

-- Seed Admin User (Password is hashed for 'password123' standard across these projects usually)
-- Let's check AuthController to see if they use bcrypt. Yes, usually bcrypt. 
-- For simplicity, let's just insert one admin, but wait, the SQLite database might already have an admin.
-- Let's export data from SQLite to MySQL directly if possible. Or I will just seed standard data.
