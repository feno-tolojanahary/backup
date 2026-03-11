"use client";

import React, { useMemo, useState } from "react";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import Switch from "@/components/form/switch/Switch";
import { Modal } from "@/components/ui/modal";

type ConfigMethod = "smtp" | "ses";
type ProviderType = "email";
type EncryptionType = "none" | "ssl" | "starttls";

type SmtpConfig = {
  host: string;
  port: string;
  username: string;
  password: string;
  senderEmail: string;
  encryption: EncryptionType;
};

type SesConfig = {
  region: string;
  accessKey: string;
  secretKey: string;
  senderEmail: string;
  configurationSet?: string;
};

type NotificationProviderPayload =
  | {
      name: string;
      type: ProviderType;
      enabled: boolean;
      method: "smtp";
      config: {
        host: string;
        port: number;
        username: string;
        password: string;
        senderEmail: string;
        encryption: EncryptionType;
      };
    }
  | {
      name: string;
      type: ProviderType;
      enabled: boolean;
      method: "ses";
      config: {
        region: string;
        accessKey: string;
        secretKey: string;
        senderEmail: string;
        configurationSet?: string;
      };
    };

type CreateNotificationProviderModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (payload: NotificationProviderPayload) => void;
};

const providerTypeOptions = [{ value: "email", label: "Email" }];

const methodOptions = [
  { value: "smtp", label: "SMTP" },
  { value: "ses", label: "SES" },
];

const encryptionOptions = [
  { value: "none", label: "None" },
  { value: "ssl", label: "SSL" },
  { value: "starttls", label: "STARTTLS" },
];

const sesRegionOptions = [
  { value: "us-east-1", label: "us-east-1" },
  { value: "us-west-2", label: "us-west-2" },
  { value: "eu-west-1", label: "eu-west-1" },
];

const CreateNotificationProviderModal: React.FC<
  CreateNotificationProviderModalProps
> = ({ isOpen, onClose, onSubmit }) => {
  const [name, setName] = useState("");
  const [providerType, setProviderType] = useState<ProviderType>("email");
  const [enabled, setEnabled] = useState(true);
  const [method, setMethod] = useState<ConfigMethod>("smtp");

  const [smtpConfig, setSmtpConfig] = useState<SmtpConfig>({
    host: "",
    port: "",
    username: "",
    password: "",
    senderEmail: "",
    encryption: "starttls",
  });

  const [sesConfig, setSesConfig] = useState<SesConfig>({
    region: "",
    accessKey: "",
    secretKey: "",
    senderEmail: "",
    configurationSet: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const requiredFields = useMemo(() => {
    if (method === "smtp") {
      return ["name", "smtpHost", "smtpPort", "smtpUsername", "smtpPassword", "smtpSenderEmail", "smtpEncryption"];
    }
    return ["name", "sesRegion", "sesAccessKey", "sesSecretKey", "sesSenderEmail"];
  }, [method]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};

    if (!name.trim()) nextErrors.name = "Provider name is required.";

    if (method === "smtp") {
      if (!smtpConfig.host.trim()) nextErrors.smtpHost = "SMTP host is required.";
      if (!smtpConfig.port.trim()) nextErrors.smtpPort = "Port is required.";
      if (!smtpConfig.username.trim())
        nextErrors.smtpUsername = "Username is required.";
      if (!smtpConfig.password.trim())
        nextErrors.smtpPassword = "Password is required.";
      if (!smtpConfig.senderEmail.trim())
        nextErrors.smtpSenderEmail = "Sender email is required.";
      if (!smtpConfig.encryption)
        nextErrors.smtpEncryption = "Encryption is required.";
    }

    if (method === "ses") {
      if (!sesConfig.region.trim()) nextErrors.sesRegion = "Region is required.";
      if (!sesConfig.accessKey.trim())
        nextErrors.sesAccessKey = "Access key is required.";
      if (!sesConfig.secretKey.trim())
        nextErrors.sesSecretKey = "Secret key is required.";
      if (!sesConfig.senderEmail.trim())
        nextErrors.sesSenderEmail = "Sender email is required.";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const payload: NotificationProviderPayload =
      method === "smtp"
        ? {
            name: name.trim(),
            type: providerType,
            enabled,
            method: "smtp",
            config: {
              host: smtpConfig.host.trim(),
              port: Number(smtpConfig.port),
              username: smtpConfig.username.trim(),
              password: smtpConfig.password,
              senderEmail: smtpConfig.senderEmail.trim(),
              encryption: smtpConfig.encryption,
            },
          }
        : {
            name: name.trim(),
            type: providerType,
            enabled,
            method: "ses",
            config: {
              region: sesConfig.region.trim(),
              accessKey: sesConfig.accessKey.trim(),
              secretKey: sesConfig.secretKey,
              senderEmail: sesConfig.senderEmail.trim(),
              configurationSet: sesConfig.configurationSet?.trim() || undefined,
            },
          };

    onSubmit?.(payload);
    console.log("Create notification provider payload", payload);
    onClose();
  };

  const requiredMarker = (key: string) =>
    requiredFields.includes(key) ? (
      <span className="text-error-500"> *</span>
    ) : null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[680px] m-4">
      <form onSubmit={handleSubmit} className="p-6 sm:p-8">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Create Notification Provider
          </h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Configure a notification channel used to send alerts from the backup
            system.
          </p>
        </div>

        <div className="mt-6 space-y-6">
          <div>
            <h4 className="text-sm font-semibold text-gray-800 dark:text-white/90">
              Provider Information
            </h4>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Provider Name{requiredMarker("name")}
                </label>
                <Input
                  placeholder="Admin Email"
                  defaultValue={name}
                  onChange={(e) => setName(e.target.value)}
                  error={Boolean(errors.name)}
                  hint={errors.name}
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Provider Type
                </label>
                <Select
                  options={providerTypeOptions}
                  placeholder="Select type"
                  defaultValue={providerType}
                  onChange={(value) => setProviderType(value as ProviderType)}
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Provider Status
                </label>
                <Switch
                  label={enabled ? "Enabled" : "Disabled"}
                  defaultChecked={enabled}
                  onChange={(checked) => setEnabled(checked)}
                />
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-800 dark:text-white/90">
              Configuration Method
            </h4>
            <div className="mt-4">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Configuration Method
              </label>
              <Select
                options={methodOptions}
                placeholder="Choose a method"
                defaultValue={method}
                onChange={(value) => setMethod(value as ConfigMethod)}
              />
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-800 dark:text-white/90">
              Provider Configuration
            </h4>

            {method === "smtp" && (
              <div className="mt-4 space-y-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  SMTP Configuration
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      SMTP Host{requiredMarker("smtpHost")}
                    </label>
                    <Input
                      placeholder="smtp.mailserver.com"
                      defaultValue={smtpConfig.host}
                      onChange={(e) =>
                        setSmtpConfig((prev) => ({
                          ...prev,
                          host: e.target.value,
                        }))
                      }
                      error={Boolean(errors.smtpHost)}
                      hint={errors.smtpHost}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Port{requiredMarker("smtpPort")}
                    </label>
                    <Input
                      type="number"
                      placeholder="587"
                      defaultValue={smtpConfig.port}
                      onChange={(e) =>
                        setSmtpConfig((prev) => ({
                          ...prev,
                          port: e.target.value,
                        }))
                      }
                      error={Boolean(errors.smtpPort)}
                      hint={errors.smtpPort}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Username{requiredMarker("smtpUsername")}
                    </label>
                    <Input
                      placeholder="admin@mailserver.com"
                      defaultValue={smtpConfig.username}
                      onChange={(e) =>
                        setSmtpConfig((prev) => ({
                          ...prev,
                          username: e.target.value,
                        }))
                      }
                      error={Boolean(errors.smtpUsername)}
                      hint={errors.smtpUsername}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Password{requiredMarker("smtpPassword")}
                    </label>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      defaultValue={smtpConfig.password}
                      onChange={(e) =>
                        setSmtpConfig((prev) => ({
                          ...prev,
                          password: e.target.value,
                        }))
                      }
                      error={Boolean(errors.smtpPassword)}
                      hint={errors.smtpPassword}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Sender Email{requiredMarker("smtpSenderEmail")}
                    </label>
                    <Input
                      type="email"
                      placeholder="backup@mailserver.com"
                      defaultValue={smtpConfig.senderEmail}
                      onChange={(e) =>
                        setSmtpConfig((prev) => ({
                          ...prev,
                          senderEmail: e.target.value,
                        }))
                      }
                      error={Boolean(errors.smtpSenderEmail)}
                      hint={errors.smtpSenderEmail}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Encryption{requiredMarker("smtpEncryption")}
                    </label>
                    <Select
                      options={encryptionOptions}
                      placeholder="Select encryption"
                      defaultValue={smtpConfig.encryption}
                      onChange={(value) =>
                        setSmtpConfig((prev) => ({
                          ...prev,
                          encryption: value as EncryptionType,
                        }))
                      }
                    />
                    {errors.smtpEncryption && (
                      <p className="mt-1.5 text-xs text-error-500">
                        {errors.smtpEncryption}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {method === "ses" && (
              <div className="mt-4 space-y-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Amazon SES Configuration
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Region{requiredMarker("sesRegion")}
                    </label>
                    <Select
                      options={sesRegionOptions}
                      placeholder="Select region"
                      defaultValue={sesConfig.region}
                      onChange={(value) =>
                        setSesConfig((prev) => ({ ...prev, region: value }))
                      }
                    />
                    {errors.sesRegion && (
                      <p className="mt-1.5 text-xs text-error-500">
                        {errors.sesRegion}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Access Key{requiredMarker("sesAccessKey")}
                    </label>
                    <Input
                      placeholder="AKIA..."
                      defaultValue={sesConfig.accessKey}
                      onChange={(e) =>
                        setSesConfig((prev) => ({
                          ...prev,
                          accessKey: e.target.value,
                        }))
                      }
                      error={Boolean(errors.sesAccessKey)}
                      hint={errors.sesAccessKey}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Secret Key{requiredMarker("sesSecretKey")}
                    </label>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      defaultValue={sesConfig.secretKey}
                      onChange={(e) =>
                        setSesConfig((prev) => ({
                          ...prev,
                          secretKey: e.target.value,
                        }))
                      }
                      error={Boolean(errors.sesSecretKey)}
                      hint={errors.sesSecretKey}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Sender Email{requiredMarker("sesSenderEmail")}
                    </label>
                    <Input
                      type="email"
                      placeholder="backup@mailserver.com"
                      defaultValue={sesConfig.senderEmail}
                      onChange={(e) =>
                        setSesConfig((prev) => ({
                          ...prev,
                          senderEmail: e.target.value,
                        }))
                      }
                      error={Boolean(errors.sesSenderEmail)}
                      hint={errors.sesSenderEmail}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Configuration Set
                    </label>
                    <Input
                      placeholder="optional-config-set"
                      defaultValue={sesConfig.configurationSet}
                      onChange={(e) =>
                        setSesConfig((prev) => ({
                          ...prev,
                          configurationSet: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-end gap-3">
          <Button size="sm" variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" type="submit">
            Create Provider
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateNotificationProviderModal;
