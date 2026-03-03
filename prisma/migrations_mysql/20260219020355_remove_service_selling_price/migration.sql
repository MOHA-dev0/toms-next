-- CreateTable
CREATE TABLE `employee_invitations` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `name_ar` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `initial` VARCHAR(191) NULL,
    `role` ENUM('admin', 'sales', 'booking') NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `status` ENUM('pending', 'accepted', 'expired') NOT NULL DEFAULT 'pending',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `employee_invitations_email_key`(`email`),
    UNIQUE INDEX `employee_invitations_token_key`(`token`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_roles` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `role` ENUM('admin', 'sales', 'booking') NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `user_roles_user_id_role_key`(`user_id`, `role`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `employees` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `name_ar` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `initial` VARCHAR(191) NOT NULL,
    `reference_sequence` INTEGER NOT NULL DEFAULT 1,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `employees_user_id_key`(`user_id`),
    UNIQUE INDEX `employees_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cities` (
    `id` VARCHAR(191) NOT NULL,
    `name_ar` VARCHAR(191) NOT NULL,
    `name_tr` VARCHAR(191) NULL,
    `country_ar` VARCHAR(191) NOT NULL DEFAULT 'تركيا',
    `country_tr` VARCHAR(191) NULL DEFAULT 'Türkiye',
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `hotels` (
    `id` VARCHAR(191) NOT NULL,
    `city_id` VARCHAR(191) NOT NULL,
    `name_ar` VARCHAR(191) NOT NULL,
    `name_tr` VARCHAR(191) NULL,
    `address_ar` VARCHAR(191) NULL,
    `address_tr` VARCHAR(191) NULL,
    `stars` INTEGER NULL,
    `phone` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `room_types` (
    `id` VARCHAR(191) NOT NULL,
    `hotel_id` VARCHAR(191) NOT NULL,
    `name_ar` VARCHAR(191) NOT NULL,
    `name_tr` VARCHAR(191) NULL,
    `description_ar` VARCHAR(191) NULL,
    `max_occupancy` INTEGER NOT NULL DEFAULT 2,
    `board` VARCHAR(191) NULL DEFAULT 'bb',
    `base_price` DECIMAL(10, 2) NULL DEFAULT 0,
    `currency` ENUM('USD', 'EUR', 'TRY', 'SAR', 'AED', 'GBP') NOT NULL DEFAULT 'USD',
    `image_url` VARCHAR(191) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `room_pricing` (
    `id` VARCHAR(191) NOT NULL,
    `room_type_id` VARCHAR(191) NOT NULL,
    `usage` ENUM('sgl', 'dbl', 'tpl', 'quad') NOT NULL,
    `board` ENUM('ro', 'bb', 'hb', 'fb', 'ai') NOT NULL,
    `purchase_price` DECIMAL(10, 2) NOT NULL,
    `selling_price` DECIMAL(10, 2) NOT NULL,
    `currency` ENUM('USD', 'EUR', 'TRY', 'SAR', 'AED', 'GBP') NOT NULL DEFAULT 'USD',
    `valid_from` DATE NOT NULL,
    `valid_to` DATE NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `services` (
    `id` VARCHAR(191) NOT NULL,
    `city_id` VARCHAR(191) NOT NULL,
    `name_ar` VARCHAR(191) NOT NULL,
    `name_en` VARCHAR(191) NULL,
    `description_ar` VARCHAR(191) NULL,
    `purchase_price` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `currency` ENUM('USD', 'EUR', 'TRY', 'SAR', 'AED', 'GBP') NOT NULL DEFAULT 'USD',
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `other_services` (
    `id` VARCHAR(191) NOT NULL,
    `name_ar` VARCHAR(191) NOT NULL,
    `name_en` VARCHAR(191) NULL,
    `description_ar` VARCHAR(191) NULL,
    `purchase_price` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `selling_price` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `currency` ENUM('USD', 'EUR', 'TRY', 'SAR', 'AED', 'GBP') NOT NULL DEFAULT 'USD',
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `agents` (
    `id` VARCHAR(191) NOT NULL,
    `name_en` VARCHAR(191) NOT NULL,
    `logo_url` VARCHAR(191) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `customers` (
    `id` VARCHAR(191) NOT NULL,
    `name_ar` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NOT NULL,
    `nationality` VARCHAR(191) NULL,
    `passport_number` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `created_by` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `quotations` (
    `id` VARCHAR(191) NOT NULL,
    `reference_number` VARCHAR(191) NOT NULL,
    `customer_id` VARCHAR(191) NOT NULL,
    `sales_employee_id` VARCHAR(191) NOT NULL,
    `agent_id` VARCHAR(191) NULL,
    `source` ENUM('b2b', 'b2c') NOT NULL DEFAULT 'b2c',
    `destination_city_id` VARCHAR(191) NULL,
    `status` ENUM('draft', 'sent', 'confirmed', 'cancelled') NOT NULL DEFAULT 'draft',
    `start_date` DATE NOT NULL,
    `end_date` DATE NOT NULL,
    `adults` INTEGER NOT NULL DEFAULT 1,
    `children` INTEGER NOT NULL DEFAULT 0,
    `infants` INTEGER NOT NULL DEFAULT 0,
    `subtotal` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `commission_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `total_price` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `profit` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `notes` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `quotations_reference_number_key`(`reference_number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `quotation_hotels` (
    `id` VARCHAR(191) NOT NULL,
    `quotation_id` VARCHAR(191) NOT NULL,
    `hotel_id` VARCHAR(191) NOT NULL,
    `room_type_id` VARCHAR(191) NOT NULL,
    `room_pricing_id` VARCHAR(191) NULL,
    `check_in` DATE NOT NULL,
    `check_out` DATE NOT NULL,
    `nights` INTEGER NOT NULL DEFAULT 1,
    `rooms_count` INTEGER NOT NULL DEFAULT 1,
    `usage` ENUM('sgl', 'dbl', 'tpl', 'quad') NOT NULL DEFAULT 'dbl',
    `board` ENUM('ro', 'bb', 'hb', 'fb', 'ai') NOT NULL DEFAULT 'bb',
    `purchase_price` DECIMAL(10, 2) NOT NULL,
    `selling_price` DECIMAL(10, 2) NOT NULL,
    `notes` TEXT NULL,
    `original_price` DECIMAL(10, 2) NULL,
    `original_currency` ENUM('USD', 'EUR', 'TRY', 'SAR', 'AED', 'GBP') NULL,
    `exchange_rate` DECIMAL(10, 6) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `quotation_services` (
    `id` VARCHAR(191) NOT NULL,
    `quotation_id` VARCHAR(191) NOT NULL,
    `service_id` VARCHAR(191) NULL,
    `name_ar` VARCHAR(191) NOT NULL,
    `description_ar` VARCHAR(191) NULL,
    `quantity` INTEGER NOT NULL DEFAULT 1,
    `purchase_price` DECIMAL(10, 2) NOT NULL,
    `selling_price` DECIMAL(10, 2) NOT NULL,
    `service_date` DATE NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `quotation_flights` (
    `id` VARCHAR(191) NOT NULL,
    `quotation_id` VARCHAR(191) NOT NULL,
    `airline_ar` VARCHAR(191) NOT NULL,
    `flight_number` VARCHAR(191) NULL,
    `departure_city` VARCHAR(191) NOT NULL,
    `arrival_city` VARCHAR(191) NOT NULL,
    `departure_date` DATE NOT NULL,
    `departure_time` TIME NULL,
    `arrival_time` TIME NULL,
    `passengers` INTEGER NOT NULL DEFAULT 1,
    `purchase_price` DECIMAL(10, 2) NOT NULL,
    `selling_price` DECIMAL(10, 2) NOT NULL,
    `notes` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `quotation_cars` (
    `id` VARCHAR(191) NOT NULL,
    `quotation_id` VARCHAR(191) NOT NULL,
    `car_type_ar` VARCHAR(191) NOT NULL,
    `pickup_location` VARCHAR(191) NOT NULL,
    `dropoff_location` VARCHAR(191) NULL,
    `pickup_date` DATE NOT NULL,
    `dropoff_date` DATE NOT NULL,
    `days` INTEGER NOT NULL DEFAULT 1,
    `purchase_price` DECIMAL(10, 2) NOT NULL,
    `selling_price` DECIMAL(10, 2) NOT NULL,
    `notes` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `quotation_itinerary` (
    `id` VARCHAR(191) NOT NULL,
    `quotation_id` VARCHAR(191) NOT NULL,
    `day_number` INTEGER NOT NULL,
    `date` DATE NOT NULL,
    `title_ar` VARCHAR(191) NOT NULL,
    `description_ar` TEXT NULL,
    `city_id` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bookings` (
    `id` VARCHAR(191) NOT NULL,
    `reference_number` VARCHAR(191) NOT NULL,
    `quotation_id` VARCHAR(191) NOT NULL,
    `booking_employee_id` VARCHAR(191) NOT NULL,
    `status` ENUM('pending', 'confirmed', 'cancelled', 'completed') NOT NULL DEFAULT 'pending',
    `confirmed_at` DATETIME(3) NULL,
    `notes` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `bookings_reference_number_key`(`reference_number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vouchers` (
    `id` VARCHAR(191) NOT NULL,
    `booking_id` VARCHAR(191) NOT NULL,
    `voucher_type` ENUM('hotel', 'transportation', 'other') NOT NULL,
    `voucher_code` VARCHAR(191) NOT NULL,
    `hotel_id` VARCHAR(191) NULL,
    `guest_name_ar` VARCHAR(191) NOT NULL,
    `guest_name_tr` VARCHAR(191) NULL,
    `check_in` DATE NULL,
    `check_out` DATE NULL,
    `room_type_ar` VARCHAR(191) NULL,
    `room_type_tr` VARCHAR(191) NULL,
    `board_ar` VARCHAR(191) NULL,
    `board_tr` VARCHAR(191) NULL,
    `notes_ar` TEXT NULL,
    `notes_tr` TEXT NULL,
    `created_by` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `vouchers_voucher_code_key`(`voucher_code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payments` (
    `id` VARCHAR(191) NOT NULL,
    `quotation_id` VARCHAR(191) NULL,
    `customer_id` VARCHAR(191) NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `payment_method` VARCHAR(191) NOT NULL DEFAULT 'نقدي',
    `payment_date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `notes` TEXT NULL,
    `created_by` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reference_sequences` (
    `id` VARCHAR(191) NOT NULL,
    `employee_id` VARCHAR(191) NOT NULL,
    `year` INTEGER NOT NULL,
    `last_sequence` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `reference_sequences_employee_id_year_key`(`employee_id`, `year`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `global_room_types` (
    `id` VARCHAR(191) NOT NULL,
    `name_ar` VARCHAR(191) NOT NULL,
    `name_en` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `companies` (
    `id` VARCHAR(191) NOT NULL,
    `name_en` VARCHAR(191) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `quotation_passengers` (
    `id` VARCHAR(191) NOT NULL,
    `quotation_id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL DEFAULT 'adult',
    `passport` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `system_sequences` (
    `key` VARCHAR(191) NOT NULL,
    `last_seq` INTEGER NOT NULL DEFAULT 0,
    `prefix` VARCHAR(191) NOT NULL,
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `user_roles` ADD CONSTRAINT `user_roles_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `employees` ADD CONSTRAINT `employees_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `hotels` ADD CONSTRAINT `hotels_city_id_fkey` FOREIGN KEY (`city_id`) REFERENCES `cities`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `room_types` ADD CONSTRAINT `room_types_hotel_id_fkey` FOREIGN KEY (`hotel_id`) REFERENCES `hotels`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `room_pricing` ADD CONSTRAINT `room_pricing_room_type_id_fkey` FOREIGN KEY (`room_type_id`) REFERENCES `room_types`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `services` ADD CONSTRAINT `services_city_id_fkey` FOREIGN KEY (`city_id`) REFERENCES `cities`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `customers` ADD CONSTRAINT `customers_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `employees`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `quotations` ADD CONSTRAINT `quotations_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `quotations` ADD CONSTRAINT `quotations_sales_employee_id_fkey` FOREIGN KEY (`sales_employee_id`) REFERENCES `employees`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `quotations` ADD CONSTRAINT `quotations_agent_id_fkey` FOREIGN KEY (`agent_id`) REFERENCES `agents`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `quotations` ADD CONSTRAINT `quotations_destination_city_id_fkey` FOREIGN KEY (`destination_city_id`) REFERENCES `cities`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `quotation_hotels` ADD CONSTRAINT `quotation_hotels_quotation_id_fkey` FOREIGN KEY (`quotation_id`) REFERENCES `quotations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `quotation_hotels` ADD CONSTRAINT `quotation_hotels_hotel_id_fkey` FOREIGN KEY (`hotel_id`) REFERENCES `hotels`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `quotation_hotels` ADD CONSTRAINT `quotation_hotels_room_type_id_fkey` FOREIGN KEY (`room_type_id`) REFERENCES `room_types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `quotation_hotels` ADD CONSTRAINT `quotation_hotels_room_pricing_id_fkey` FOREIGN KEY (`room_pricing_id`) REFERENCES `room_pricing`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `quotation_services` ADD CONSTRAINT `quotation_services_quotation_id_fkey` FOREIGN KEY (`quotation_id`) REFERENCES `quotations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `quotation_services` ADD CONSTRAINT `quotation_services_service_id_fkey` FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `quotation_flights` ADD CONSTRAINT `quotation_flights_quotation_id_fkey` FOREIGN KEY (`quotation_id`) REFERENCES `quotations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `quotation_cars` ADD CONSTRAINT `quotation_cars_quotation_id_fkey` FOREIGN KEY (`quotation_id`) REFERENCES `quotations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `quotation_itinerary` ADD CONSTRAINT `quotation_itinerary_quotation_id_fkey` FOREIGN KEY (`quotation_id`) REFERENCES `quotations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `quotation_itinerary` ADD CONSTRAINT `quotation_itinerary_city_id_fkey` FOREIGN KEY (`city_id`) REFERENCES `cities`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bookings` ADD CONSTRAINT `bookings_quotation_id_fkey` FOREIGN KEY (`quotation_id`) REFERENCES `quotations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bookings` ADD CONSTRAINT `bookings_booking_employee_id_fkey` FOREIGN KEY (`booking_employee_id`) REFERENCES `employees`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vouchers` ADD CONSTRAINT `vouchers_booking_id_fkey` FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vouchers` ADD CONSTRAINT `vouchers_hotel_id_fkey` FOREIGN KEY (`hotel_id`) REFERENCES `hotels`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vouchers` ADD CONSTRAINT `vouchers_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `employees`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_quotation_id_fkey` FOREIGN KEY (`quotation_id`) REFERENCES `quotations`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `employees`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reference_sequences` ADD CONSTRAINT `reference_sequences_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `quotation_passengers` ADD CONSTRAINT `quotation_passengers_quotation_id_fkey` FOREIGN KEY (`quotation_id`) REFERENCES `quotations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
