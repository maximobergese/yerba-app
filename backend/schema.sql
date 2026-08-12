-- Script de creación de la base de datos para Ronda de Yerbas
-- Ejecutar esto una sola vez en tu servidor MySQL.

CREATE DATABASE IF NOT EXISTS ronda_yerbas
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE ronda_yerbas;

CREATE TABLE IF NOT EXISTS opiniones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(60) NOT NULL,
  apellido VARCHAR(60) NOT NULL,
  ubicacion VARCHAR(80) NOT NULL,
  marca VARCHAR(60) NOT NULL,
  estrellas TINYINT NOT NULL CHECK (estrellas BETWEEN 1 AND 5),
  texto VARCHAR(600) NOT NULL,
  oculta BOOLEAN NOT NULL DEFAULT FALSE,
  fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_fecha (fecha_creacion),
  INDEX idx_oculta (oculta)
) ENGINE=InnoDB;
