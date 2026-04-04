import { useMemo } from "react";
import { Option } from "@/components/form/Select";
import { useSources } from "@/handlers/sources/sourcesHooks";
import { useListDestinations } from "@/handlers/destinations/destinationHooks";
import { DestinationType } from "@/handlers/destinations/type";
import { SourceType } from "@/handlers/sources/type";
import { TargetType } from "@/handlers/jobs/type";

const SOURCE_TYPES_BY_TARGET: Record<TargetType, SourceType[]> = {
    app: ["mongodb"],
    database: ["mongodb"],
    "object-replication": ["s3"],
};

const DESTINATION_TYPES_BY_TARGET: Partial<Record<TargetType, DestinationType[]>> = {
    "object-replication": ["s3", "ssh"],
};

export function useSourceOption(targetType?: TargetType): { sourceOptions: Option[] } {
    const { sources } = useSources();

    const sourceOptions = useMemo(() => {
        const allowedTypes = targetType ? SOURCE_TYPES_BY_TARGET[targetType] : null;
        return sources
            .filter((source) => !allowedTypes || allowedTypes.includes(source.type))
            .map(({ id, name }) => ({ value: id, label: name }));
    }, [sources, targetType])
    
    return {
        sourceOptions
    }
}

export function useDestinationOption(targetType?: TargetType): { destinationOptions: Option[] } {
    const { data } = useListDestinations();
    const destinationOptions = useMemo(() => {
        const allowedTypes = targetType ? DESTINATION_TYPES_BY_TARGET[targetType] : null;
        return data
            .filter((destination) => !allowedTypes || allowedTypes.includes(destination.type))
            .map(({ id, name }) => ({ value: id, label: name }));
    }, [data, targetType]);
    return {
        destinationOptions
    }
}

