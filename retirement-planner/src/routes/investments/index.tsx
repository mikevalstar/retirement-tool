import { createFileRoute, useRouter } from "@tanstack/react-router";
import { ChevronRight, Plus, Trash2, TrendingUp, X } from "lucide-react";
import { Fragment, useState } from "react";
import type { AccountType } from "#/generated/prisma/enums";
import {
	createAccount,
	deleteAccount,
	deleteReturn,
	deleteSnapshot,
	getAccounts,
	getPeople,
	getReturns,
	getSnapshots,
} from "./accountFns";

// ─── Constants ────────────────────────────────────────────────────────────────

const ACCENT = "var(--section-investments)";
const ACCENT_HEX = "#10b981";

const TYPE_LABEL: Record<AccountType, string> = {
	TFSA: "TFSA",
	RRSP: "RRSP",
	RRIF: "RRIF",
	REGULAR_SAVINGS: "Savings",
	CHEQUING: "Chequing",
};

const NO_RETURNS = new Set<AccountType>(["CHEQUING", "REGULAR_SAVINGS"]);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtCAD = (n: number) =>
	new Intl.NumberFormat("en-CA", {
		style: "currency",
		currency: "CAD",
		maximumFractionDigits: 0,
	}).format(n);

const fmtDate = (d: Date | string) =>
	new Date(d).toLocaleDateString("en-CA", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});

const fmtReturn = (pct: number) => `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`;

// ─── Types ────────────────────────────────────────────────────────────────────

type AccountItem = Awaited<ReturnType<typeof getAccounts>>[number];
type SnapshotItem = Awaited<ReturnType<typeof getSnapshots>>[number];
type ReturnItem = Awaited<ReturnType<typeof getReturns>>[number];
type PersonItem = Awaited<ReturnType<typeof getPeople>>[number];

interface DetailState {
	snapshots: SnapshotItem[];
	returns: ReturnItem[];
	loading: boolean;
}

// ─── Route ────────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/investments/")({
	component: InvestmentsPage,
	loader: async () => {
		const [accounts, people] = await Promise.all([getAccounts(), getPeople()]);
		return { accounts, people };
	},
});

// ─── Shared Styles ────────────────────────────────────────────────────────────

const iconBtn: React.CSSProperties = {
	display: "flex",
	alignItems: "center",
	justifyContent: "center",
	padding: 4,
	borderRadius: 4,
	background: "none",
	border: "none",
	cursor: "pointer",
	flexShrink: 0,
};

const stubBtn: React.CSSProperties = {
	display: "flex",
	alignItems: "center",
	gap: 4,
	padding: "3px 8px",
	borderRadius: 4,
	background: "none",
	border: "1px solid var(--border)",
	color: "var(--text-dim)",
	fontSize: 11,
	fontFamily: "inherit",
	cursor: "pointer",
};

const thStyle = (align: "left" | "right"): React.CSSProperties => ({
	padding: "8px 12px",
	textAlign: align,
	fontSize: 11,
	fontWeight: 500,
	color: "var(--text-dim)",
	textTransform: "uppercase",
	letterSpacing: "0.05em",
	whiteSpace: "nowrap",
});

const panelInputStyle: React.CSSProperties = {
	width: "100%",
	background: "var(--surface-raised)",
	border: "1px solid var(--border)",
	borderRadius: 6,
	padding: "7px 10px",
	fontSize: 13,
	color: "var(--text)",
	fontFamily: "inherit",
	outline: "none",
	boxSizing: "border-box",
};

const panelCancelBtn: React.CSSProperties = {
	padding: "7px 16px",
	borderRadius: 6,
	background: "none",
	border: "1px solid var(--border)",
	color: "var(--text-muted)",
	fontSize: 13,
	fontFamily: "inherit",
	cursor: "pointer",
};

const panelSaveBtn = (enabled: boolean): React.CSSProperties => ({
	padding: "7px 16px",
	borderRadius: 6,
	background: enabled
		? `color-mix(in srgb, ${ACCENT_HEX} 20%, transparent)`
		: "var(--surface-raised)",
	border: `1px solid ${enabled ? `color-mix(in srgb, ${ACCENT_HEX} 40%, transparent)` : "var(--border)"}`,
	color: enabled ? ACCENT : "var(--text-dim)",
	fontSize: 13,
	fontWeight: 500,
	fontFamily: "inherit",
	cursor: enabled ? "pointer" : "default",
});

// ─── Owner Badge ──────────────────────────────────────────────────────────────

function OwnerBadge({ name }: { name: string }) {
	return (
		<span
			style={{
				display: "inline-flex",
				alignItems: "center",
				padding: "2px 8px",
				borderRadius: 12,
				fontSize: 11,
				fontWeight: 500,
				background: "var(--surface-raised)",
				color: "var(--text-muted)",
				border: "1px solid var(--border)",
				whiteSpace: "nowrap",
			}}
		>
			{name}
		</span>
	);
}

// ─── Snapshot Row ─────────────────────────────────────────────────────────────

function SnapshotLine({
	snap,
	onDelete,
}: {
	snap: SnapshotItem;
	onDelete: (id: number) => void;
}) {
	const [hovered, setHovered] = useState(false);
	return (
		<tr
			onMouseEnter={() => setHovered(true)}
			onMouseLeave={() => setHovered(false)}
			style={{ borderTop: "1px solid var(--border)" }}
		>
			<td style={{ padding: "6px 8px", color: "var(--text-muted)" }}>
				{fmtDate(snap.date)}
			</td>
			<td style={{ padding: "6px 8px", textAlign: "right" }} className="num">
				{fmtCAD(snap.balance)}
			</td>
			<td
				style={{
					padding: "6px 8px",
					color: "var(--text-dim)",
					maxWidth: 200,
					overflow: "hidden",
					textOverflow: "ellipsis",
					whiteSpace: "nowrap",
				}}
			>
				{snap.note ?? ""}
			</td>
			<td style={{ padding: "6px 4px", width: 24 }}>
				{hovered && (
					<button
						type="button"
						onClick={() => onDelete(snap.id)}
						style={iconBtn}
					>
						<Trash2 size={11} style={{ color: "var(--text-dim)" }} />
					</button>
				)}
			</td>
		</tr>
	);
}

// ─── Return Line ──────────────────────────────────────────────────────────────

function ReturnLine({
	ret,
	onDelete,
}: {
	ret: ReturnItem;
	onDelete: (id: number) => void;
}) {
	const [hovered, setHovered] = useState(false);
	const pct = ret.returnPercent;
	return (
		<tr
			onMouseEnter={() => setHovered(true)}
			onMouseLeave={() => setHovered(false)}
			style={{ borderTop: "1px solid var(--border)" }}
		>
			<td style={{ padding: "6px 8px", color: "var(--text-muted)" }}>
				{ret.year}
			</td>
			<td style={{ padding: "6px 8px", textAlign: "right" }} className="num">
				<span style={{ color: pct >= 0 ? "#10b981" : "#ef4444" }}>
					{fmtReturn(pct)}
				</span>
			</td>
			<td style={{ padding: "6px 4px", width: 24 }}>
				{hovered && (
					<button
						type="button"
						onClick={() => onDelete(ret.id)}
						style={iconBtn}
					>
						<Trash2 size={11} style={{ color: "var(--text-dim)" }} />
					</button>
				)}
			</td>
		</tr>
	);
}

// ─── Accordion Detail ─────────────────────────────────────────────────────────

function AccountDetail({
	account,
	detail,
	onDeleteSnapshot,
	onDeleteReturn,
}: {
	account: AccountItem;
	detail: DetailState;
	onDeleteSnapshot: (id: number) => void;
	onDeleteReturn: (id: number) => void;
}) {
	const showReturns = !NO_RETURNS.has(account.type);

	return (
		<tr>
			<td colSpan={7} style={{ padding: 0 }}>
				<div
					style={{
						background: "var(--app-bg)",
						borderBottom: "1px solid var(--border)",
						padding: "16px 32px 20px 48px",
						display: "flex",
						gap: 40,
					}}
				>
					{/* Balance History */}
					<div style={{ flex: 1, minWidth: 0 }}>
						<div
							style={{
								display: "flex",
								alignItems: "center",
								justifyContent: "space-between",
								marginBottom: 10,
							}}
						>
							<span
								style={{
									fontSize: 11,
									fontWeight: 600,
									color: "var(--text-muted)",
									textTransform: "uppercase",
									letterSpacing: "0.07em",
								}}
							>
								Balance History
							</span>
							<button type="button" style={stubBtn}>
								<Plus size={10} />
								Add Snapshot
							</button>
						</div>

						{detail.loading ? (
							<div
								style={{
									fontSize: 12,
									color: "var(--text-dim)",
									fontStyle: "italic",
								}}
							>
								Loading…
							</div>
						) : detail.snapshots.length === 0 ? (
							<div
								style={{
									fontSize: 12,
									color: "var(--text-dim)",
									fontStyle: "italic",
								}}
							>
								No balance snapshots yet
							</div>
						) : (
							<table
								style={{
									width: "100%",
									borderCollapse: "collapse",
									fontSize: 12,
								}}
							>
								<thead>
									<tr>
										<th style={thStyle("left")}>Date</th>
										<th style={thStyle("right")}>Balance</th>
										<th style={thStyle("left")}>Note</th>
										<th style={{ width: 24 }} />
									</tr>
								</thead>
								<tbody>
									{detail.snapshots.map((snap) => (
										<SnapshotLine
											key={snap.id}
											snap={snap}
											onDelete={onDeleteSnapshot}
										/>
									))}
								</tbody>
							</table>
						)}
					</div>

					{/* Returns History */}
					{showReturns && (
						<div style={{ width: 220, flexShrink: 0 }}>
							<div
								style={{
									display: "flex",
									alignItems: "center",
									justifyContent: "space-between",
									marginBottom: 10,
								}}
							>
								<span
									style={{
										fontSize: 11,
										fontWeight: 600,
										color: "var(--text-muted)",
										textTransform: "uppercase",
										letterSpacing: "0.07em",
									}}
								>
									Annual Returns
								</span>
								<button type="button" style={stubBtn}>
									<Plus size={10} />
									Add
								</button>
							</div>

							{detail.loading ? (
								<div
									style={{
										fontSize: 12,
										color: "var(--text-dim)",
										fontStyle: "italic",
									}}
								>
									Loading…
								</div>
							) : detail.returns.length === 0 ? (
								<div
									style={{
										fontSize: 12,
										color: "var(--text-dim)",
										fontStyle: "italic",
									}}
								>
									No returns recorded
								</div>
							) : (
								<table
									style={{
										width: "100%",
										borderCollapse: "collapse",
										fontSize: 12,
									}}
								>
									<thead>
										<tr>
											<th style={thStyle("left")}>Year</th>
											<th style={thStyle("right")}>Return</th>
											<th style={{ width: 24 }} />
										</tr>
									</thead>
									<tbody>
										{detail.returns.map((ret) => (
											<ReturnLine
												key={ret.id}
												ret={ret}
												onDelete={onDeleteReturn}
											/>
										))}
									</tbody>
								</table>
							)}
						</div>
					)}
				</div>
			</td>
		</tr>
	);
}

// ─── Floating TOC ─────────────────────────────────────────────────────────────

function FloatingToc({ accounts }: { accounts: AccountItem[] }) {
	const [hoveredId, setHoveredId] = useState<number | null>(null);
	const groups = accounts.reduce<Map<string, AccountItem[]>>((m, a) => {
		if (!m.has(a.owner.name)) m.set(a.owner.name, []);
		m.get(a.owner.name)?.push(a);
		return m;
	}, new Map());

	return (
		<div
			style={{
				position: "sticky",
				top: 20,
				width: 160,
				flexShrink: 0,
				alignSelf: "flex-start",
			}}
		>
			<div
				style={{
					background: "var(--surface)",
					border: "1px solid var(--border)",
					borderRadius: 8,
					padding: "10px 0",
				}}
			>
				<div
					style={{
						fontSize: 10,
						fontWeight: 600,
						textTransform: "uppercase",
						letterSpacing: "0.07em",
						color: "var(--text-dim)",
						padding: "0 12px 8px",
					}}
				>
					Jump to
				</div>
				{[...groups.entries()].map(([owner, accs]) => (
					<div key={owner}>
						<div
							style={{
								fontSize: 10,
								fontWeight: 600,
								color: ACCENT,
								padding: "4px 12px 2px",
								textTransform: "uppercase",
								letterSpacing: "0.05em",
							}}
						>
							{owner}
						</div>
						{accs.map((a) => (
							<a
								key={a.id}
								href={`#account-${a.id}`}
								style={{
									display: "block",
									padding: "3px 12px",
									fontSize: 12,
									color:
										hoveredId === a.id ? "var(--text)" : "var(--text-muted)",
									textDecoration: "none",
									overflow: "hidden",
									textOverflow: "ellipsis",
									whiteSpace: "nowrap",
								}}
								onMouseEnter={() => setHoveredId(a.id)}
								onMouseLeave={() => setHoveredId(null)}
							>
								{a.name}
							</a>
						))}
					</div>
				))}
			</div>
		</div>
	);
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState() {
	return (
		<div
			style={{
				padding: "48px 24px",
				background: "var(--surface)",
				border: "1px solid var(--border)",
				borderRadius: 8,
				textAlign: "center",
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				gap: 12,
			}}
		>
			<div
				style={{
					width: 44,
					height: 44,
					borderRadius: 10,
					backgroundColor: `color-mix(in srgb, ${ACCENT_HEX} 10%, transparent)`,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
				}}
			>
				<TrendingUp size={20} style={{ color: ACCENT }} />
			</div>
			<div style={{ fontSize: 14, fontWeight: 500, color: "var(--text)" }}>
				No accounts yet
			</div>
			<div style={{ fontSize: 13, color: "var(--text-muted)" }}>
				Click "Add Account" to add your first investment account.
			</div>
		</div>
	);
}

// ─── Panel Field Wrapper ──────────────────────────────────────────────────────

function Field({
	label,
	children,
}: {
	label: string;
	children: React.ReactNode;
}) {
	return (
		<div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
			<label
				style={{
					fontSize: 11,
					fontWeight: 500,
					color: "var(--text-muted)",
					textTransform: "uppercase",
					letterSpacing: "0.05em",
				}}
			>
				{label}
			</label>
			{children}
		</div>
	);
}

// ─── Add Account Panel ────────────────────────────────────────────────────────

function AddAccountPanel({
	people,
	onClose,
	onSaved,
}: {
	people: PersonItem[];
	onClose: () => void;
	onSaved: () => void;
}) {
	const today = new Date().toISOString().slice(0, 10);
	const [name, setName] = useState("");
	const [type, setType] = useState<AccountType>("TFSA");
	const [ownerId, setOwnerId] = useState<number>(people[0]?.id ?? 0);
	const [balance, setBalance] = useState("");
	const [date, setDate] = useState(today);
	const [saving, setSaving] = useState(false);

	const canSave = name.trim().length > 0 && !saving;

	const handleSave = async () => {
		if (!canSave) return;
		setSaving(true);
		await createAccount({
			data: {
				name: name.trim(),
				type,
				ownerId,
				initialBalance: balance !== "" ? Number(balance) : undefined,
				initialDate: balance !== "" ? date : undefined,
			},
		});
		onSaved();
	};

	return (
		<>
			{/* Backdrop */}
			<div
				onClick={onClose}
				style={{
					position: "fixed",
					inset: 0,
					background: "rgba(0,0,0,0.45)",
					zIndex: 100,
				}}
			/>

			{/* Panel */}
			<div
				style={{
					position: "fixed",
					top: 0,
					right: 0,
					height: "100%",
					width: 380,
					background: "var(--surface)",
					borderLeft: "1px solid var(--border)",
					zIndex: 101,
					display: "flex",
					flexDirection: "column",
				}}
			>
				{/* Header */}
				<div
					style={{
						padding: "18px 20px",
						borderBottom: "1px solid var(--border)",
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
					}}
				>
					<h2
						style={{
							margin: 0,
							fontSize: 15,
							fontWeight: 600,
							color: "var(--text)",
						}}
					>
						Add Account
					</h2>
					<button type="button" onClick={onClose} style={iconBtn}>
						<X size={15} style={{ color: "var(--text-dim)" }} />
					</button>
				</div>

				{/* Fields */}
				<div
					style={{
						padding: 20,
						display: "flex",
						flexDirection: "column",
						gap: 16,
						flex: 1,
						overflowY: "auto",
					}}
				>
					<Field label="Name">
						<input
							autoFocus
							value={name}
							onChange={(e) => setName(e.target.value)}
							onKeyDown={(e) => e.key === "Enter" && handleSave()}
							placeholder="e.g. TD TFSA"
							style={panelInputStyle}
						/>
					</Field>

					<Field label="Type">
						<select
							value={type}
							onChange={(e) => setType(e.target.value as AccountType)}
							style={panelInputStyle}
						>
							<option value="TFSA">TFSA</option>
							<option value="RRSP">RRSP</option>
							<option value="RRIF">RRIF</option>
							<option value="REGULAR_SAVINGS">Regular Savings</option>
							<option value="CHEQUING">Chequing</option>
						</select>
					</Field>

					<Field label="Owner">
						<select
							value={ownerId}
							onChange={(e) => setOwnerId(Number(e.target.value))}
							style={panelInputStyle}
						>
							{people.map((p) => (
								<option key={p.id} value={p.id}>
									{p.name}
								</option>
							))}
						</select>
					</Field>

					<Field label="Initial Balance (optional)">
						<input
							type="number"
							value={balance}
							onChange={(e) => setBalance(e.target.value)}
							placeholder="0"
							className="num"
							style={panelInputStyle}
						/>
					</Field>

					<Field label="As of Date">
						<input
							type="date"
							value={date}
							onChange={(e) => setDate(e.target.value)}
							style={panelInputStyle}
						/>
					</Field>
				</div>

				{/* Footer */}
				<div
					style={{
						padding: "14px 20px",
						borderTop: "1px solid var(--border)",
						display: "flex",
						gap: 8,
						justifyContent: "flex-end",
					}}
				>
					<button type="button" onClick={onClose} style={panelCancelBtn}>
						Cancel
					</button>
					<button
						type="button"
						onClick={handleSave}
						disabled={!canSave}
						style={panelSaveBtn(canSave)}
					>
						{saving ? "Saving…" : "Save Account"}
					</button>
				</div>
			</div>
		</>
	);
}

// ─── Main Page ────────────────────────────────────────────────────────────────

function InvestmentsPage() {
	const router = useRouter();
	const { accounts, people } = Route.useLoaderData();
	const [expandedId, setExpandedId] = useState<number | null>(null);
	const [details, setDetails] = useState<Record<number, DetailState>>({});
	const [hoveredRowId, setHoveredRowId] = useState<number | null>(null);
	const [panelOpen, setPanelOpen] = useState(false);

	const toggleExpand = async (id: number) => {
		if (expandedId === id) {
			setExpandedId(null);
			return;
		}
		setExpandedId(id);
		if (!details[id]) {
			setDetails((prev) => ({
				...prev,
				[id]: { snapshots: [], returns: [], loading: true },
			}));
			const [snaps, rets] = await Promise.all([
				getSnapshots({ data: { accountId: id } }),
				getReturns({ data: { accountId: id } }),
			]);
			setDetails((prev) => ({
				...prev,
				[id]: { snapshots: snaps, returns: rets, loading: false },
			}));
		}
	};

	const refreshDetail = async (id: number) => {
		const [snaps, rets] = await Promise.all([
			getSnapshots({ data: { accountId: id } }),
			getReturns({ data: { accountId: id } }),
		]);
		setDetails((prev) => ({
			...prev,
			[id]: { snapshots: snaps, returns: rets, loading: false },
		}));
	};

	const handleDeleteAccount = async (id: number) => {
		await deleteAccount({ data: { id } });
		if (expandedId === id) setExpandedId(null);
		router.invalidate();
	};

	const handleDeleteSnapshot = async (snapId: number, accountId: number) => {
		await deleteSnapshot({ data: { id: snapId } });
		refreshDetail(accountId);
		router.invalidate();
	};

	const handleDeleteReturn = async (retId: number, accountId: number) => {
		await deleteReturn({ data: { id: retId } });
		refreshDetail(accountId);
		router.invalidate();
	};

	const showToc = accounts.length > 4;

	return (
		<>
			<div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
				{/* Main content */}
				<div
					style={{
						flex: 1,
						minWidth: 0,
						display: "flex",
						flexDirection: "column",
						gap: 20,
					}}
				>
					{/* Header */}
					<div
						style={{
							display: "flex",
							alignItems: "center",
							justifyContent: "space-between",
						}}
					>
						<div style={{ display: "flex", alignItems: "center", gap: 10 }}>
							<div
								style={{
									width: 4,
									height: 20,
									borderRadius: 2,
									backgroundColor: ACCENT_HEX,
								}}
							/>
							<h1
								style={{
									margin: 0,
									fontSize: 18,
									fontWeight: 600,
									color: "var(--text)",
									letterSpacing: "-0.02em",
								}}
							>
								Investment Accounts
							</h1>
						</div>

						<button
							type="button"
							onClick={() => setPanelOpen(true)}
							style={{
								display: "flex",
								alignItems: "center",
								gap: 6,
								padding: "6px 14px",
								borderRadius: 6,
								background: `color-mix(in srgb, ${ACCENT_HEX} 12%, transparent)`,
								border: `1px solid color-mix(in srgb, ${ACCENT_HEX} 30%, transparent)`,
								color: ACCENT,
								fontSize: 12.5,
								fontWeight: 500,
								fontFamily: "inherit",
								cursor: "pointer",
							}}
						>
							<Plus size={13} />
							Add Account
						</button>
					</div>

					{/* Accounts table */}
					{accounts.length === 0 ? (
						<EmptyState />
					) : (
						<div
							style={{
								background: "var(--surface)",
								border: "1px solid var(--border)",
								borderRadius: 8,
								overflow: "hidden",
							}}
						>
							<table
								style={{
									width: "100%",
									borderCollapse: "collapse",
									fontSize: 13,
								}}
							>
								<thead>
									<tr style={{ borderBottom: "1px solid var(--border)" }}>
										<th style={thStyle("left")}>Account</th>
										<th style={thStyle("left")}>Type</th>
										<th style={thStyle("left")}>Owner</th>
										<th style={thStyle("right")}>Balance</th>
										<th style={thStyle("left")}>Updated</th>
										<th style={thStyle("right")}>Return</th>
										<th style={{ width: 36 }} />
									</tr>
								</thead>
								<tbody>
									{accounts.map((account) => {
										const isExpanded = expandedId === account.id;
										const snap = account.snapshots[0];
										const ret = account.returns[0];
										const detail = details[account.id] ?? {
											snapshots: [],
											returns: [],
											loading: true,
										};

										return (
											<Fragment key={account.id}>
												<tr
													id={`account-${account.id}`}
													onClick={() => toggleExpand(account.id)}
													onMouseEnter={() => setHoveredRowId(account.id)}
													onMouseLeave={() => setHoveredRowId(null)}
													style={{
														borderTop: "1px solid var(--border)",
														cursor: "pointer",
														background: isExpanded
															? `color-mix(in srgb, ${ACCENT_HEX} 6%, transparent)`
															: hoveredRowId === account.id
																? "var(--surface-raised)"
																: "transparent",
														transition: "background 0.1s",
													}}
												>
													{/* Name + chevron */}
													<td style={{ padding: "10px 12px" }}>
														<div
															style={{
																display: "flex",
																alignItems: "center",
																gap: 8,
															}}
														>
															<ChevronRight
																size={13}
																style={{
																	color: "var(--text-dim)",
																	transform: isExpanded
																		? "rotate(90deg)"
																		: "none",
																	transition: "transform 0.15s",
																	flexShrink: 0,
																}}
															/>
															<span
																style={{
																	color: "var(--text)",
																	fontWeight: 500,
																}}
															>
																{account.name}
															</span>
														</div>
													</td>

													{/* Type */}
													<td
														style={{
															padding: "10px 12px",
															color: "var(--text-muted)",
														}}
													>
														{TYPE_LABEL[account.type]}
													</td>

													{/* Owner */}
													<td style={{ padding: "10px 12px" }}>
														<OwnerBadge name={account.owner.name} />
													</td>

													{/* Balance */}
													<td
														style={{ padding: "10px 12px", textAlign: "right" }}
														className="num"
													>
														{snap ? (
															<span style={{ color: "var(--text)" }}>
																{fmtCAD(snap.balance)}
															</span>
														) : (
															<span style={{ color: "var(--text-dim)" }}>
																—
															</span>
														)}
													</td>

													{/* Last Updated */}
													<td
														style={{
															padding: "10px 12px",
															color: "var(--text-muted)",
														}}
													>
														{snap ? fmtDate(snap.date) : "—"}
													</td>

													{/* Return % */}
													<td
														style={{ padding: "10px 12px", textAlign: "right" }}
														className="num"
													>
														{ret && !NO_RETURNS.has(account.type) ? (
															<span
																style={{
																	color:
																		ret.returnPercent >= 0
																			? "#10b981"
																			: "#ef4444",
																}}
															>
																{fmtReturn(ret.returnPercent)}
															</span>
														) : (
															<span style={{ color: "var(--text-dim)" }}>
																—
															</span>
														)}
													</td>

													{/* Delete */}
													<td style={{ padding: "10px 8px" }}>
														{hoveredRowId === account.id && (
															<button
																type="button"
																onClick={(e) => {
																	e.stopPropagation();
																	handleDeleteAccount(account.id);
																}}
																style={iconBtn}
															>
																<Trash2
																	size={13}
																	style={{ color: "var(--text-dim)" }}
																/>
															</button>
														)}
													</td>
												</tr>

												{/* Accordion detail */}
												{isExpanded && (
													<AccountDetail
														account={account}
														detail={detail}
														onDeleteSnapshot={(snapId) =>
															handleDeleteSnapshot(snapId, account.id)
														}
														onDeleteReturn={(retId) =>
															handleDeleteReturn(retId, account.id)
														}
													/>
												)}
											</Fragment>
										);
									})}
								</tbody>
							</table>
						</div>
					)}
				</div>

				{/* Floating TOC */}
				{showToc && <FloatingToc accounts={accounts} />}
			</div>

			{/* Add Account Panel */}
			{panelOpen && (
				<AddAccountPanel
					people={people}
					onClose={() => setPanelOpen(false)}
					onSaved={() => {
						setPanelOpen(false);
						router.invalidate();
					}}
				/>
			)}
		</>
	);
}
