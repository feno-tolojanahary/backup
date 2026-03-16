import { useMemo, useState } from "react";
import { Option } from "@/components/form/Select";
import { useSources } from "@/handlers/sources/sourcesHooks";
import { useListDestinations } from "@/handlers/destinations/destinationHooks";

export function useSourceOption(): { sourceOptions: Option[] } {
    
    const { sources } = useSources();

    const sourceOptions = useMemo(() => sources.map(({ id, name }) => ({ value: id, label: name })), [sources])
    
    return {
        sourceOptions
    }
}

export function useDestinationOption(): { destinationOptions: Option[] } {
    const { data } = useListDestinations();
    const destinationOptions = useMemo(() => data.map(({ id, name }) => ({ value: id, label: name })), [data]);
    return {
        destinationOptions
    }
}

