"use client";
import React, { useEffect } from "react";
import ComponentCard from "../../common/ComponentCard";
import Button from "../../ui/button/Button";
import { Modal } from "../../ui/modal";
import Label from "../../form/Label";
import Input from "../../form/input/InputField";
import { useModal } from "@/hooks/useModal";
import { useForm } from "react-hook-form";

type FormValues = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  bio: string;
};

const defaults: FormValues = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  bio: "",
};

export default function FormInModal() {
  const { isOpen, openModal, closeModal } = useModal();
  const { register, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: defaults,
  });

  useEffect(() => {
    if (!isOpen) return;
    reset(defaults);
  }, [isOpen, reset]);

  const onSubmit = (data: FormValues) => {
    console.log("Saving changes...", data);
    closeModal();
  };

  return (
    <ComponentCard title="Form In Modal">
      <Button size="sm" onClick={openModal}>
        Open Modal
      </Button>
      <Modal
        isOpen={isOpen}
        onClose={closeModal}
        className="max-w-[584px] p-5 lg:p-10"
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <h4 className="mb-6 text-lg font-medium text-gray-800 dark:text-white/90">
            Personal Information
          </h4>

          <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
            <div className="col-span-1">
              <Label>First Name</Label>
              <Input type="text" placeholder="Emirhan" {...register("firstName")} />
            </div>

            <div className="col-span-1">
              <Label>Last Name</Label>
              <Input type="text" placeholder="Boruch" {...register("lastName")} />
            </div>

            <div className="col-span-1">
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="emirhanboruch55@gmail.com"
                {...register("email")}
              />
            </div>

            <div className="col-span-1">
              <Label>Phone</Label>
              <Input type="text" placeholder="+09 363 398 46" {...register("phone")} />
            </div>

            <div className="col-span-1 sm:col-span-2">
              <Label>Bio</Label>
              <Input type="text" placeholder="Team Manager" {...register("bio")} />
            </div>
          </div>

          <div className="flex items-center justify-end w-full gap-3 mt-6">
            <Button size="sm" variant="outline" type="button" onClick={closeModal}>
              Close
            </Button>
            <Button size="sm" type="submit">
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>
    </ComponentCard>
  );
}
