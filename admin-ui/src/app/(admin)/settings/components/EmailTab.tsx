import React from "react";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Switch from "@/components/form/switch/Switch";
import { FieldLabel, SectionCard, TabActions } from "./SettingsShared";

type EmailTabProps = {
  smtpRecipients: string;
  setSmtpRecipients: (value: string) => void;
  sesRecipients: string;
  setSesRecipients: (value: string) => void;
};

export default function EmailTab({
  smtpRecipients,
  setSmtpRecipients,
  sesRecipients,
  setSesRecipients,
}: EmailTabProps) {
  return (
    <div className="space-y-6">
      <SectionCard title="SMTP Configuration">
        <div className="grid gap-5 lg:grid-cols-[1fr_2fr] lg:items-center">
          <FieldLabel label="SMTP Host" />
          <Input defaultValue="smtp.mailserver.com" />
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:items-center">
          <div className="space-y-2">
            <FieldLabel label="SMTP Port" />
            <Input type="number" defaultValue="587" />
          </div>
          <div className="space-y-2">
            <FieldLabel label="Secure Connection" />
            <Switch label="true" defaultChecked />
          </div>
        </div>
        <div className="grid gap-5 lg:grid-cols-[1fr_2fr] lg:items-center">
          <FieldLabel label="Authentication Username" />
          <Input defaultValue="backup-system" />
        </div>
        <div className="grid gap-5 lg:grid-cols-[1fr_2fr] lg:items-center">
          <FieldLabel label="Authentication Password" />
          <Input type="password" defaultValue="••••••••••" />
        </div>
        <div className="grid gap-5 lg:grid-cols-[1fr_2fr] lg:items-center">
          <FieldLabel label="From Email Address" />
          <Input defaultValue="backup-system@company.com" />
        </div>
        <div className="grid gap-5 lg:grid-cols-[1fr_2fr] lg:items-center">
          <FieldLabel label="Recipients" />
          <TextArea rows={4} value={smtpRecipients} onChange={setSmtpRecipients} />
        </div>
        <TabActions />
      </SectionCard>

      <SectionCard title="Amazon SES Configuration">
        <div className="grid gap-5 sm:grid-cols-2 lg:items-center">
          <div className="space-y-2">
            <FieldLabel label="AWS Region" />
            <Input defaultValue="us-east-1" />
          </div>
          <div className="space-y-2">
            <FieldLabel label="Port" />
            <Input type="number" defaultValue="587" />
          </div>
        </div>
        <div className="grid gap-5 lg:grid-cols-[1fr_2fr] lg:items-center">
          <FieldLabel label="Access Key ID" />
          <Input defaultValue="AKIA••••••••" />
        </div>
        <div className="grid gap-5 lg:grid-cols-[1fr_2fr] lg:items-center">
          <FieldLabel label="Secret Access Key" />
          <Input type="password" defaultValue="••••••••••" />
        </div>
        <div className="grid gap-5 lg:grid-cols-[1fr_2fr] lg:items-center">
          <FieldLabel label="Recipients" />
          <TextArea rows={4} value={sesRecipients} onChange={setSesRecipients} />
        </div>
        <TabActions />
      </SectionCard>
    </div>
  );
}
