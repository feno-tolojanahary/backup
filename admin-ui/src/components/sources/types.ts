export type SourceType = "mongodb" | "s3" | "filesystem";
export type SourceStatus = "connected" | "warning" | "error";

export type SourceRecord = {
  id: number;
  name: string;
  type: SourceType;
  status: SourceStatus;
  configSummary: string[];
  jobsCount: number;
};
