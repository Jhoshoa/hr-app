import type { EmployeeListItem } from "@/types/employees";

export const employeeFixtures: EmployeeListItem[] = [
  {
    department: "Engineering",
    employeeNumber: "AS-1042",
    id: "employee-1",
    jobTitle: "Senior Software Engineer",
    location: "Cochabamba",
    manager: "Diego Pereira",
    name: "Camila Vargas",
    startDate: "2022-03-14",
    status: "ACTIVE",
    workEmail: "camila.vargas@andeshr.example"
  },
  {
    department: "People Ops",
    employeeNumber: "AS-0998",
    id: "employee-2",
    jobTitle: "HR Operations Lead",
    location: "Santa Cruz",
    manager: "Maria Rojas",
    name: "Lucia Fernandez",
    startDate: "2021-08-02",
    status: "ACTIVE",
    workEmail: "lucia.fernandez@andeshr.example"
  },
  {
    department: "Finance",
    employeeNumber: "AS-1117",
    id: "employee-3",
    jobTitle: "Finance Analyst",
    location: "La Paz",
    manager: "Sofia Aguilar",
    name: "Mateo Quiroga",
    startDate: "2023-11-20",
    status: "ACTIVE",
    workEmail: "mateo.quiroga@andeshr.example"
  },
  {
    department: "Talent",
    employeeNumber: "AS-0874",
    id: "employee-4",
    jobTitle: "Recruiter",
    location: "Remote",
    manager: "Lucia Fernandez",
    name: "Valeria Salazar",
    startDate: "2020-05-11",
    status: "INACTIVE",
    workEmail: "valeria.salazar@andeshr.example"
  },
  {
    department: "Operations",
    employeeNumber: "AS-0721",
    id: "employee-5",
    jobTitle: "Operations Coordinator",
    location: "Cochabamba",
    manager: "Diego Pereira",
    name: "Andres Molina",
    startDate: "2019-01-07",
    status: "TERMINATED",
    workEmail: "andres.molina@andeshr.example"
  }
];
