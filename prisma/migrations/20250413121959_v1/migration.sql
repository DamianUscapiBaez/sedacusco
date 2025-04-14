-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "names" TEXT,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "roleId" INTEGER NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "id" SERIAL NOT NULL,
    "roleId" INTEGER NOT NULL,
    "permissionId" INTEGER NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" SERIAL NOT NULL,
    "inscription" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "customer_name" TEXT NOT NULL,
    "old_meter" TEXT NOT NULL,
    "observation" TEXT NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Technician" (
    "id" SERIAL NOT NULL,
    "dni" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Technician_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeterRenovation" (
    "id" SERIAL NOT NULL,
    "meter_number" TEXT NOT NULL,
    "verification_code" TEXT NOT NULL,

    CONSTRAINT "MeterRenovation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Act" (
    "id" SERIAL NOT NULL,
    "lot" TEXT NOT NULL,
    "file_number" TEXT NOT NULL,
    "file_date" DATE NOT NULL,
    "file_time" TIME,
    "meterrenovation_id" INTEGER NOT NULL,
    "reading" TEXT NOT NULL,
    "observations" TEXT NOT NULL,
    "rotating_pointer" TEXT NOT NULL,
    "meter_security_seal" TEXT NOT NULL,
    "reading_impossibility_viewer" TEXT NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "technician_id" INTEGER NOT NULL,
    "created_by" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Act_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PreCatastrals" (
    "id" SERIAL NOT NULL,
    "file_number" TEXT NOT NULL,
    "property" TEXT NOT NULL,
    "located_box" TEXT NOT NULL,
    "buried_connection" TEXT NOT NULL,
    "has_meter" TEXT NOT NULL,
    "reading" TEXT NOT NULL,
    "has_cover" TEXT NOT NULL,
    "cover_state" TEXT NOT NULL,
    "has_box" TEXT NOT NULL,
    "box_state" TEXT NOT NULL,
    "keys" TEXT NOT NULL,
    "cover_material" TEXT NOT NULL,
    "observations" TEXT NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "technician_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_located" TEXT NOT NULL,

    CONSTRAINT "PreCatastrals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActHistory" (
    "id" SERIAL NOT NULL,
    "act_id" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "updated_by" INTEGER NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PreCatastralHistory" (
    "id" SERIAL NOT NULL,
    "preCatastral_id" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "updated_by" INTEGER NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PreCatastralHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_key_key" ON "Permission"("key");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Act" ADD CONSTRAINT "Act_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Act" ADD CONSTRAINT "Act_meterrenovation_id_fkey" FOREIGN KEY ("meterrenovation_id") REFERENCES "MeterRenovation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Act" ADD CONSTRAINT "Act_technician_id_fkey" FOREIGN KEY ("technician_id") REFERENCES "Technician"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreCatastrals" ADD CONSTRAINT "PreCatastrals_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreCatastrals" ADD CONSTRAINT "PreCatastrals_technician_id_fkey" FOREIGN KEY ("technician_id") REFERENCES "Technician"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActHistory" ADD CONSTRAINT "ActHistory_act_id_fkey" FOREIGN KEY ("act_id") REFERENCES "Act"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActHistory" ADD CONSTRAINT "ActHistory_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreCatastralHistory" ADD CONSTRAINT "PreCatastralHistory_preCatastral_id_fkey" FOREIGN KEY ("preCatastral_id") REFERENCES "PreCatastrals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreCatastralHistory" ADD CONSTRAINT "PreCatastralHistory_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
