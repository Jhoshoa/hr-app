import { Injectable } from "@nestjs/common";
import type { EmployeeEntity } from "../../domain/entities/employee.entity";
import type { CreateEmployeeInput } from "../../domain/ports/employees.repository.port";

export interface CsvImportParseResult {
  readonly rows: CreateEmployeeInput[];
  readonly errors: string[];
}

@Injectable()
export class EmployeeCsvService {
  toCsv = (employees: EmployeeEntity[]): string => {
    const header = ["employeeNumber", "firstName", "lastName", "workEmail", "status", "startDate"];
    const rows = employees.map((employee) =>
      [
        employee.employeeNumber,
        employee.firstName,
        employee.lastName,
        employee.workEmail,
        employee.status,
        employee.startDate.toISOString().slice(0, 10)
      ].map(this.escapeCsvValue)
    );

    return [header.join(","), ...rows.map((row) => row.join(","))].join("\n");
  };

  parse = (tenantId: string, content: string): CsvImportParseResult => {
    const lines = content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length < 2) {
      return { rows: [], errors: ["CSV must include a header and at least one employee row."] };
    }

    const headers = this.parseLine(lines[0] ?? "");
    const errors: string[] = [];
    const rows: CreateEmployeeInput[] = [];

    lines.slice(1).forEach((line, index) => {
      const values = this.parseLine(line);
      const row = Object.fromEntries(headers.map((header, headerIndex) => [header, values[headerIndex]]));
      const rowNumber = index + 2;

      if (!row.employeeNumber || !row.firstName || !row.lastName || !row.workEmail || !row.startDate) {
        errors.push(`Row ${rowNumber} is missing a required field.`);
        return;
      }

      rows.push({
        tenantId,
        employeeNumber: row.employeeNumber,
        firstName: row.firstName,
        lastName: row.lastName,
        workEmail: row.workEmail,
        personalEmail: row.personalEmail,
        startDate: new Date(row.startDate)
      });
    });

    return { rows, errors };
  };

  private parseLine = (line: string): string[] => {
    const values: string[] = [];
    let current = "";
    let quoted = false;

    for (let index = 0; index < line.length; index += 1) {
      const character = line[index];
      const nextCharacter = line[index + 1];

      if (character === '"' && quoted && nextCharacter === '"') {
        current += '"';
        index += 1;
        continue;
      }

      if (character === '"') {
        quoted = !quoted;
        continue;
      }

      if (character === "," && !quoted) {
        values.push(current.trim());
        current = "";
        continue;
      }

      current += character;
    }

    values.push(current.trim());
    return values;
  };

  private escapeCsvValue = (value: string): string => {
    if (!/[",\n\r]/.test(value)) {
      return value;
    }

    return `"${value.replace(/"/g, '""')}"`;
  };
}
