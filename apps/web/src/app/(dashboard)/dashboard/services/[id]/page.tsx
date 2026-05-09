import { getClientServer, getServerResources } from "@/lib/pelican";
import { notFound } from "next/navigation";
import { ServerTabs } from "@/components/server/server-tabs";
import { InstallingScreen } from "@/components/server/installing-screen";

export default async function ServerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let server;
  try {
    server = await getClientServer(id);
  } catch {
    notFound();
  }

  if (!server) notFound();

  // Show installing screen if the server is still being set up
  if (server.is_installing) {
    return <InstallingScreen serverId={id} serverName={server.name} />;
  }

  let resources;
  try {
    resources = await getServerResources(id);
  } catch {
    // Server exists but resources not available yet
  }

  const state = resources?.current_state ?? "offline";

  const allocation = server.relationships.allocations.data.find(
    (a) => a.attributes.is_default
  )?.attributes;

  const eggName = server.docker_image?.includes("java") ? "Minecraft" : "Game Server";
  const versionMatch = server.docker_image?.match(/(\d+\.\d+(?:\.\d+)?)/);
  const eggVersion = versionMatch ? versionMatch[1] : "";

  return (
    <ServerTabs
      serverId={id}
      serverName={server.name}
      currentState={state}
      limits={server.limits}
      uuid={server.uuid}
      node={server.node}
      description={server.description ?? ""}
      sftpDetails={server.sftp_details}
      allocation={allocation ?? null}
      variables={(server.relationships.variables?.data ?? []).map((v) => v.attributes)}
      backupLimit={server.feature_limits?.backups ?? 0}
      eggName={eggName}
      eggVersion={eggVersion}
    />
  );
}
