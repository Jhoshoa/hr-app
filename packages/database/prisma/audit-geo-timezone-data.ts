import { PrismaClient } from "@prisma/client";
import { auditGeoTimezoneData } from "../src/geo-timezone-audit";

const prisma = new PrismaClient();

const main = async (): Promise<void> => {
  const [tenants, locations, companySignupRequests] = await Promise.all([
    prisma.tenant.findMany({
      select: {
        id: true,
        timezone: true
      }
    }),
    prisma.location.findMany({
      select: {
        id: true,
        tenantId: true,
        country: true,
        subdivisionCode: true,
        timezone: true
      }
    }),
    prisma.companySignupRequest.findMany({
      select: {
        id: true,
        country: true,
        phone: true,
        timezone: true
      }
    })
  ]);
  const report = auditGeoTimezoneData({
    tenants,
    locations,
    companySignupRequests
  });

  console.log(JSON.stringify(report, null, 2));

  if (process.argv.includes("--fail-on-findings") && report.summary.totalFindings > 0) {
    process.exitCode = 1;
  }
};

void main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
