import { useEffect } from "react";
import Input from "@/components/form/input/InputField";
import { FieldLabel, SectionCard } from "../../notifications/components/SettingsShared";
import Button from "@/components/ui/button/Button";
import { useForm } from "react-hook-form";
import { useSettings, useSettingUpsert } from "@/handlers/settings/SettingHooks";
import { useToast } from "@/context/ToastContext";

interface FormSetting {
  workingDirectory: string;
  dataDirectory: string;
  logDirectory: string;
}

export default function GeneralTab() {

  const { getSettingValue, settings } = useSettings();
  const { upsert } = useSettingUpsert();

  const { toastSuccess, toastError } = useToast();

  useEffect(() => {
    if (settings.length > 0) {
      const defaultSetting = {
        workingDirectory: getSettingValue("workingDirectory") ?? "",
        dataDirectory: getSettingValue("dataDirectory") ?? "",
        logDirectory: getSettingValue("logDirectory") ?? ""
      }
      reset(defaultSetting);
    }
  }, [settings])

  const { register, reset, handleSubmit } = useForm<FormSetting>();

  const saveSetting = async (values: FormSetting) => {
    const data = Object.entries(values).map(([key, value]) => ({ key, value }));
    try {
       const res = await upsert(data);
       if (!res)
        throw new Error("No result found.");
      toastSuccess("Settings is saved with success.");
    } catch (error: any) {
      console.error("Save setting: ", error.message);
      toastError()
    }
  }

  return (
    <SectionCard
      title="System Directories"
      description="Configure system directories and runtime paths."
    >
      <div className="grid gap-5 lg:grid-cols-[1fr_2fr] lg:items-center">
        <FieldLabel
          label="Working Directory"
          description="Temporary directory used to store backup files before upload."
        />
        <Input 
          defaultValue="/app/output" 
          {...register("workingDirectory")}
        />
      </div>
      <div className="grid gap-5 lg:grid-cols-[1fr_2fr] lg:items-center">
        <FieldLabel
          label="Data Directory"
          description="Directory containing system data and the local database."
        />
        <Input 
          defaultValue="/app/data" 
          {...register("dataDirectory")}  
        />
      </div>
      <div className="grid gap-5 lg:grid-cols-[1fr_2fr] lg:items-center">
        <FieldLabel
          label="Log Directory"
          description="Directory where application logs are written."
        />
        <Input 
          defaultValue="/app/log" 
          {...register("logDirectory")}
        />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button size="sm" type="button" onClick={handleSubmit(saveSetting)}>
          Save Changes
        </Button>
        <Button size="sm" variant="outline" type="button">
          Cancel
        </Button>
      </div>
    </SectionCard>
  );
}
