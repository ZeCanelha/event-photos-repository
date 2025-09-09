import { ContextType, PermissionType, PrismaClient } from "@prisma/client";
import { Request, Response, NextFunction, RequestHandler } from "express";
import { IGetUserAuthInfoRequest, JWTClaims } from "types/auth";

export const permissions = (
  requiredContext: ContextType,
  requriedPermission: PermissionType
) => {
  return async (
    req: IGetUserAuthInfoRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { accountId, role } = req.user as JWTClaims;
      const prisma = new PrismaClient();

      if (!accountId || !role) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const account = await prisma.account.findUnique({
        where: { id: accountId },
        include: {
          accountRole: {
            include: {
              permissions: true,
            },
          },
          accountPermissions: true, // Optional
        },
      });

      if (!account || !account.accountRole) {
        res.status(403).json({ message: "Access denied" });
        return;
      }

      const rolePermissions = account.accountRole.permissions;
      const directPermissions = account.accountPermissions;

      const mergedPermissions = [...rolePermissions, ...directPermissions];

      const hasPermission = mergedPermissions.some(
        (p) =>
          p.context === requiredContext && p.permission === requriedPermission
      );

      if (!hasPermission) {
        res.status(403).json({ error: "Permission denied" });
        return;
      }
      next();
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  };
};
