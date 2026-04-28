import ProfileView from "@/app/(page)/profile/profile-view";

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ username: string }> | { username: string };
}) {
  const resolvedParams = await Promise.resolve(params);
  const username =
    typeof resolvedParams?.username === "string"
      ? decodeURIComponent(resolvedParams.username)
      : "";

  return <ProfileView key={username} requestedUsername={username} />;
}
