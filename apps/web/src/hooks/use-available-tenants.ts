import { useAppSelector } from "@/store/hooks";

export const useAvailableTenants = () => useAppSelector((state) => state.tenant.availableTenants);
