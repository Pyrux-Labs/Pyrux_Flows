import { getSettings } from "./actions";
import { ConfiguracionShell } from "@/components/modules/configuracion/configuracion-shell";

export default async function ConfiguracionPage() {
  const settings = await getSettings();
  return <ConfiguracionShell settings={settings} />;
}
