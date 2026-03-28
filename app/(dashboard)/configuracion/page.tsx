import { getSettings } from "./actions";
import { ConfiguracionClient } from "./configuracion-client";

export default async function ConfiguracionPage() {
  const settings = await getSettings();

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Configuración</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Ajustes generales de la aplicación
        </p>
      </div>

      <ConfiguracionClient settings={settings} />
    </div>
  );
}
