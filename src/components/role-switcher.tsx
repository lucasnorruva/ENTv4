// src/components/role-switcher.tsx
"use client";

import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Role } from "@/lib/constants";

interface RoleSwitcherProps {
  roles: Role[];
  currentRole: Role;
}

const getRoleSlug = (role: Role) => role.toLowerCase().replace(/ /g, '-');

export default function RoleSwitcher({
  roles,
  currentRole,
}: RoleSwitcherProps) {
  const router = useRouter();

  const handleRoleChange = (newRole: Role) => {
    const slug = getRoleSlug(newRole);
    router.push(`/dashboard/${slug}`);
  };

  if (roles.length <= 1) {
    return null;
  }

  return (
    <div className="w-48">
      <Select onValueChange={handleRoleChange} value={currentRole}>
        <SelectTrigger>
          <SelectValue placeholder="Switch Role..." />
        </SelectTrigger>
        <SelectContent>
          {roles.map((role) => (
            <SelectItem key={role} value={role}>
              {role}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
