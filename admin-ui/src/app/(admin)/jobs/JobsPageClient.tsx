"use client";

import React, { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import Button from "@/components/ui/button/Button";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import { useJobList } from "@/handlers/jobs/jobHooks";
import { useSources } from "@/handlers/sources/sourcesHooks";
import { useListDestinations } from "@/handlers/destinations/destinationHooks";
import JobTable from "./table/JobTable";

export default function JobsPageClient() {
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [destinationFilter, setDestinationFilter] = useState<string[]>([]);

  const { data: jobs, isLoading } = useJobList();
  const { sources } = useSources();
  const { data: destinations } = useListDestinations();
  
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      if (
        search &&
        !job.name.toLowerCase().includes(search.toLowerCase().trim())
      ) {
        return false;
      }

      if (sourceFilter && job.source?.name !== sourceFilter) return false;
      if (destinationFilter.length > 0) {
        if (!job.destinations?.find(({name}) => destinationFilter.includes(name)))
          return false;
      }
      
      return true;
    });
  }, [search, sourceFilter, destinationFilter]);

  const sourceList = useMemo(() => {
    return sources.map(({id, name}) => ({ value: id, label: name }))
  }, [sources])

  const destinationList = useMemo(() => destinations.map(({ id, name }) => ({ value: id, label: name })), [destinations])

  return (
    <div>
      <PageBreadcrumb pageTitle="Jobs" />
      <div className="space-y-6">
        <ComponentCard
          title="Jobs"
          desc="Configure and manage automated backup jobs."
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Search
                </label>
                <Input
                  placeholder="Search job name..."
                  defaultValue={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                  }}
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Source
                </label>
                <Select
                  options={sourceList}
                  placeholder="Source"
                  onChange={(value) => {
                    setSourceFilter(value as string);
                  }}
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Target
                </label>
                <Select
                  options={destinationList}
                  placeholder="Destination"
                  onChange={(value) => {
                    setDestinationFilter(value as string[]);
                  }}
                />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link href="/jobs/new">
                <Button size="sm" type="button">
                  Create Job
                </Button>
              </Link>
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
            <div className="max-w-full overflow-x-auto">
                <JobTable 
                  filteredJobs={filteredJobs}                 
                />
            </div>
          </div>         
        </ComponentCard>
      </div>
    </div>
  );
}