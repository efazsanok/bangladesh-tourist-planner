-- Weather & Budget-Smart Bangladesh Tourist Planner - database schema (MySQL / XAMPP)
CREATE DATABASE IF NOT EXISTS tourist_planner CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE tourist_planner;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS expenses, itinerary_items, trips, wishlist, climate_monthly,
  transport_costs, hotels, attractions, destinations, users;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('tourist','admin') NOT NULL DEFAULT 'tourist',
  home_city VARCHAR(100) NULL,
  travel_style ENUM('beach','hill','heritage','nature') NULL,
  budget_min INT NULL,
  budget_max INT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE destinations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  division VARCHAR(50) NOT NULL,
  category ENUM('beach','hill','heritage','nature') NOT NULL,
  best_season ENUM('winter','summer','monsoon','year_round') NOT NULL DEFAULT 'winter',
  budget_level ENUM('low','medium','high') NOT NULL DEFAULT 'medium',
  description TEXT NULL,
  image_url VARCHAR(500) NULL,
  gallery_urls TEXT NULL,
  latitude DOUBLE NOT NULL,
  longitude DOUBLE NOT NULL,
  travel_tips TEXT NULL,
  food_per_day INT NOT NULL DEFAULT 600,          -- per person, BDT
  local_transport_per_day INT NOT NULL DEFAULT 400, -- per group, BDT
  activities_per_day INT NOT NULL DEFAULT 400,    -- per person, BDT
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_dest_division (division),
  INDEX idx_dest_category (category),
  INDEX idx_dest_budget (budget_level)
);

CREATE TABLE attractions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  destination_id INT NOT NULL,
  name VARCHAR(150) NOT NULL,
  description VARCHAR(500) NULL,
  is_outdoor TINYINT(1) NOT NULL DEFAULT 1,
  est_cost INT NOT NULL DEFAULT 0,
  FOREIGN KEY (destination_id) REFERENCES destinations(id) ON DELETE CASCADE,
  INDEX idx_attr_dest (destination_id)
);

CREATE TABLE hotels (
  id INT AUTO_INCREMENT PRIMARY KEY,
  destination_id INT NOT NULL,
  name VARCHAR(150) NOT NULL,
  category ENUM('budget','standard','luxury') NOT NULL,
  price_per_night INT NOT NULL,
  FOREIGN KEY (destination_id) REFERENCES destinations(id) ON DELETE CASCADE,
  INDEX idx_hotel_dest (destination_id, category)
);

CREATE TABLE transport_costs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  destination_id INT NOT NULL,
  mode ENUM('bus','train','air','launch') NOT NULL,
  cost_per_person INT NOT NULL,                   -- one way, from Dhaka, BDT
  UNIQUE KEY uq_transport (destination_id, mode),
  FOREIGN KEY (destination_id) REFERENCES destinations(id) ON DELETE CASCADE
);

CREATE TABLE climate_monthly (
  id INT AUTO_INCREMENT PRIMARY KEY,
  destination_id INT NOT NULL,
  month TINYINT NOT NULL,
  avg_temp_c DOUBLE NOT NULL,
  avg_rainfall_mm DOUBLE NOT NULL,
  avg_humidity DOUBLE NOT NULL,
  UNIQUE KEY uq_climate (destination_id, month),
  FOREIGN KEY (destination_id) REFERENCES destinations(id) ON DELETE CASCADE
);

CREATE TABLE wishlist (
  user_id INT NOT NULL,
  destination_id INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, destination_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (destination_id) REFERENCES destinations(id) ON DELETE CASCADE
);

CREATE TABLE trips (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(120) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  travelers INT NOT NULL DEFAULT 1,
  total_budget INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_trip_user (user_id, start_date)
);

CREATE TABLE itinerary_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  trip_id INT NOT NULL,
  destination_id INT NOT NULL,
  attraction_id INT NULL,
  day_number INT NOT NULL,
  position INT NOT NULL DEFAULT 1,
  title VARCHAR(150) NOT NULL,
  activity_type ENUM('outdoor','indoor') NOT NULL DEFAULT 'outdoor',
  start_time TIME NULL,
  est_cost INT NOT NULL DEFAULT 0,
  notes VARCHAR(500) NULL,
  FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
  FOREIGN KEY (destination_id) REFERENCES destinations(id),
  FOREIGN KEY (attraction_id) REFERENCES attractions(id) ON DELETE SET NULL,
  INDEX idx_item_trip (trip_id, day_number, position)
);

CREATE TABLE expenses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  trip_id INT NOT NULL,
  category ENUM('transport','accommodation','food','activities','other') NOT NULL,
  amount INT NOT NULL,
  description VARCHAR(200) NULL,
  spent_on DATE NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
  INDEX idx_exp_trip (trip_id, spent_on)
);
