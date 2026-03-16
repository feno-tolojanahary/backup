"use client";

import React, { useCallback, useEffect } from "react";
import Link from "next/link";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { Controller, useForm } from "react-hook-form";
import ComponentCard from "@/components/common/ComponentCard";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import Switch from "@/components/form/switch/Switch";
import Button from "@/components/ui/button/Button";
import { CreateJobPayload, DestinationJob, UpdateJobPayload } from "@/handlers/jobs/type";
import { useDestinationOption, useSourceOption } from "./hooks";
import { Job } from "@/handlers/jobs/type";
import { useCreateJob, useUpdateJob } from "@/handlers/jobs/jobHooks";
import { useToast } from "@/context/ToastContext";

type JobFormPageClientProps = {
  mode: "create" | "edit";
  job?: Job | null;
};

type Option = {
    value: string; 
    label: string;
}

type JobFormValues = {
  name: string;
  source: string | null;
  destinations: Option[];
  scheduleType: string;
  scheduleValue: string;
  retentionDays: number;
  isEncrypted: boolean;  
}

export default function JobFormPageClient({ mode, job = null }: JobFormPageClientProps) {
  const title = mode === "create" ? "Create Job" : "Edit Job";
  
  const { sourceOptions } = useSourceOption();
  const { destinationOptions } = useDestinationOption();

  const { update } = useUpdateJob();
  const { create } = useCreateJob();  
  const { toastError, toastSuccess } = useToast();

  const buildDefaults = useCallback((jobData: Job | null): JobFormValues => {
    const jobDestinations = (destinationOptions && jobData?.destinations) ? 
                          destinationOptions.filter(({ value }) => jobData.destinations?.some((destJob: DestinationJob) => destJob.id === value))
                        : [];
    return {
      name: jobData?.name ?? "",
      scheduleType: jobData?.scheduleType ?? "cron",
      scheduleValue: jobData?.scheduleValue ?? "",
      retentionDays: jobData?.retentionDays ?? -1,
      source: jobData?.source?.id ?? null,
      destinations: jobDestinations,
      isEncrypted: jobData?.isEncrypted ?? true
    }
  }, [sourceOptions, destinationOptions])

  useEffect(() => {
    if (job) reset(buildDefaults(job))
  }, [job])

  const { register, control, handleSubmit, reset, formState: { errors } } =
      useForm<JobFormValues>({
        defaultValues: buildDefaults(job),
      }); 

  const formatJob = (values: JobFormValues): CreateJobPayload | UpdateJobPayload => {
    return {
      ...values,
      createdBy: "1",
      source: values.source ?? sourceOptions[0].value,
      destinations: values.destinations?.map(({ value }) => value),
    }
  }

  const saveJob = async (values: JobFormValues) => {
    const payload = formatJob(values);
    if (job?.id) {
      try {
        const res = await update(job.id.toString(), payload as UpdateJobPayload);
        if (!res)
          throw new Error("No response.");
        toastSuccess("Job saved with success.");
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
      } catch (error: any) {
        console.log("save job: ", error.message);
        toastError();
      }
    }
  }

  return (
    <div>
      <PageBreadcrumb pageTitle={title} />
      <div className="space-y-6">
        <ComponentCard
          title={title}
          desc="Define backup targets, schedule details, retention settings, and encryption."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Job name
              </label>
              <Input
                placeholder="Enter job name"
                {...register("name"), {
                  required: "Job name is required"
                }}
                error={Boolean(errors.name)}
                hint={errors.name?.message}
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Source
              </label>
              <Controller
                name="source"
                control={control}
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
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Destinations
              </label>
              <Controller
                name="destinations"
                control={control}
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
            </div>
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
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Schedule value
              </label>
              <Input
                placeholder="3600 or 0 2 * * *"
                {...register("scheduleValue")}
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Retention days
              </label>
              <Input
                type="number"
                placeholder="30"
                {...register("retentionDays")}
              />
            </div>
            <div className="flex items-end">
              <Switch
                label="Use encryption"
                {...register("isEncrypted")}
              />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <Link href="/jobs">
              <Button size="sm" variant="outline" type="button">
                Cancel
              </Button>
            </Link>
            <Button size="sm" type="button" onClick={handleSubmit(saveJob)}>
              Save Job
            </Button>
          </div>
        </ComponentCard>
      </div>
    </div>
  );
}
