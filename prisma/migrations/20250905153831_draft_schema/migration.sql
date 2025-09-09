-- CreateEnum
CREATE TYPE "Role" AS ENUM ('platform_collaborator', 'platform_owner', 'platform_guest');

-- CreateEnum
CREATE TYPE "InviteStatus" AS ENUM ('pending', 'accepted');

-- CreateEnum
CREATE TYPE "ContextType" AS ENUM ('Event', 'EventMedia', 'EventInvitation', 'EventUsers', 'Account', 'GlobalAdmin');

-- CreateEnum
CREATE TYPE "PermissionType" AS ENUM ('Own', 'Write', 'Read', 'Delete', 'Execute');

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailHash" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "roleId" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Events" (
    "id" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "eventDescription" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "expiresIn" TIMESTAMP(3) NOT NULL,
    "eventWatermark" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ownerId" TEXT NOT NULL,

    CONSTRAINT "Events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventUsers" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eventId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,

    CONSTRAINT "EventUsers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventMidia" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "thumnbnailUrl" TEXT NOT NULL,
    "originalUrl" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,

    CONSTRAINT "EventMidia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventInvitation" (
    "id" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailHash" TEXT NOT NULL,
    "expiresIn" TIMESTAMP(3) NOT NULL,
    "inviteStatus" "InviteStatus" NOT NULL,
    "eventId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountPermission" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "context" "ContextType" NOT NULL,
    "permission" "PermissionType" NOT NULL,
    "createAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccountPermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountRole" (
    "id" TEXT NOT NULL,
    "name" "Role" NOT NULL,
    "createAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccountRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermissions" (
    "id" TEXT NOT NULL,
    "context" "ContextType" NOT NULL,
    "permission" "PermissionType" NOT NULL,
    "accountRoleId" TEXT NOT NULL,
    "createAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAr" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RolePermissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_emailHash_key" ON "Account"("emailHash");

-- CreateIndex
CREATE UNIQUE INDEX "EventUsers_eventId_accountId_key" ON "EventUsers"("eventId", "accountId");

-- CreateIndex
CREATE UNIQUE INDEX "AccountPermission_accountId_context_permission_key" ON "AccountPermission"("accountId", "context", "permission");

-- CreateIndex
CREATE UNIQUE INDEX "AccountRole_name_key" ON "AccountRole"("name");

-- CreateIndex
CREATE UNIQUE INDEX "RolePermissions_accountRoleId_context_permission_key" ON "RolePermissions"("accountRoleId", "context", "permission");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "AccountRole"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Events" ADD CONSTRAINT "Events_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventUsers" ADD CONSTRAINT "EventUsers_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventUsers" ADD CONSTRAINT "EventUsers_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventMidia" ADD CONSTRAINT "EventMidia_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventInvitation" ADD CONSTRAINT "EventInvitation_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountPermission" ADD CONSTRAINT "AccountPermission_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermissions" ADD CONSTRAINT "RolePermissions_accountRoleId_fkey" FOREIGN KEY ("accountRoleId") REFERENCES "AccountRole"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
