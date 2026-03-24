import useSWR from "swr";
import { NotificationEvent } from "./type";
import { getNotificationEvents } from "./notificationEventService";


const url = "/notification-events";

export function useNotificationEvents() {
    const { data, error, isLoading } = useSWR<NotificationEvent[]>(url, getNotificationEvents);

    return {
        notificationEvents: data || [],
        isLoading,
        error
    }
}