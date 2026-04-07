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

  const { toastSuccess, toastError, toastWarning } = useToast();
  
  const {
    register,
    reset,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors }
  } = useForm<FormSetting>();
  
  useEffect(() => {
    if (settings.length > 0) {
      const defaultSetting = {
        workingDirectory: getSettingValue("workingDirectory") ?? "",
        dataDirectory: getSettingValue("dataDirectory") ?? "",
        logDirectory: getSettingValue("logDirectory") ?? ""
      }
      reset(defaultSetting);
    }
  }, [getSettingValue, reset, settings])

  const fieldLabels: Record<keyof FormSetting, string> = {
    workingDirectory: "Working Directory",
    dataDirectory: "Data Directory",
    logDirectory: "Log Directory"
  };

  const applyDirectoryError = (key: string) => {
    if (!(key in fieldLabels)) {
      return false;
    }
    const fieldKey = key as keyof FormSetting;
    const message = "Folder does not exist or is not writable.";
    setError(fieldKey, { type: "validate", message });
    toastWarning(`${fieldLabels[fieldKey]} is not writable or does not exist.`);
    return true;
  };

  const saveSetting = async (values: FormSetting) => {
    const data = Object.entries(values).map(([key, value]) => ({ key, value }));
    try {
      clearErrors();
      const res = await upsert(data);
      if (!res?.success)
        throw new Error("No result found.");
      toastSuccess("Settings is saved with success.");
    } catch (error: any) {
      let response: any;
      try {
        response = error?.response;
      } catch {
        response = undefined;
      }
      if (response?.status === 400) {
        const settingKey = response?.data?.message?.setting?.key;
        if (settingKey && applyDirectoryError(settingKey)) {
          return;
        }
      }
      let errorMessage = "Unknown error";
      try {
        errorMessage = error?.message ?? String(error);
      } catch {
        errorMessage = "Unknown error";
      }
      console.error("Save setting: ", errorMessage);
      toastError();
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
          error={Boolean(errors.workingDirectory)}
          hint={errors.workingDirectory?.message}
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
          error={Boolean(errors.dataDirectory)}
          hint={errors.dataDirectory?.message}
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
          error={Boolean(errors.logDirectory)}
          hint={errors.logDirectory?.message}
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
