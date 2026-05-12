import { ForbiddenException } from "@nestjs/common";
import { EmployeeVisibilityService } from "../../application/services/employee-visibility.service";
import type { EmployeeEntity } from "../../domain/entities/employee.entity";

const baseEmployee: EmployeeEntity = {
  id: "employee-1",
  tenantId: "tenant-1",
  userId: "user-2",
  employeeNumber: "EMP-001",
  status: "ACTIVE",
  firstName: "Ana",
  lastName: "Vargas",
  workEmail: "ana@example.com",
  personalEmail: "ana.personal@example.com",
  startDate: new Date("2026-05-12T00:00:00.000Z"),
  terminationDate: null,
  createdAt: new Date("2026-05-12T00:00:00.000Z"),
  updatedAt: new Date("2026-05-12T00:00:00.000Z"),
  profile: {
    birthDate: new Date("1995-01-01T00:00:00.000Z"),
    phone: "70000000",
    address: "La Paz",
    emergencyContactName: "Emergency Contact",
    emergencyContactPhone: "71111111"
  },
  managerRelationships: [
    {
      id: "relationship-1",
      employeeId: "employee-1",
      managerEmployeeId: "manager-employee-1",
      effectiveFrom: new Date("2026-05-12T00:00:00.000Z"),
      effectiveTo: null
    }
  ],
  compensation: [
    {
      id: "compensation-1",
      employeeId: "employee-1",
      amount: "10000",
      currency: "BOB",
      frequency: "MONTHLY",
      visibility: "HR_ONLY",
      effectiveFrom: new Date("2026-05-12T00:00:00.000Z"),
      effectiveTo: null
    }
  ]
};

describe("EmployeeVisibilityService", () => {
  it("hides compensation unless compensation read permission is granted", () => {
    const service = new EmployeeVisibilityService();

    const result = service.filterEmployee(baseEmployee, {
      userId: "hr-user-1",
      permissions: ["employees.read"],
      currentEmployeeId: "hr-employee-1"
    });

    expect(result.compensation).toBeUndefined();
  });

  it("keeps compensation for users with compensation read permission", () => {
    const service = new EmployeeVisibilityService();

    const result = service.filterEmployee(baseEmployee, {
      userId: "hr-user-1",
      permissions: ["employees.read", "employees.compensation.read"],
      currentEmployeeId: "hr-employee-1"
    });

    expect(result.compensation).toHaveLength(1);
  });

  it("allows managers to view direct reports with limited sensitive profile data", () => {
    const service = new EmployeeVisibilityService();

    const result = service.filterEmployee(baseEmployee, {
      userId: "manager-user-1",
      permissions: ["employees.team.read"],
      currentEmployeeId: "manager-employee-1"
    });

    expect(result.profile?.phone).toBe("70000000");
    expect(result.profile?.address).toBeNull();
    expect(result.personalEmail).toBeNull();
  });

  it("rejects employees outside the current user permissions", () => {
    const service = new EmployeeVisibilityService();

    expect(() =>
      service.filterEmployee(baseEmployee, {
        userId: "other-user-1",
        permissions: ["employees.self.read"],
        currentEmployeeId: "other-employee-1"
      })
    ).toThrow(ForbiddenException);
  });
});
