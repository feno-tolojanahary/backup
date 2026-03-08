import createRessourceService from "../utils/ressourceService";
import { Backup } from "./type";


const baseUrl = "/backups";

const { getList, deleteById } = createRessourceService<Backup>(baseUrl);

export const getBackupList = getList;
export const deleteBackup = deleteById;