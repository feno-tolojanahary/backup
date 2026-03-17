export type BackupStatus = "completed" | "failed" | "archived";

export const statusBadgeColor = (status: BackupStatus) => {
  if (status === "completed") return "success";
  if (status === "failed") return "error";
  return "dark";
};
