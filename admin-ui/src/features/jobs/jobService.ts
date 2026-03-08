import createRessourceService from "../utils/ressourceService";
import { CreateJobPayload, Job, UpdateJobPayload } from "./type";

const baseUrl = "/payloads";

const { create, update, deleteById, getList } = createRessourceService<Job, CreateJobPayload, UpdateJobPayload>(baseUrl);

export const createJob = create;
export const updateJob = update;
export const deleteJob = deleteById;
export const getListJob = getList;