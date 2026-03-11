"use client";

import React, { useState } from "react";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import { Modal } from "@/components/ui/modal";
import { SourceType } from "./types";

type SourceCreateModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

const sourceTypeOptions = [
  { value: "mongodb", label: "MongoDB" },
  { value: "s3", label: "S3 Bucket" },
  { value: "filesystem", label: "Filesystem" },
];

const SourceCreateModal: React.FC<SourceCreateModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [sourceType, setSourceType] = useState<SourceType>("mongodb");

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[620px] m-4">
      <div className="p-6 sm:p-8">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Add Source
        </h3>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Select a source type and provide connection details.
        </p>

        <div className="mt-6 space-y-5">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Source type
            </label>
            <Select
              options={sourceTypeOptions}
              placeholder="Choose a source type"
              defaultValue={sourceType}
              onChange={(value) => setSourceType(value as SourceType)}
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Name
            </label>
            <Input placeholder="source-name" />
          </div>

          {sourceType === "mongodb" && (
            <>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Connection URI
                </label>
                <Input placeholder="mongodb://user:pass@localhost:27017" />
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Database
                </label>
                <Input placeholder="local" />
              </div>
            </>
          )}

          {sourceType === "s3" && (
            <>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Bucket name
                </label>
                <Input placeholder="backup-source" />
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Prefix
                </label>
                <Input placeholder="/" />
              </div>
            </>
          )}

          {sourceType === "filesystem" && (
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Path
              </label>
              <Input placeholder="/var/lib/data" />
            </div>
          )}
        </div>

        <div className="mt-8 flex flex-wrap justify-end gap-3">
          <Button size="sm" variant="outline" type="button">
            Test Connection
          </Button>
          <Button size="sm" type="button" onClick={onClose}>
            Save Source
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default SourceCreateModal;
