import { createClerkClient } from "@clerk/express";

export const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

export const getClerkProfile = (clerkUser) => {
  const primaryEmail = clerkUser.emailAddresses?.find(
    (e) => e.id === clerkUser.primaryEmailAddressId
  );
  const email =
    primaryEmail?.emailAddress || clerkUser.emailAddresses?.[0]?.emailAddress || "";

  const fullName =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ").trim() ||
    clerkUser.username ||
    "";

  return {
    email,
    fullName,
    profilePic: clerkUser.imageUrl || "",
  };
};
