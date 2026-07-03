-- CreateEnum
CREATE TYPE "SwapType" AS ENUM ('TARGETED', 'OPEN');

-- AlterTable
ALTER TABLE "org_settings" ADD COLUMN     "swapExpiryHours" INTEGER NOT NULL DEFAULT 72;

-- AlterTable
ALTER TABLE "shifts" ADD COLUMN     "actualBreakMinutes" INTEGER,
ADD COLUMN     "actualEndTime" TIMESTAMP(3),
ADD COLUMN     "actualStartTime" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "swap_requests" ADD COLUMN     "swapType" "SwapType" NOT NULL DEFAULT 'TARGETED',
ALTER COLUMN "recipientEmployeeId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "staffing_demands" (
    "id" TEXT NOT NULL,
    "weeklyPlanId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "categoryId" TEXT NOT NULL,
    "requiredCount" INTEGER NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staffing_demands_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "staffing_demands_weeklyPlanId_idx" ON "staffing_demands"("weeklyPlanId");

-- CreateIndex
CREATE INDEX "staffing_demands_date_idx" ON "staffing_demands"("date");

-- CreateIndex
CREATE INDEX "staffing_demands_categoryId_idx" ON "staffing_demands"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "staffing_demands_weeklyPlanId_date_categoryId_startTime_key" ON "staffing_demands"("weeklyPlanId", "date", "categoryId", "startTime");

-- CreateIndex
CREATE INDEX "swap_requests_swapType_status_idx" ON "swap_requests"("swapType", "status");

-- AddForeignKey
ALTER TABLE "staffing_demands" ADD CONSTRAINT "staffing_demands_weeklyPlanId_fkey" FOREIGN KEY ("weeklyPlanId") REFERENCES "weekly_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staffing_demands" ADD CONSTRAINT "staffing_demands_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
