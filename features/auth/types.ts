export type AuthState = {
  status: "idle" | "success" | "error";
  message: string;
  redirect?: string;
};
