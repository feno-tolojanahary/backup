import api from "../globalAxios";


export default function createRessourceService<Entity, CreateEntityPayload = Partial<Entity>, UpdateEntityPayload = Partial<Entity>>(baseUrl: string) {
    
    async function getList(): Promise<Entity[]> {
        try {
            const res = await api.get(baseUrl);
            return res.data?.data ?? [];
        } catch (error: any) {
            const message = error?.response?.data?.message || error?.message || "Error notificationProvider get list.";
            throw new Error(message);
        }
    }
    
    async function create(url: string, { arg }: { arg: { payload: CreateEntityPayload } }): Promise<any> {
        try {
            const res = await api.post(url, arg.payload);
            return res.data;
        } catch (error: any) {
            const message = error?.response?.data?.message || error?.message || "Error notificationProvider creation.";
            throw new Error(message);
        }
    }
    
    async function update(url: string, { arg }: { arg: { id: number, payload: UpdateEntityPayload } }): Promise<any> {
        try {
            const res = await api.put(`${url}/${arg.id}`, arg.payload);
            return res.data;
        } catch (error: any) {
            const message = error?.response?.data?.message || error?.message || "Error notificationProvider update.";
            throw new Error(message);
        }
    }
    
    async function deleteById(url: string, { arg }: { arg: { id: number } }): Promise<any> {
        const res = await api.delete(`${url}/${arg.id}`);
        return res.data;
    }

    return {
        getList,
        create,
        update,
        deleteById
    }
}
