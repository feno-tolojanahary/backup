import useSWR, { mutate } from "swr";
import { createCrudHooks } from "../utils/crudHooks";
import { createJob, deleteJob, getDetail, getListJob, runJobService, updateJob } from "./jobService";
import { CreateJobPayload, Job, JobDetail, UpdateJobPayload } from "./type";


const baseUrl = "/jobs";

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

export async function runJob(id: number) {
    try {
    mutate(baseUrl, 
            (jobs?: any[]) => jobs?.map((job) => job.id === id ? ({...job, status: "running"}) : job)
        )
        const res = await runJobService(`${baseUrl}/${id?.toString()}`);
        mutate(baseUrl);
    } catch (error: any) {
        console.log("Error running job: ", error.message);
    }
}