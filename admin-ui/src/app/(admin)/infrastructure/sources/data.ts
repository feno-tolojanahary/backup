import { SourceRecord } from "@/components/sources/types";

export const sources: SourceRecord[] = [
  {
    id: 1,
    name: "data_1",
    type: "mongodb",
    status: "connected",
    configSummary: ["Database: local", "Host: localhost:27017"],
    jobsCount: 2,
  },
  {
    id: 2,
    name: "mongo-analytics",
    type: "mongodb",
    status: "connected",
    configSummary: ["Database: analytics", "Host: mongo.internal:27017"],
    jobsCount: 1,
  },
  {
    id: 3,
    name: "wasa-buck-rep",
    type: "s3",
    status: "connected",
    configSummary: ["Bucket: live-bucket", "Prefix: /"],
    jobsCount: 1,
  },
  {
    id: 4,
    name: "logs-folder",
    type: "filesystem",
    status: "warning",
    configSummary: ["Path: /var/log/apps", "Includes: *.log"],
    jobsCount: 3,
  },
];
