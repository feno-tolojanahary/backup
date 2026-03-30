"use client";

import UserAccessCard from "@/components/user-profile/UserAccessCard";
import UserInfoCard from "@/components/user-profile/UserInfoCard";
import UserMetaCard from "@/components/user-profile/UserMetaCard";
import UserSecurityCard from "@/components/user-profile/UserSecurityCard";
import { FormProvider, useForm } from "react-hook-form";
import { UpdateUserPayload, User, UserForm } from "@/handlers/users/type";
import { updateUser } from "@/handlers/users/userService";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setUserProfile } from "@/store/features/auth/authSlice";
import { useEffect } from "react";
import { useToast } from "@/context/ToastContext";

export default function Profile() {  
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { toastError, toastSuccess } = useToast();

  const methods = useForm<UserForm>({
    defaultValues: {
      fullName: user?.fullName ?? "",
      email: user?.email ?? "",
      companyName: user?.companyName ?? "",
      role: "",
      avatarUrl: "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
      twoFactorEnabled: false,
      twoFactorSecret: "",
      lastPasswordChangeAt: "",
    },
  });

  useEffect(() => {
    if (!user) return;
    methods.reset({
      fullName: user.fullName ?? "",
      email: user.email ?? "",
      companyName: user.companyName ?? "",
      role: (user as User).twoFactorEnable ? "Admin" : "",
      avatarUrl: "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
      twoFactorEnabled: user.twoFactorEnable === "true",
      twoFactorSecret: "",
      lastPasswordChangeAt: "",
    });
  }, [user, methods]);

  const saveUsers = async (data: UserForm) => {
    if (!user?.id) return;
    try {
      const nextEmail = data.email || user.email;
      const nextFullName = data.fullName || user.fullName;
      const nextCompanyName = data.companyName || user.companyName;
      const nextTwoFactorEnable = data.twoFactorEnabled ? "true" : "false";

      const payload: UpdateUserPayload = {
        email: nextEmail,
        firstName: nextFullName,
        companyName: nextCompanyName,
        password: data.newPassword ? data.newPassword : undefined,
        twoFactorEnable: nextTwoFactorEnable,
      };
      const formData = new FormData();
      for (const [key, value] of Object.entries((payload))) {
        formData.append(key, value);
      }
      formData.append("avatar", data.avatarUrl);
      await updateUser(user.id, formData);

      dispatch(
        setUserProfile({
          fullName: nextFullName,
          email: nextEmail,
          companyName: nextCompanyName,
          twoFactorEnable: nextTwoFactorEnable,
          
        })
      );
      toastSuccess("Saving user information with success.");
    } catch (error: any) {
      console.error("Error save user profile: ", error.message);
      toastError();
    }
  };

  if (!user) return <div>Loading...</div>;

  return (
    <div>
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
          Profile
        </h3>
        <div className="space-y-6">
          <FormProvider {...methods}>
            <UserMetaCard />
            <UserInfoCard onSubmit={saveUsers} user={user} />
            <UserSecurityCard onSubmit={saveUsers} />
            <UserAccessCard />
          </FormProvider>
        </div>
      </div>
    </div>
  );
}
