import useSWR from "swr";
import { getData } from "../fetcher";
import { useMemo } from "react";
import { BackupActivityType, BackupStatusType, StatType, StorageUsedByDestType } from "./type";
import { formatBytes } from "../utils/utils";
import type { ApexOptions } from "apexcharts";
import moment from "moment";

const definedStatusColors = ["#22C55E", "#EF4444", "#9CA3AF"];

export default function useStats() {

    const { data, error, isLoading } = useSWR<StatType>("/stats/dashboard", getData);

    const metricCards = useMemo(() => {
        const { totalTarget, totalBackupSize, totalBackups, totalJobs } = data?.totalData || {};
        return [
            {
                label: "Total Targets",
                value: totalTarget ?? 0,
                description: "Number of configured backup targets.",
                // meta: ["app1", "mongodb", "s3-wasabi"],
            },
            {
                label: "Active Jobs",
                value: totalJobs ?? 0,
                description: "Number of enabled jobs.",
            },
            {
                label: "Total Backups",
                value: totalBackups ?? 0,
                description: "Total backups stored across all destinations.",
            },
            {
                label: "Total Storage Used",
                value: formatBytes(totalBackupSize ?? 0),
                description: "Total disk or object storage used.",
            },
        ];
    }, [data])

    const statusData: { statusOptions: ApexOptions, statusSeries: number[], statusLabels: string[], statusColors: string[] } = useMemo(() => {
        const backupStatus: BackupStatusType[] = data?.backupStatus ?? [];
        const statusLabels = backupStatus.map((status) => status.status);
        const statusSeries = backupStatus.map((status) => status.total);
        const statusColors = backupStatus.map((_, index) => definedStatusColors[index] ?? "#9CA3AF");

        const statusOptions: ApexOptions = {
            chart: {
                type: "donut",
                fontFamily: "Outfit, sans-serif",
            },
            labels: statusLabels,
            colors: statusColors,
            dataLabels: {
                enabled: false,
            },
            legend: {
                show: false,
            },
            stroke: {
                width: 0,
            },
            plotOptions: {
                pie: {
                    donut: {
                        size: "68%",
                        labels: {
                            show: true,
                            total: {
                                show: true,
                                label: "Total",
                                fontSize: "14px",
                                color: "#6B7280",
                                formatter: function () {
                                    return "238";
                                },
                            },
                        },
                    },
                },
            },
            tooltip: {
                y: {
                    formatter: (value) => `${value} backups`,
                },
            },
        };

        return { statusOptions, statusSeries, statusLabels, statusColors }
    }, [data])

    const activityData = useMemo(() => {        
        const backupActivities: BackupActivityType[] = data?.backupActivities ?? [];        
        const days: string[] = backupActivities.map(activity => moment(activity.day).format('ddd'));
        const completed: number[] = backupActivities.map((activity) => activity.totalCompleted);
        const failed: number[] = backupActivities.map(activity => activity.totalFailed);
        const activitySeries = [
            {
                name: "Completed",
                data: completed,
            },
            {
                name: "Failed",
                data: failed,
            },
        ];

        const activityOptions: ApexOptions = {
            chart: {
                type: "line",
                height: 320,
                fontFamily: "Outfit, sans-serif",
                toolbar: { show: false },
            },
            colors: ["#22C55E", "#EF4444"],
            stroke: {
                curve: "smooth",
                width: 3,
            },
            markers: {
                size: 4,
                strokeColors: "#fff",
                strokeWidth: 2,
                hover: {
                    size: 6,
                },
            },
            xaxis: {
                categories: days,
                axisBorder: { show: false },
                axisTicks: { show: false },
                labels: {
                    style: {
                        colors: "#6B7280",
                    },
                },
            },
            yaxis: {
                labels: {
                    style: {
                        colors: "#6B7280",
                    },
                },
            },
            grid: {
                borderColor: "#E5E7EB",
                strokeDashArray: 4,
            },
            dataLabels: {
                enabled: false,
            },
            legend: {
                position: "top",
                horizontalAlign: "left",
                labels: {
                    colors: "#6B7280",
                },
            },
        };

        return {
            activitySeries,
            activityOptions
        }
    }, [data])

    const storageData = useMemo(() => {
        const storageUsedByDest: StorageUsedByDestType[] = data?.storageUsedByDest ?? [];
        const totalSizes = storageUsedByDest.map((store) => store.totalSize);
        const storages = storageUsedByDest.map(store => store.storage);
        const storageSeries = [
            {
                name: "Storage",
                data: totalSizes,
            },
        ];

        const storageOptions: ApexOptions = {
            chart: {
                type: "bar",
                height: 280,
                fontFamily: "Outfit, sans-serif",
                toolbar: { show: false },
            },
            colors: ["#38BDF8"],
            plotOptions: {
                bar: {
                    horizontal: true,
                    barHeight: "55%",
                    borderRadius: 8,
                },
            },
            dataLabels: {
                enabled: true,
                style: {
                    colors: ["#1F2937"],
                    fontSize: "12px",
                    fontWeight: 600,
                },
                formatter: (value) => formatBytes(+value),
            },
            xaxis: {
                categories: storages,
                labels: {
                    style: {
                        colors: "#6B7280",
                    },
                    formatter: (value) => formatBytes(+value),
                },
            },
            yaxis: {
                labels: {
                    style: {
                        colors: "#6B7280",
                    },
                },
            },
            grid: {
                borderColor: "#E5E7EB",
                strokeDashArray: 4,
            },
            tooltip: {
                y: {
                    formatter: (value) => formatBytes(value),
                },
            },
        };

        return {
            storageSeries,
            storageOptions
        }
    }, [data])

    return {
        metricCards,
        statusOptions: statusData?.statusOptions ?? {},
        statusSeries: statusData?.statusSeries ?? [],
        statusLabels: statusData?.statusLabels ?? [],
        statusColors: statusData?.statusColors ?? [],
        activitySeries: activityData?.activitySeries ?? [],
        activityOptions: activityData?.activityOptions ?? {},
        storageOptions: storageData?.storageOptions ?? {},
        storageSeries: storageData?.storageSeries ?? [],
        isLoading,
        error
    }
}