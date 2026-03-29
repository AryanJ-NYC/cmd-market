import { createAccessControl } from "better-auth/plugins/access";
import { adminAc, defaultStatements, memberAc, ownerAc } from "better-auth/plugins/organization/access";

export const sellerStatements = {
  ...defaultStatements,
  apiKey: ["create", "read", "update", "delete"],
  seller: ["manage"]
} as const;

export const sellerAccessControl = createAccessControl(sellerStatements);

export const sellerOrganizationRoles = {
  owner: sellerAccessControl.newRole({
    ...ownerAc.statements,
    apiKey: ["create", "read", "update", "delete"],
    seller: ["manage"]
  }),
  admin: sellerAccessControl.newRole({
    ...adminAc.statements,
    apiKey: ["create", "read", "update", "delete"],
    seller: ["manage"]
  }),
  member: sellerAccessControl.newRole({
    ...memberAc.statements,
    apiKey: ["read"]
  })
} as const;
