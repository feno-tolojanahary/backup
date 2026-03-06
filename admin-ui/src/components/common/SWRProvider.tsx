"use client"
import { SWRConfig } from "swr";
import { fetcher } from "@/services/fetcher";
import React from "react";


export default function SWRProvider ({ children }: { children: React.ReactNode }) {
    return (
    <SWRConfig 
        value={{ fetcher, revalidateOnFocus: false }}
    >
        {children}
    </SWRConfig>
    )
}