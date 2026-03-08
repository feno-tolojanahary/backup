import { createCrudHooks } from "../utils/crudHooks";
import { createJob, deleteJob, updateJob } from "./jobService";
import { CreateJobPayload, Job, UpdateJobPayload } from "./type";


const baseUrl = "/jobs";

const crud = createCrudHooks<Job, CreateJobPayload, UpdateJobPayload>(baseUrl, {
    create: createJob,
    update: updateJob,
    delete: deleteJob
});

export const useJobList = crud.useList;
export const useUpdateJob = crud.useUpdate;
export const useDeleteJob = crud.useDelete;
export const useCreateJob = crud.useCreate;