"use client";

import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useProspects } from "@/hooks/use-prospects";
import { useProjects } from "@/hooks/use-projects";
import { useClients } from "@/hooks/use-clients";
import { User, FolderKanban } from "lucide-react";
import { useCommandPalette } from "@/hooks/use-command-palette";

export function CommandPalette() {
  const router = useRouter();
  const { open, setOpen } = useCommandPalette();

  const { data: prospects = [] } = useProspects();
  const { data: clients = [] } = useClients();
  const { data: projects = [] } = useProjects();

  function navigate(path: string) {
    setOpen(false);
    router.push(path);
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Buscar prospectos, clientes y proyectos..." />
      <CommandList>
        <CommandEmpty>Sin resultados.</CommandEmpty>

        {clients.length > 0 && (
          <CommandGroup heading="Clientes">
            {clients.map((client) => (
              <CommandItem
                key={client.id}
                value={client.name}
                onSelect={() => navigate(`/clientes?edit=${client.id}`)}
              >
                <User className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                <span>{client.name}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {prospects.length > 0 && (
          <CommandGroup heading="Prospectos">
            {prospects.map((prospect) => (
              <CommandItem
                key={prospect.id}
                value={prospect.name}
                onSelect={() => navigate(`/prospectos?edit=${prospect.id}`)}
              >
                <User className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                <span>{prospect.name}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {projects.length > 0 && (
          <CommandGroup heading="Proyectos">
            {projects.map((project) => (
              <CommandItem
                key={project.id}
                value={`${project.name} ${project.client?.name ?? ""}`}
                onSelect={() => navigate(`/proyectos?edit=${project.id}`)}
              >
                <FolderKanban className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                <span>{project.name}</span>
                {project.client?.name && (
                  <span className="ml-1.5 text-muted-foreground text-xs truncate">
                    — {project.client.name}
                  </span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
