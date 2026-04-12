import useSWR, { mutate } from "swr";
import { createCrudHooks } from "../utils/crudHooks";
import { createJob, deleteJob, getDetail, getJobRuns, getListJob, runJobService, updateJob } from "./jobService";
import { CreateJobPayload, Job, JobDetail, JobRun, UpdateJobPayload } from "./type";
import { useToast } from "@/context/ToastContext";

const baseUrl = "/jobs";
const jobRunUrl = "/jobs/job-runs";

const crud = createCrudHooks<Job, CreateJobPayload, UpdateJobPayload>(baseUrl, {
    create: createJob,
    update: updateJob,
    delete: deleteJob,
    getList: getListJob
});

export const useJobList = crud.useList;
export const useUpdateJob = crud.useUpdate;
export const useDeleteJob = crud.useDelete;
export const useCreateJob = crud.useCreate;

export function useDetail(id: string) {
    if (!id) return;
    const { data, isLoading, error, mutate } = useSWR<JobDetail>(`${baseUrl}/${id}`, getDetail);
    return {
        jobDetail: data,
        isLoading,
        error,
        refresh: mutate
    }
}

export function useRunJob() {
    const { toastError, toastSuccess } = useToast();

    const runJob = async (id: number) => {
        try {
            mutate(baseUrl, 
                (jobs?: any[]) => jobs?.map((job) => job.id === id ? ({...job, status: "running"}) : job)
            )
            const res = await runJobService(`${baseUrl}/${id?.toString()}`);
            mutate(baseUrl);
            mutate(jobRunUrl);
            toastSuccess("Running job with success.")
        } catch (error: any) {
            console.log("Error running job: ", error.message);
            toastError();
        }
    }

    return {
        runJob
    }
}


export function useJobRun(jobId: number) {
    const { data, isLoading, error, mutate } = useSWR<JobRun[]>(jobId ? `${jobRunUrl}/${jobId}` : null, getJobRuns);
    return {
        jobRuns: data || [],
        isLoading,
        error,
        refresh: mutate
    }
}