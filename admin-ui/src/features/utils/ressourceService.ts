import { callFetch } from "./utils";


export default function createRessourceService<Entity, CreateEntityPayload = Partial<Entity>, UpdateEntityPayload = Partial<Entity>>(baseUrl: string) {
    
    async function getList(): Promise<Entity[]> {
        const res = await fetch(baseUrl)
        if (!res.ok) {
            const text = await res.text();
            throw new Error(text || "Error notificationProvider get list.")
        }
    
        return res.json();
    }
    
    async function create(url: string, { arg }: { arg: { payload: CreateEntityPayload } }): Promise<any> {
        const res = await callFetch(url, "POST", arg.payload)
        if (!res.ok) {
            const text = await res.text();
            throw new Error(text || "Error notificationProvider creation.")
        }
    
        return res.json();
    }
    
    async function update(url: string, { arg }: { arg: { id: string, payload: UpdateEntityPayload } }): Promise<any> {
        const res = await callFetch(`${url}/${arg.id}`, "PUT", arg.payload);
        if (!res.ok) {
            const text = await res.text();
            throw new Error(text || "Error notificationProvider update.")
        }
        return res.json()
    }
    
    async function deleteById(url: string, { arg }: { arg: { id: string } }): Promise<any> {
        const res = await callFetch(`${url}/${arg.id}`, "DELETE");
        if (!res.ok) {
            const text = await res.text();
            throw new Error(text || "Error notificationProvider creation.")
        }
        return res.json();
    }

    return {
        getList,
        create,
        update,
        deleteById
    }
}