import api from "../globalAxios";
import createRessourceService from "../utils/ressourceService";
import { fetchJson } from "../utils/utils";
import { CreateJobPayload, Job, JobDetail, JobRun, UpdateJobPayload } from "./type";

const baseUrl = "/jobs";

const { create, update, deleteById, getList } = createRessourceService<Job, CreateJobPayload, UpdateJobPayload>(baseUrl);

export const createJob = create;
export const updateJob = update;
export const deleteJob = deleteById;
export const getListJob = getList;

type RunJobSuccess = {
    success: boolean
}

export async function getDetail(url: string): Promise<JobDetail> {
    const res = await fetchJson(url);
    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Error get job detail.")
    }
    const jobDetail = (await res.json()).data;
    return jobDetail;
}

export async function runJobService(url: string): Promise<RunJobSuccess> {
    const res = await api.post(url);
    return res.data?.data;
}

export async function getJobRuns(url: string): Promise<JobRun[]> {
    const res = await api.get(url);
    return res.data?.data;
}