import { fetcher } from "@/handlers/fetcher";
import useSWR, { mutate } from "swr";
import useSWRMutation from "swr/mutation";

type UpdateArgs<T> = {
    id: string,
    payload: T
}

type DeleteArgs = {
    id: string
}

export function createCrudHooks <Entity, CreatePayload = Partial<Entity>, UpdatePayload = Partial<Entity>> (
    url: string,
    service: {
        create: (url: string, { arg }: { arg: { payload: CreatePayload }}) => Promise<any>,
        update: (url: string, { arg }: { arg: UpdateArgs<UpdatePayload> }) => Promise<any>,
        delete: (url: string, { arg }: { arg: { id: string } }) => Promise<any>,
        getList: (url: string, { arg }: { arg: { query: any } }) => Promise<any>
    }
) {
    function useList () {
        const { data, error, isLoading } = useSWR<Entity[]>(url, service.getList);

        return {
            data: data,
            isLoading,
            error
        }
    }

    function useCreate() {
        const { trigger, isMutating, error } = useSWRMutation<Entity, Error, string, { payload: CreatePayload }>(url, service.create);
        async function create(payload: CreatePayload) {
            const result = await trigger({payload});
            mutate(url);
            return result;
        }

        return {
            isMutating,
            error,
            create
        }
    }
    
    function useUpdate() {
        const { trigger, isMutating, error } = useSWRMutation<Entity, Error, string, UpdateArgs<UpdatePayload>>(url, service.update);
        async function update(id: string, payload: UpdatePayload) {
            const result = await trigger({ id, payload });
            mutate(url);
            return result;
        }

        return {
            isMutating,
            error,
            update
        }
    }

    function useDelete() {
        const { trigger, isMutating, error } = useSWRMutation<Entity, Error, string, DeleteArgs>(url, service.delete);
        async function deleteEntity(id: string) {
            const result = await trigger({id});
            mutate(url);
            return result;
        }

        return {
            isMutating,
            error,
            delete: deleteEntity
        }
    }

    return {
        useList,
        useCreate,
        useUpdate,
        useDelete
    }
}

