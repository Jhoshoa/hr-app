-- CreateEnum
CREATE TYPE "RecordStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "EmployeeStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'TERMINATED');

-- CreateEnum
CREATE TYPE "CompensationFrequency" AS ENUM ('HOURLY', 'MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "CompensationVisibility" AS ENUM ('HR_ONLY', 'HR_AND_FINANCE', 'HR_FINANCE_MANAGER');

-- CreateEnum
CREATE TYPE "CustomFieldType" AS ENUM ('TEXT', 'NUMBER', 'DATE', 'BOOLEAN', 'SELECT');

-- CreateEnum
CREATE TYPE "CustomFieldVisibility" AS ENUM ('HR_ONLY', 'MANAGER_VISIBLE', 'EMPLOYEE_VISIBLE');

-- CreateTable
CREATE TABLE "Department" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "parentDepartmentId" UUID,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Location" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'BO',
    "city" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'America/La_Paz',
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobTitle" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "level" TEXT,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobTitle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmploymentType" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmploymentType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkMode" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkMode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientProject" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Employee" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "userId" UUID,
    "employeeNumber" TEXT NOT NULL,
    "status" "EmployeeStatus" NOT NULL DEFAULT 'ACTIVE',
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "workEmail" TEXT NOT NULL,
    "personalEmail" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "terminationDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeProfile" (
    "employeeId" UUID NOT NULL,
    "birthDate" TIMESTAMP(3),
    "phone" TEXT,
    "address" TEXT,
    "emergencyContactName" TEXT,
    "emergencyContactPhone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeeProfile_pkey" PRIMARY KEY ("employeeId")
);

-- CreateTable
CREATE TABLE "EmployeeJobAssignment" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "employeeId" UUID NOT NULL,
    "departmentId" UUID,
    "jobTitleId" UUID,
    "locationId" UUID,
    "employmentTypeId" UUID,
    "workModeId" UUID,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeeJobAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManagerRelationship" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "employeeId" UUID NOT NULL,
    "managerEmployeeId" UUID NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ManagerRelationship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompensationRecord" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "employeeId" UUID NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BOB',
    "frequency" "CompensationFrequency" NOT NULL DEFAULT 'MONTHLY',
    "visibility" "CompensationVisibility" NOT NULL DEFAULT 'HR_ONLY',
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompensationRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeCustomFieldDefinition" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" "CustomFieldType" NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "visibility" "CustomFieldVisibility" NOT NULL DEFAULT 'HR_ONLY',
    "options" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeeCustomFieldDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeCustomFieldValue" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "employeeId" UUID NOT NULL,
    "fieldDefinitionId" UUID NOT NULL,
    "value" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeeCustomFieldValue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientAssignment" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "employeeId" UUID NOT NULL,
    "clientProjectId" UUID NOT NULL,
    "role" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Department_tenantId_status_idx" ON "Department"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Department_tenantId_name_key" ON "Department"("tenantId", "name");

-- CreateIndex
CREATE INDEX "Location_tenantId_status_idx" ON "Location"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Location_tenantId_name_key" ON "Location"("tenantId", "name");

-- CreateIndex
CREATE INDEX "JobTitle_tenantId_status_idx" ON "JobTitle"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "JobTitle_tenantId_name_key" ON "JobTitle"("tenantId", "name");

-- CreateIndex
CREATE INDEX "EmploymentType_tenantId_status_idx" ON "EmploymentType"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "EmploymentType_tenantId_name_key" ON "EmploymentType"("tenantId", "name");

-- CreateIndex
CREATE INDEX "WorkMode_tenantId_status_idx" ON "WorkMode"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "WorkMode_tenantId_name_key" ON "WorkMode"("tenantId", "name");

-- CreateIndex
CREATE INDEX "ClientProject_tenantId_status_idx" ON "ClientProject"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ClientProject_tenantId_name_key" ON "ClientProject"("tenantId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "ClientProject_tenantId_code_key" ON "ClientProject"("tenantId", "code");

-- CreateIndex
CREATE INDEX "Employee_tenantId_status_idx" ON "Employee"("tenantId", "status");

-- CreateIndex
CREATE INDEX "Employee_tenantId_lastName_firstName_idx" ON "Employee"("tenantId", "lastName", "firstName");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_tenantId_employeeNumber_key" ON "Employee"("tenantId", "employeeNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_tenantId_workEmail_key" ON "Employee"("tenantId", "workEmail");

-- CreateIndex
CREATE INDEX "EmployeeJobAssignment_tenantId_employeeId_effectiveFrom_idx" ON "EmployeeJobAssignment"("tenantId", "employeeId", "effectiveFrom");

-- CreateIndex
CREATE INDEX "EmployeeJobAssignment_tenantId_departmentId_idx" ON "EmployeeJobAssignment"("tenantId", "departmentId");

-- CreateIndex
CREATE INDEX "EmployeeJobAssignment_tenantId_jobTitleId_idx" ON "EmployeeJobAssignment"("tenantId", "jobTitleId");

-- CreateIndex
CREATE INDEX "ManagerRelationship_tenantId_employeeId_effectiveFrom_idx" ON "ManagerRelationship"("tenantId", "employeeId", "effectiveFrom");

-- CreateIndex
CREATE INDEX "ManagerRelationship_tenantId_managerEmployeeId_idx" ON "ManagerRelationship"("tenantId", "managerEmployeeId");

-- CreateIndex
CREATE INDEX "CompensationRecord_tenantId_employeeId_effectiveFrom_idx" ON "CompensationRecord"("tenantId", "employeeId", "effectiveFrom");

-- CreateIndex
CREATE INDEX "EmployeeCustomFieldDefinition_tenantId_idx" ON "EmployeeCustomFieldDefinition"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeCustomFieldDefinition_tenantId_key_key" ON "EmployeeCustomFieldDefinition"("tenantId", "key");

-- CreateIndex
CREATE INDEX "EmployeeCustomFieldValue_tenantId_employeeId_idx" ON "EmployeeCustomFieldValue"("tenantId", "employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeCustomFieldValue_employeeId_fieldDefinitionId_key" ON "EmployeeCustomFieldValue"("employeeId", "fieldDefinitionId");

-- CreateIndex
CREATE INDEX "ClientAssignment_tenantId_employeeId_idx" ON "ClientAssignment"("tenantId", "employeeId");

-- CreateIndex
CREATE INDEX "ClientAssignment_tenantId_clientProjectId_idx" ON "ClientAssignment"("tenantId", "clientProjectId");

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_parentDepartmentId_fkey" FOREIGN KEY ("parentDepartmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobTitle" ADD CONSTRAINT "JobTitle_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmploymentType" ADD CONSTRAINT "EmploymentType_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkMode" ADD CONSTRAINT "WorkMode_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientProject" ADD CONSTRAINT "ClientProject_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeProfile" ADD CONSTRAINT "EmployeeProfile_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeJobAssignment" ADD CONSTRAINT "EmployeeJobAssignment_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeJobAssignment" ADD CONSTRAINT "EmployeeJobAssignment_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeJobAssignment" ADD CONSTRAINT "EmployeeJobAssignment_jobTitleId_fkey" FOREIGN KEY ("jobTitleId") REFERENCES "JobTitle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeJobAssignment" ADD CONSTRAINT "EmployeeJobAssignment_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeJobAssignment" ADD CONSTRAINT "EmployeeJobAssignment_employmentTypeId_fkey" FOREIGN KEY ("employmentTypeId") REFERENCES "EmploymentType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeJobAssignment" ADD CONSTRAINT "EmployeeJobAssignment_workModeId_fkey" FOREIGN KEY ("workModeId") REFERENCES "WorkMode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManagerRelationship" ADD CONSTRAINT "ManagerRelationship_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManagerRelationship" ADD CONSTRAINT "ManagerRelationship_managerEmployeeId_fkey" FOREIGN KEY ("managerEmployeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompensationRecord" ADD CONSTRAINT "CompensationRecord_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeCustomFieldValue" ADD CONSTRAINT "EmployeeCustomFieldValue_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeCustomFieldValue" ADD CONSTRAINT "EmployeeCustomFieldValue_fieldDefinitionId_fkey" FOREIGN KEY ("fieldDefinitionId") REFERENCES "EmployeeCustomFieldDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientAssignment" ADD CONSTRAINT "ClientAssignment_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientAssignment" ADD CONSTRAINT "ClientAssignment_clientProjectId_fkey" FOREIGN KEY ("clientProjectId") REFERENCES "ClientProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
