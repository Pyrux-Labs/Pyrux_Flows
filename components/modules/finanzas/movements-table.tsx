"use client";

import { useState, useMemo } from "react";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { SortableHead } from "@/components/shared/sortable-head";
import { Pencil, TrendingUp, RefreshCw, AlertCircle } from "lucide-react";
import { formatCurrency, formatDate, compareStrings } from "@/lib/utils";
import {
	MOVEMENT_CREDIT_CATEGORY_LABELS,
	MOVEMENT_DEBIT_CATEGORY_LABELS,
} from "@/lib/constants/labels";
import type {
	Movement,
	MovementType,
	ProjectWithClient,
} from "@/lib/types/database.types";

type SortColumn =
	| "type"
	| "description"
	| "project"
	| "amount"
	| "date"
	| "category";
type SortDirection = "asc" | "desc";

interface MovementsTableProps {
	movements: Movement[];
	projects: ProjectWithClient[];
	isLoading: boolean;
	filter: MovementType | "all";
	onEdit: (movement: Movement) => void;
}

const CATEGORY_LABELS: Record<MovementType, Record<string, string>> = {
	credit: MOVEMENT_CREDIT_CATEGORY_LABELS,
	debit: MOVEMENT_DEBIT_CATEGORY_LABELS,
};

export function MovementsTable({
	movements,
	projects,
	isLoading,
	filter,
	onEdit,
}: MovementsTableProps) {
	const [sortColumn, setSortColumn] = useState<SortColumn>("date");
	const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
	const projectMap = Object.fromEntries(projects.map((p) => [p.id, p]));

	function handleSort(column: string) {
		const col = column as SortColumn;
		if (col === sortColumn) {
			setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
		} else {
			setSortColumn(col);
			setSortDirection(col === "date" ? "desc" : "asc");
		}
	}

	const sorted = useMemo(() => {
		const dir = sortDirection === "asc" ? 1 : -1;
		return [...movements].sort((a, b) => {
			let cmp = 0;
			switch (sortColumn) {
				case "type":
					cmp = compareStrings(a.type, b.type);
					break;
				case "description": {
					const descA = a.description ?? a.counterpart_name ?? "";
					const descB = b.description ?? b.counterpart_name ?? "";
					cmp = compareStrings(descA, descB);
					break;
				}
				case "project": {
					const projA = a.project_id
						? (projectMap[a.project_id]?.name ?? null)
						: null;
					const projB = b.project_id
						? (projectMap[b.project_id]?.name ?? null)
						: null;
					cmp = compareStrings(projA, projB);
					break;
				}
				case "amount":
					cmp = a.amount - b.amount;
					break;
				case "date":
					cmp = a.date < b.date ? -1 : a.date > b.date ? 1 : 0;
					break;
				case "category": {
					const catLabels = CATEGORY_LABELS[a.type];
					const catA = a.category
						? (catLabels[a.category] ?? a.category)
						: null;
					const catLabelsB = CATEGORY_LABELS[b.type];
					const catB = b.category
						? (catLabelsB[b.category] ?? b.category)
						: null;
					cmp = compareStrings(catA, catB);
					break;
				}
			}
			if (cmp !== 0) return cmp * dir;
			// secondary: most recent first
			return b.date < a.date ? -1 : b.date > a.date ? 1 : 0;
		});
	}, [movements, projectMap, sortColumn, sortDirection]);

	if (isLoading) {
		return (
			<div className="space-y-2">
				{Array.from({ length: 6 }).map((_, i) => (
					<Skeleton key={i} className="h-12 w-full rounded-md" />
				))}
			</div>
		);
	}

	const emptyTitle =
		filter === "credit"
			? "Sin ingresos este mes"
			: filter === "debit"
				? "Sin gastos este mes"
				: "Sin movimientos este mes";

	if (!movements.length) {
		return (
			<EmptyState
				icon={TrendingUp}
				title={emptyTitle}
				description="Los movimientos se sincronizan automáticamente desde Mercado Pago."
			/>
		);
	}

	return (
		<div className="rounded-md border border-border overflow-hidden">
			<Table>
				<TableHeader>
					<TableRow className="hover:bg-transparent">
						{filter === "all" && (
							<SortableHead
								column="type"
								activeColumn={sortColumn}
								direction={sortDirection}
								onSort={handleSort}
								className="w-24">
								Tipo
							</SortableHead>
						)}
						<SortableHead
							column="description"
							activeColumn={sortColumn}
							direction={sortDirection}
							onSort={handleSort}>
							Descripción
						</SortableHead>
						<SortableHead
							column="project"
							activeColumn={sortColumn}
							direction={sortDirection}
							onSort={handleSort}>
							Proyecto
						</SortableHead>
						<SortableHead
							column="amount"
							activeColumn={sortColumn}
							direction={sortDirection}
							onSort={handleSort}
							className="text-right">
							Monto
						</SortableHead>
						<SortableHead
							column="date"
							activeColumn={sortColumn}
							direction={sortDirection}
							onSort={handleSort}>
							Fecha
						</SortableHead>
						<SortableHead
							column="category"
							activeColumn={sortColumn}
							direction={sortDirection}
							onSort={handleSort}>
							Categoría
						</SortableHead>
						<TableHead className="w-12" />
					</TableRow>
				</TableHeader>
				<TableBody>
					{sorted.map((entry) => {
						const project = entry.project_id
							? projectMap[entry.project_id]
							: null;
						const isUnclassified = !entry.category && !entry.project_id;
						const categoryLabels = CATEGORY_LABELS[entry.type];
						return (
							<TableRow key={entry.id} className="hover:bg-secondary/50">
								{filter === "all" && (
									<TableCell>
										<Badge
											variant="outline"
											className={
												entry.type === "credit"
													? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
													: "text-red-400 border-red-500/30 bg-red-500/10"
											}>
											{entry.type === "credit" ? "↑ Ingreso" : "↓ Gasto"}
										</Badge>
									</TableCell>
								)}
								<TableCell className="font-medium">
									<div className="flex items-center gap-1.5">
										{isUnclassified && (
											<AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
										)}
										<span className="truncate max-w-50">
											{entry.description ??
												entry.counterpart_name ??
												(entry.type === "credit"
													? "Transferencia recibida"
													: "Transferencia enviada")}
										</span>
									</div>
								</TableCell>
								<TableCell className="text-muted-foreground text-sm">
									{project ? (
										<span className="text-foreground">{project.name}</span>
									) : (
										"—"
									)}
								</TableCell>
								<TableCell className="text-right font-mono text-sm">
									{formatCurrency(entry.amount, entry.currency)}
								</TableCell>
								<TableCell className="text-muted-foreground text-sm">
									{formatDate(entry.date)}
								</TableCell>
								<TableCell>
									<div className="flex items-center gap-1.5">
										{entry.category ? (
											<Badge variant="secondary" className="text-xs">
												{categoryLabels[entry.category] ?? entry.category}
											</Badge>
										) : (
											<span className="text-muted-foreground text-xs">—</span>
										)}
										{entry.is_recurring && (
											<RefreshCw className="h-3 w-3 text-primary shrink-0" />
										)}
									</div>
								</TableCell>
								<TableCell>
									<Button
										variant="ghost"
										size="icon"
										className="h-7 w-7"
										onClick={() => onEdit(entry)}>
										<Pencil className="h-3.5 w-3.5" />
									</Button>
								</TableCell>
							</TableRow>
						);
					})}
				</TableBody>
			</Table>
		</div>
	);
}
