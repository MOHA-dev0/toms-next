-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "invoice_needs_update" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "bookings_status_created_at_idx" ON "bookings"("status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "bookings_reference_number_idx" ON "bookings"("reference_number");
