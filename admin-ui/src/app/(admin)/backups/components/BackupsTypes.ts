export type BackupStatus = "completed" | "failed" | "archived";

export type BackupFile = {
  path: string;
  size: string;
};

export type BackupRecord = {
  id: string;
  uid: string;
  job: string;
  status: BackupStatus;
  size: string;
  files: number;
  storage: string;
  createdAt: string;
  encryption: string;
  fileList: BackupFile[];
};

export const statusBadgeColor = (status: BackupStatus) => {
  if (status === "completed") return "success";
  if (status === "failed") return "error";
  return "dark";
};
