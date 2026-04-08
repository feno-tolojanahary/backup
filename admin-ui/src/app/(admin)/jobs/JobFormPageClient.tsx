"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { Controller, useForm, useWatch } from "react-hook-form";
import ComponentCard from "@/components/common/ComponentCard";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import Switch from "@/components/form/switch/Switch";
import Button from "@/components/ui/button/Button";
import { CreateJobPayload, DestinationJob, TargetType, UpdateJobPayload } from "@/handlers/jobs/type";
import { useDestinationOption, useSourceOption } from "./hooks";
import { Job } from "@/handlers/jobs/type";
import { useCreateJob, useJobList, useUpdateJob } from "@/handlers/jobs/jobHooks";
import { useToast } from "@/context/ToastContext";

type Option = {
    value: string; 
    label: string;
}

type JobFormValues = {
  name: string;
  type: TargetType;
  source: string | null;
  destinations: Option[];
  scheduleType: string;
  scheduleValue: string;
  retentionDays: number;
  isEncrypted: boolean;  
}

const INTERVAL_PATTERN = /^(\d+)\s*(s|m|h|d)$/i;
const CRON_PARTS_PATTERN = /^[\d*/,LW#?-]+$/i;

const validateScheduleValue = (scheduleType: string, input: string) => {
  const value = input.trim();

  if (scheduleType === "manual") {
    return true;
  }

  if (!value) {
    return "Schedule value is required";
  }

  if (scheduleType === "interval") {
    const match = value.match(INTERVAL_PATTERN);
    if (!match) {
      return "Interval must use formats like 30s, 15m, 1h, or 2d";
    }

    if (Number(match[1]) <= 0) {
      return "Interval value must be greater than zero";
    }

    return true;
  }

  if (scheduleType === "cron") {
    const parts = value.split(/\s+/);
    if (parts.length !== 5 && parts.length !== 6) {
      return "Cron expression must contain 5 or 6 fields";
    }

    const hasInvalidPart = parts.some((part) => !CRON_PARTS_PATTERN.test(part));
    if (hasInvalidPart) {
      return "Cron expression contains invalid characters";
    }
  }

  return true;
};

export default function JobFormPageClient() {

  const router = useRouter();

  const { update } = useUpdateJob();
  const { create } = useCreateJob();  
  const { toastError, toastSuccess, toastWarning } = useToast();
  const params = useParams<{ jobId: string }>();
  const isUpdate = Boolean(params.jobId);
  
  const { data: jobs } = useJobList();

  const buildDefaults = useCallback((jobData: Job | null): JobFormValues => {
    const jobDestinations = jobData?.destinations?.map((destJob: DestinationJob) => ({
      value: destJob.id,
      label: destJob.name,
    })) ?? [];
    return {
      name: jobData?.name ?? "",
      type: (jobData?.type ?? "database") as TargetType,
      scheduleType: jobData?.scheduleType ?? "cron",
      scheduleValue: jobData?.scheduleValue ?? "",
      retentionDays: jobData?.retentionDays ?? -1,
      source: jobData?.source?.id ?? null,
      destinations: jobDestinations,
      isEncrypted: jobData?.isEncrypted ?? true
    }
  }, [])

  const { register, control, handleSubmit, reset, setValue, setError, clearErrors, formState: { errors } } =
      useForm<JobFormValues>({
        defaultValues: buildDefaults(null),
      }); 

  useEffect(() => {
    if (params.jobId && jobs.length > 0) {
      const foundJob = jobs.find((job) => job.id.toString() === params.jobId);
      if (foundJob) reset(buildDefaults(foundJob))
    }
  }, [params.jobId, jobs, reset, buildDefaults])
  
  const targetType = useWatch({ control, name: "type" });
  const scheduleType = useWatch({ control, name: "scheduleType" });
  const selectedSource = useWatch({ control, name: "source" });
  const selectedDestinations = useWatch({ control, name: "destinations" });

  const { sourceOptions } = useSourceOption(targetType);
  const { destinationOptions } = useDestinationOption(targetType);
  const hasSourceOptions = sourceOptions.length > 0;
  const hasDestinationOptions = destinationOptions.length > 0;

  useEffect(() => {
    if (selectedSource) {
      const allowedSources = new Set(sourceOptions.map(({ value }) => value));
      if (!allowedSources.has(selectedSource)) {
        setValue("source", null);
      }
    }

    if (selectedDestinations?.length) {
      const allowedDestinations = new Set(destinationOptions.map(({ value }) => value));
      const filteredDestinations = selectedDestinations.filter((dest) => allowedDestinations.has(dest.value));
      if (filteredDestinations.length !== selectedDestinations.length) {
        setValue("destinations", filteredDestinations);
      }
    }
  }, [selectedSource, selectedDestinations, sourceOptions, destinationOptions, setValue]);

  const formatJob = useCallback((values: JobFormValues): CreateJobPayload | UpdateJobPayload => {
    const payload = {
      ...values,
      createdBy: "1",
      source: values.source ?? sourceOptions[0]?.value ?? "",
      destinations: values.destinations?.map(({ value }) => value),
    }
    return payload;
  }, [sourceOptions])

  const saveJob = async (values: JobFormValues) => {
    const currentJobId = params.jobId ? Number(params.jobId) : null;
    const normalizedName = values.name.trim().toLowerCase();
    const normalizedSource = values.source ?? sourceOptions[0]?.value ?? "";
    const normalizedDestinations = (values.destinations ?? [])
      .map(({ value }) => value)
      .sort()
      .join(",");

    const duplicateName = jobs.find(
      (existing) =>
        existing.id !== currentJobId &&
        existing.name?.trim().toLowerCase() === normalizedName
    );

    const duplicateTarget = jobs.find((existing) => {
      if (existing.id === currentJobId) return false;
      const existingSource = existing.source?.id ?? "";
      const existingDestinations = (existing.destinations ?? [])
        .map((dest) => dest.id)
        .sort()
        .join(",");
      return existingSource === normalizedSource && existingDestinations === normalizedDestinations;
    });

    if (duplicateName) {
      setError("name", {
        type: "validate",
        message: "Job name already exists.",
      });
      toastWarning("Job name already exists.");
      return;
    }

    if (duplicateTarget) {
      setError("source", {
        type: "validate",
        message: "Source and destinations already used by another job.",
      });
      setError("destinations", {
        type: "validate",
        message: "Source and destinations already used by another job.",
      });
      toastWarning("Source and destinations already used by another job.");
      return;
    }

    clearErrors(["name", "source", "destinations"]);
    if (!hasSourceOptions) {
      toastWarning("No available sources for the selected target type.");
      return;
    }
    if (!hasDestinationOptions) {
      toastWarning("No available destinations for the selected target type.");
      return;
    }
    const payload = formatJob(values);
    if (params.jobId) {
      try {
        const res = await update(Number(params.jobId), payload as UpdateJobPayload);
        if (!res)
          throw new Error("No response.");
        toastSuccess("Job saved with success.");
        router.push("/jobs");
      } catch (error: any) {
        console.log("Error update job: ", error.message);
        toastError();
      }
    } else {
      try { 
        const res = await create(payload as CreateJobPayload);
        if (!res)
          throw new Error("No response received.");
        toastSuccess("Job saved with success."); 
        router.push("/jobs");
      } catch (error: any) {
        console.log("save job: ", error.message);
        toastError();
      }
    }
  }

  return (
    <div>
      <PageBreadcrumb pageTitle={params.jobId ? "Edit Job" : "Create Job"} />
      <div className="space-y-6">
        <section className="space-y-2">
          <h2 className="px-1 text-sm font-medium text-gray-700 dark:text-gray-300">
            Job Configuration
          </h2>
          <ComponentCard title="">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Job name
                </label>
                <Input
                  placeholder="Enter job name"
                  {...register("name", {
                    required: "Job name is required"
                  })}
                  error={Boolean(errors.name)}
                  hint={errors.name?.message}
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Target type
                </label>
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <Select
                      options={[
                        { value: "app", label: "application" },
                        { value: "database", label: "database" },
                        { value: "object-replication", label: "object-replication" },
                      ]}
                      value={field.value}
                      placeholder="Select target type"
                      onChange={field.onChange}
                      name={field.name}
                      disabled={isUpdate}
                    />
                  )}
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Source
                </label>
                <Controller
                  name="source"
                  control={control}
                  rules={{
                    required: "Source is required",
                  }}
                  render={({ field }) => (
                    <Select
                      options={sourceOptions}
                      value={field.value || ""}
                      placeholder="Select source"
                      onChange={field.onChange}
                      name={field.name}
                    />
                  )}
                />
                {!hasSourceOptions && (
                  <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                    No sources available for this target type.
                  </p>
                )}
                {errors.source?.message && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                    {errors.source.message}
                  </p>
                )}
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Destinations
                </label>
                <Controller
                  name="destinations"
                  control={control}
                  rules={{
                    validate: (value) =>
                      (value && value.length > 0) || "At least one destination is required",
                  }}
                  render={({ field }) => (
                    <Select
                      options={destinationOptions}
                      value={field.value?.map(({value}) => value)}
                      placeholder="Select destinations"
                      onChangeOption={field.onChange}
                      name={field.name}
                      isMulti
                    />
                  )}
                />
                {!hasDestinationOptions && (
                  <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                    No destinations available for this target type.
                  </p>
                )}
                {errors.destinations?.message && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                    {errors.destinations.message as string}
                  </p>
                )}
              </div>
            </div>
          </ComponentCard>
        </section>

        <section className="space-y-2">
          <h2 className="px-1 text-sm font-medium text-gray-700 dark:text-gray-300">
            Schedule
          </h2>
          <ComponentCard title="">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Schedule type
                </label>
                <Controller
                  name="scheduleType"
                  control={control}
                  render={({ field }) => (
                    <Select
                      options={[
                        { value: "interval", label: "interval" },
                        { value: "cron", label: "cron" },
                        { value: "manual", label: "manual" },
                      ]}
                      value={field.value}
                      placeholder="Select schedule type"
                      onChange={field.onChange}
                      name={field.name}
                    />
                  )}
                />
              </div>
              {scheduleType !== "manual" && (
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Schedule value
                  </label>
                  <Input
                    placeholder={scheduleType === "interval" ? "15m" : "0 2 * * *"}
                    {...register("scheduleValue", {
                      validate: (value) => validateScheduleValue(scheduleType, value ?? ""),
                    })}
                    error={Boolean(errors.scheduleValue)}
                    hint={errors.scheduleValue?.message}
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {scheduleType === "interval"
                      ? "Examples: 30s, 15m, 1h, 2d"
                      : "Example: 0 2 * * *"}
                  </p>
                </div>
              )}
              {scheduleType === "manual" && (
                <div className="rounded-xl border border-dashed border-gray-300 px-4 py-3 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                  Manual schedules run only when triggered, so no schedule value is required.
                </div>
              )}
            </div>
          </ComponentCard>
        </section>

        <section className="space-y-2">
          <h2 className="px-1 text-sm font-medium text-gray-700 dark:text-gray-300">
            Retention & Security
          </h2>
          <ComponentCard title="">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Retention days
                </label>
                <Input
                  type="number"
                  placeholder="30"
                  {...register("retentionDays")}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Use `-1` to keep backups indefinitely.
                </p>
              </div>
              <div className="pt-7">
                <Controller
                  name="isEncrypted"
                  control={control}
                  render={({ field }) => (
                    <Switch
                      label="Use encryption"
                      checked={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
              </div>
            </div>
          </ComponentCard>
        </section>

        <div className="flex flex-wrap justify-end gap-3">
          <Link href="/jobs">
            <Button size="sm" variant="outline" type="button">
              Cancel
            </Button>
          </Link>
          <Button
            size="sm"
            type="button"
            onClick={handleSubmit(saveJob)}
            disabled={!hasSourceOptions || !hasDestinationOptions}
          >
            Save Job
          </Button>
        </div>
      </div>
    </div>
  );
}
