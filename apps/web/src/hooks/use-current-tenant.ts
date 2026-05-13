import { useAppSelector } from "@/store/hooks";

export const useCurrentTenant = () => useAppSelector((state) => state.tenant.currentTenant);
