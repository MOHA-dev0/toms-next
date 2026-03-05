-- CreateEnum
CREATE TYPE "AppRole" AS ENUM ('admin', 'sales', 'booking');

-- CreateEnum
CREATE TYPE "QuotationStatus" AS ENUM ('draft', 'sent', 'confirmed', 'cancelled');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');

-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('b2b', 'b2c');

-- CreateEnum
CREATE TYPE "VoucherType" AS ENUM ('hotel', 'transportation', 'other');

-- CreateEnum
CREATE TYPE "BoardType" AS ENUM ('ro', 'bb', 'hb', 'fb', 'ai');

-- CreateEnum
CREATE TYPE "RoomUsage" AS ENUM ('sgl', 'dbl', 'tpl', 'quad');

-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('pending', 'accepted', 'expired');

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('USD', 'EUR', 'TRY', 'SAR', 'AED', 'GBP');

-- CreateTable
CREATE TABLE "employee_invitations" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name_ar" TEXT NOT NULL,
    "phone" TEXT,
    "initial" TEXT,
    "role" "AppRole" NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "status" "InvitationStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" "AppRole" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employees" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name_ar" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "initial" TEXT NOT NULL,
    "reference_sequence" INTEGER NOT NULL DEFAULT 1,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cities" (
    "id" TEXT NOT NULL,
    "name_ar" TEXT NOT NULL,
    "name_tr" TEXT,
    "country_ar" TEXT NOT NULL DEFAULT 'تركيا',
    "country_tr" TEXT DEFAULT 'Türkiye',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hotels" (
    "id" TEXT NOT NULL,
    "city_id" TEXT NOT NULL,
    "name_ar" TEXT NOT NULL,
    "name_tr" TEXT,
    "address_ar" TEXT,
    "address_tr" TEXT,
    "stars" INTEGER,
    "phone" TEXT,
    "email" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hotels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "room_types" (
    "id" TEXT NOT NULL,
    "hotel_id" TEXT NOT NULL,
    "name_ar" TEXT NOT NULL,
    "name_tr" TEXT,
    "description_ar" TEXT,
    "max_occupancy" INTEGER NOT NULL DEFAULT 2,
    "board" TEXT DEFAULT 'bb',
    "base_price" DECIMAL(10,2) DEFAULT 0.00,
    "currency" "Currency" NOT NULL DEFAULT 'USD',
    "image_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "room_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "room_pricing" (
    "id" TEXT NOT NULL,
    "room_type_id" TEXT NOT NULL,
    "usage" "RoomUsage" NOT NULL,
    "board" "BoardType" NOT NULL,
    "purchase_price" DECIMAL(10,2) NOT NULL,
    "selling_price" DECIMAL(10,2) NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'USD',
    "valid_from" DATE NOT NULL,
    "valid_to" DATE NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "room_pricing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "services" (
    "id" TEXT NOT NULL,
    "city_id" TEXT NOT NULL,
    "name_ar" TEXT NOT NULL,
    "name_en" TEXT,
    "description_ar" TEXT,
    "purchase_price" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "currency" "Currency" NOT NULL DEFAULT 'USD',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description_en" TEXT,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "other_services" (
    "id" TEXT NOT NULL,
    "name_ar" TEXT NOT NULL,
    "name_en" TEXT,
    "description_ar" TEXT,
    "purchase_price" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "selling_price" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "currency" "Currency" NOT NULL DEFAULT 'USD',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "other_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agents" (
    "id" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "logo_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "name_ar" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT NOT NULL,
    "nationality" TEXT,
    "passport_number" TEXT,
    "notes" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotations" (
    "id" TEXT NOT NULL,
    "reference_number" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "sales_employee_id" TEXT NOT NULL,
    "agent_id" TEXT,
    "source" "SourceType" NOT NULL DEFAULT 'b2c',
    "destination_city_id" TEXT,
    "status" "QuotationStatus" NOT NULL DEFAULT 'draft',
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "adults" INTEGER NOT NULL DEFAULT 1,
    "children" INTEGER NOT NULL DEFAULT 0,
    "infants" INTEGER NOT NULL DEFAULT 0,
    "subtotal" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "commission_amount" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "total_price" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "profit" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "paid_amount" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "company_id" TEXT,

    CONSTRAINT "quotations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotation_hotels" (
    "id" TEXT NOT NULL,
    "quotation_id" TEXT NOT NULL,
    "hotel_id" TEXT NOT NULL,
    "room_type_id" TEXT NOT NULL,
    "room_pricing_id" TEXT,
    "check_in" DATE NOT NULL,
    "check_out" DATE NOT NULL,
    "nights" INTEGER NOT NULL DEFAULT 1,
    "rooms_count" INTEGER NOT NULL DEFAULT 1,
    "usage" "RoomUsage" NOT NULL DEFAULT 'dbl',
    "board" "BoardType" NOT NULL DEFAULT 'bb',
    "purchase_price" DECIMAL(10,2) NOT NULL,
    "selling_price" DECIMAL(10,2) NOT NULL,
    "notes" TEXT,
    "original_price" DECIMAL(10,2),
    "original_currency" "Currency",
    "exchange_rate" DECIMAL(10,6),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quotation_hotels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotation_services" (
    "id" TEXT NOT NULL,
    "quotation_id" TEXT NOT NULL,
    "service_id" TEXT,
    "provider_id" TEXT,
    "name_ar" TEXT NOT NULL,
    "description_ar" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "purchase_price" DECIMAL(10,2) NOT NULL,
    "selling_price" DECIMAL(10,2) NOT NULL,
    "service_date" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description_en" TEXT,

    CONSTRAINT "quotation_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotation_flights" (
    "id" TEXT NOT NULL,
    "quotation_id" TEXT NOT NULL,
    "departure_date" DATE NOT NULL,
    "description" TEXT,
    "flight_type" TEXT NOT NULL DEFAULT 'domestic',
    "passengers" INTEGER NOT NULL DEFAULT 1,
    "price" DECIMAL(10,2) NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'USD',
    "total_amount" DECIMAL(12,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quotation_flights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotation_cars" (
    "id" TEXT NOT NULL,
    "quotation_id" TEXT NOT NULL,
    "pickup_date" DATE NOT NULL,
    "dropoff_date" DATE NOT NULL,
    "description" TEXT,
    "days" INTEGER NOT NULL DEFAULT 1,
    "price_per_day" DECIMAL(10,2) NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'USD',
    "total_amount" DECIMAL(12,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quotation_cars_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotation_itinerary" (
    "id" TEXT NOT NULL,
    "quotation_id" TEXT NOT NULL,
    "day_number" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "title_ar" TEXT NOT NULL,
    "description_ar" TEXT,
    "city_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quotation_itinerary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" TEXT NOT NULL,
    "reference_number" TEXT NOT NULL,
    "quotation_id" TEXT NOT NULL,
    "booking_employee_id" TEXT NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'pending',
    "confirmed_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vouchers" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "voucher_type" "VoucherType" NOT NULL,
    "voucher_code" TEXT NOT NULL,
    "hotel_id" TEXT,
    "guest_name_ar" TEXT NOT NULL,
    "guest_name_tr" TEXT,
    "check_in" DATE,
    "check_out" DATE,
    "room_type_ar" TEXT,
    "room_type_tr" TEXT,
    "board_ar" TEXT,
    "board_tr" TEXT,
    "notes_ar" TEXT,
    "notes_tr" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vouchers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "quotation_id" TEXT,
    "customer_id" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "payment_method" TEXT NOT NULL DEFAULT 'نقدي',
    "payment_date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "receiver_name" TEXT,
    "reference_number" TEXT,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reference_sequences" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "last_sequence" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "reference_sequences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "global_room_types" (
    "id" TEXT NOT NULL,
    "name_ar" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "global_room_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotation_passengers" (
    "id" TEXT NOT NULL,
    "quotation_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'adult',
    "passport" TEXT,
    "age" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quotation_passengers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_sequences" (
    "key" TEXT NOT NULL,
    "last_seq" INTEGER NOT NULL DEFAULT 0,
    "prefix" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_sequences_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "service_providers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_quotationdestinations" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "employee_invitations_email_key" ON "employee_invitations"("email");

-- CreateIndex
CREATE UNIQUE INDEX "employee_invitations_token_key" ON "employee_invitations"("token");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_roles_user_id_role_key" ON "user_roles"("user_id", "role");

-- CreateIndex
CREATE UNIQUE INDEX "employees_user_id_key" ON "employees"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "employees_email_key" ON "employees"("email");

-- CreateIndex
CREATE INDEX "hotels_city_id_idx" ON "hotels"("city_id");

-- CreateIndex
CREATE INDEX "room_types_hotel_id_idx" ON "room_types"("hotel_id");

-- CreateIndex
CREATE INDEX "room_pricing_room_type_id_idx" ON "room_pricing"("room_type_id");

-- CreateIndex
CREATE INDEX "services_city_id_idx" ON "services"("city_id");

-- CreateIndex
CREATE INDEX "customers_created_by_idx" ON "customers"("created_by");

-- CreateIndex
CREATE UNIQUE INDEX "quotations_reference_number_key" ON "quotations"("reference_number");

-- CreateIndex
CREATE INDEX "quotations_agent_id_idx" ON "quotations"("agent_id");

-- CreateIndex
CREATE INDEX "quotations_company_id_idx" ON "quotations"("company_id");

-- CreateIndex
CREATE INDEX "quotations_customer_id_idx" ON "quotations"("customer_id");

-- CreateIndex
CREATE INDEX "quotations_destination_city_id_idx" ON "quotations"("destination_city_id");

-- CreateIndex
CREATE INDEX "quotations_sales_employee_id_idx" ON "quotations"("sales_employee_id");

-- CreateIndex
CREATE INDEX "quotations_status_idx" ON "quotations"("status");

-- CreateIndex
CREATE INDEX "quotations_updated_at_idx" ON "quotations"("updated_at" DESC);

-- CreateIndex
CREATE INDEX "quotation_hotels_hotel_id_idx" ON "quotation_hotels"("hotel_id");

-- CreateIndex
CREATE INDEX "quotation_hotels_quotation_id_idx" ON "quotation_hotels"("quotation_id");

-- CreateIndex
CREATE INDEX "quotation_hotels_room_pricing_id_idx" ON "quotation_hotels"("room_pricing_id");

-- CreateIndex
CREATE INDEX "quotation_hotels_room_type_id_idx" ON "quotation_hotels"("room_type_id");

-- CreateIndex
CREATE INDEX "quotation_services_quotation_id_idx" ON "quotation_services"("quotation_id");

-- CreateIndex
CREATE INDEX "quotation_services_service_id_idx" ON "quotation_services"("service_id");

-- CreateIndex
CREATE INDEX "quotation_services_provider_id_idx" ON "quotation_services"("provider_id");

-- CreateIndex
CREATE INDEX "quotation_flights_quotation_id_idx" ON "quotation_flights"("quotation_id");

-- CreateIndex
CREATE INDEX "quotation_cars_quotation_id_idx" ON "quotation_cars"("quotation_id");

-- CreateIndex
CREATE INDEX "quotation_itinerary_city_id_idx" ON "quotation_itinerary"("city_id");

-- CreateIndex
CREATE INDEX "quotation_itinerary_quotation_id_idx" ON "quotation_itinerary"("quotation_id");

-- CreateIndex
CREATE UNIQUE INDEX "bookings_reference_number_key" ON "bookings"("reference_number");

-- CreateIndex
CREATE INDEX "bookings_booking_employee_id_idx" ON "bookings"("booking_employee_id");

-- CreateIndex
CREATE INDEX "bookings_quotation_id_idx" ON "bookings"("quotation_id");

-- CreateIndex
CREATE UNIQUE INDEX "vouchers_voucher_code_key" ON "vouchers"("voucher_code");

-- CreateIndex
CREATE INDEX "vouchers_booking_id_idx" ON "vouchers"("booking_id");

-- CreateIndex
CREATE INDEX "vouchers_created_by_idx" ON "vouchers"("created_by");

-- CreateIndex
CREATE INDEX "vouchers_hotel_id_idx" ON "vouchers"("hotel_id");

-- CreateIndex
CREATE INDEX "payments_created_by_idx" ON "payments"("created_by");

-- CreateIndex
CREATE INDEX "payments_customer_id_idx" ON "payments"("customer_id");

-- CreateIndex
CREATE INDEX "payments_quotation_id_idx" ON "payments"("quotation_id");

-- CreateIndex
CREATE UNIQUE INDEX "reference_sequences_employee_id_year_key" ON "reference_sequences"("employee_id", "year");

-- CreateIndex
CREATE INDEX "quotation_passengers_quotation_id_idx" ON "quotation_passengers"("quotation_id");

-- CreateIndex
CREATE UNIQUE INDEX "_quotationdestinations_AB_unique" ON "_quotationdestinations"("A", "B");

-- CreateIndex
CREATE INDEX "_quotationdestinations_B_index" ON "_quotationdestinations"("B");

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hotels" ADD CONSTRAINT "hotels_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_types" ADD CONSTRAINT "room_types_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_pricing" ADD CONSTRAINT "room_pricing_room_type_id_fkey" FOREIGN KEY ("room_type_id") REFERENCES "room_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_destination_city_id_fkey" FOREIGN KEY ("destination_city_id") REFERENCES "cities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_sales_employee_id_fkey" FOREIGN KEY ("sales_employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotation_hotels" ADD CONSTRAINT "quotation_hotels_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotation_hotels" ADD CONSTRAINT "quotation_hotels_quotation_id_fkey" FOREIGN KEY ("quotation_id") REFERENCES "quotations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotation_hotels" ADD CONSTRAINT "quotation_hotels_room_pricing_id_fkey" FOREIGN KEY ("room_pricing_id") REFERENCES "room_pricing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotation_hotels" ADD CONSTRAINT "quotation_hotels_room_type_id_fkey" FOREIGN KEY ("room_type_id") REFERENCES "room_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotation_services" ADD CONSTRAINT "quotation_services_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "service_providers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotation_services" ADD CONSTRAINT "quotation_services_quotation_id_fkey" FOREIGN KEY ("quotation_id") REFERENCES "quotations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotation_services" ADD CONSTRAINT "quotation_services_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotation_flights" ADD CONSTRAINT "quotation_flights_quotation_id_fkey" FOREIGN KEY ("quotation_id") REFERENCES "quotations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotation_cars" ADD CONSTRAINT "quotation_cars_quotation_id_fkey" FOREIGN KEY ("quotation_id") REFERENCES "quotations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotation_itinerary" ADD CONSTRAINT "quotation_itinerary_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotation_itinerary" ADD CONSTRAINT "quotation_itinerary_quotation_id_fkey" FOREIGN KEY ("quotation_id") REFERENCES "quotations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_booking_employee_id_fkey" FOREIGN KEY ("booking_employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_quotation_id_fkey" FOREIGN KEY ("quotation_id") REFERENCES "quotations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vouchers" ADD CONSTRAINT "vouchers_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vouchers" ADD CONSTRAINT "vouchers_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vouchers" ADD CONSTRAINT "vouchers_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_quotation_id_fkey" FOREIGN KEY ("quotation_id") REFERENCES "quotations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reference_sequences" ADD CONSTRAINT "reference_sequences_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotation_passengers" ADD CONSTRAINT "quotation_passengers_quotation_id_fkey" FOREIGN KEY ("quotation_id") REFERENCES "quotations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_quotationdestinations" ADD CONSTRAINT "_quotationdestinations_A_fkey" FOREIGN KEY ("A") REFERENCES "cities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_quotationdestinations" ADD CONSTRAINT "_quotationdestinations_B_fkey" FOREIGN KEY ("B") REFERENCES "quotations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
