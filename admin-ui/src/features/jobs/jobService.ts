import createRessourceService from "../utils/ressourceService";
import { fetchJson } from "../utils/utils";
import { CreateJobPayload, Job, JobDetail, UpdateJobPayload } from "./type";

const baseUrl = "/payloads";

const { create, update, deleteById, getList } = createRessourceService<Job, CreateJobPayload, UpdateJobPayload>(baseUrl);

export const createJob = create;
export const updateJob = update;
export const deleteJob = deleteById;
export const getListJob = getList;

export async function getDetail(url: string): Promise<JobDetail> {
    const res = await fetchJson(url);
    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Error get job detail.")
    }
    const jobDetail = (await res.json()).data;
    return jobDetail;
}