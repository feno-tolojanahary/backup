import useSWR, { mutate } from "swr";
import useSWRMutation from "swr/mutation";
import { CreateSourcePayload, Source, UpdateSourcePayload } from "./type";
import { fetcher } from "@/services/fetcher";
import { createSource, deleteSource, updateSource } from "./service";

const SOURCE_URL = "/sources";

export function useSources () {
    const { data, error, isLoading } = useSWR<Source[]>(SOURCE_URL, fetcher);

    return {
        sources: data,
        isLoading,
        error
    }
}

export function useCreateSource () {
    const { trigger, isMutating, error } = useSWRMutation<Source, Error, string, CreateSourcePayload>(SOURCE_URL, createSource);
    async function create(payload: CreateSourcePayload) {
        const result = await trigger(payload);
        mutate(SOURCE_URL);
        return result;
    }
    return {
        isMutating,
        error,
        createSource: create
    }
}

type UpdateArgs = {
    id: string,
    payload: UpdateSourcePayload
}

export function useUpdateSource () {
    const { trigger, isMutating, error } = useSWRMutation<Source, Error, string, UpdateArgs>(SOURCE_URL, updateSource);
    async function update(id: string, payload: UpdateSourcePayload) {
        const result = await trigger({id, payload});
        mutate(SOURCE_URL);
        return result;
    }
    return {
        isMutating,
        error,
        updateSource: update
    }
}

export function useDeleteSource() {
    const { trigger, isMutating, error } = useSWRMutation<Source, Error, string, { id: string }>(SOURCE_URL, deleteSource);
    async function _delete(id: string) {
        const result = await trigger({id});
        mutate(SOURCE_URL);
        return result;
    }
    return {
        isMutating,
        error,
        deleteSource: _delete
    }
}