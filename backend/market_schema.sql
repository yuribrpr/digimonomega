CREATE TABLE IF NOT EXISTS `market_listings` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `seller_id` int NOT NULL,
  `listing_type` enum('item','digimon') NOT NULL,
  `item_id` int DEFAULT NULL,
  `digimon_id` int DEFAULT NULL,
  `quantity` int DEFAULT '1',
  `price` int NOT NULL,
  `status` enum('active','sold','cancelled') DEFAULT 'active',
  `buyer_id` int DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `sold_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `market_listings_seller_id_foreign` (`seller_id`),
  KEY `market_listings_item_id_foreign` (`item_id`),
  KEY `market_listings_digimon_id_foreign` (`digimon_id`),
  KEY `market_listings_buyer_id_foreign` (`buyer_id`),
  CONSTRAINT `market_listings_seller_id_foreign` FOREIGN KEY (`seller_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `market_listings_item_id_foreign` FOREIGN KEY (`item_id`) REFERENCES `items` (`id`) ON DELETE CASCADE,
  CONSTRAINT `market_listings_digimon_id_foreign` FOREIGN KEY (`digimon_id`) REFERENCES `user_digimons` (`id`) ON DELETE CASCADE,
  CONSTRAINT `market_listings_buyer_id_foreign` FOREIGN KEY (`buyer_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `market_notifications` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `message` text NOT NULL,
  `is_read` tinyint(1) DEFAULT '0',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `market_notifications_user_id_foreign` (`user_id`),
  CONSTRAINT `market_notifications_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

ALTER TABLE `user_digimons` ADD COLUMN `is_in_market` tinyint(1) DEFAULT '0';
