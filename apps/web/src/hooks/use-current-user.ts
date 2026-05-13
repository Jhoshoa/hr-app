import { useAppSelector } from "@/store/hooks";

export const useCurrentUser = () => useAppSelector((state) => state.auth.user);
