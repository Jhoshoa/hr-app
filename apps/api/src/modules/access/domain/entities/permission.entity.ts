export interface PermissionEntity {
  readonly id: string;
  readonly key: string;
  readonly description: string;
  readonly module?: string | null;
  readonly action?: string | null;
  readonly sortOrder: number;
  readonly isCritical: boolean;
  readonly createdAt: Date;
}

