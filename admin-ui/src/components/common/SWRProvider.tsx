"use client"
import { SWRConfig } from "swr";
import { fetcher } from "@/handlers/fetcher";
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