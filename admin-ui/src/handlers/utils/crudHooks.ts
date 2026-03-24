import useSWR, { mutate } from "swr";
import useSWRMutation from "swr/mutation";

type UpdateArgs<T> = {
    id: number,
    payload: T
}

type DeleteArgs = {
    id: number
}

export function createCrudHooks <Entity, CreatePayload = Partial<Entity>, UpdatePayload = Partial<Entity>> (
    url: string,
    service: {
        create: (url: string, { arg }: { arg: { payload: CreatePayload }}) => Promise<any>,
        update: (url: string, { arg }: { arg: UpdateArgs<UpdatePayload> }) => Promise<any>,
        delete: (url: string, { arg }: { arg: { id: number } }) => Promise<any>,
        getList: (url: string, { arg }: { arg: { query: any } }) => Promise<any>
    }
) {
    function useList () {
        const { data, error, isLoading } = useSWR<Entity[]>(url, service.getList);

        return {
            data: data || [],
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
        async function update(id: number, payload: UpdatePayload) {
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
        async function deleteEntity(id: number) {
            const result = await trigger({id});
            mutate(url);
            return result;
        }

        return {
            isMutating,
            error,
            deleteById: deleteEntity
        }
    }

    return {
        useList,
        useCreate,
        useUpdate,
        useDelete
    }
}

            