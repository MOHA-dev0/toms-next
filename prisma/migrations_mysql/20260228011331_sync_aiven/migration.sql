-- AlterTable
ALTER TABLE `payments` ADD COLUMN `receiver_name` VARCHAR(191) NULL,
    ADD COLUMN `reference_number` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `quotation_services` ADD COLUMN `description_en` TEXT NULL,
    MODIFY `description_ar` TEXT NULL;

-- AlterTable
ALTER TABLE `quotations` ADD COLUMN `company_id` VARCHAR(191) NULL,
    ADD COLUMN `paid_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00;

-- AlterTable
ALTER TABLE `services` ADD COLUMN `description_en` TEXT NULL,
    MODIFY `description_ar` TEXT NULL;

-- CreateTable
CREATE TABLE `_QuotationDestinations` (
    `A` VARCHAR(191) NOT NULL,
    `B` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`A`, `B`),

    UNIQUE INDEX `_QuotationDestinations_AB_unique`(`A`, `B`),
    INDEX `_QuotationDestinations_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `quotations_company_id_fkey` ON `quotations`(`company_id`);

-- AddForeignKey
ALTER TABLE `quotations` ADD CONSTRAINT `quotations_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_QuotationDestinations` ADD CONSTRAINT `_QuotationDestinations_A_fkey` FOREIGN KEY (`A`) REFERENCES `cities`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_QuotationDestinations` ADD CONSTRAINT `_QuotationDestinations_B_fkey` FOREIGN KEY (`B`) REFERENCES `quotations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
