import { createFileRoute, useRouter } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { Check, GripVertical, Plus, Settings, Trash2, X } from "lucide-react";
import { useState } from "react";
import { prisma } from "#/db";

// ─── Server functions ─────────────────────────────────────────────────────────

const getPeople = createServerFn({ method: "GET" }).handler(async () => {
  return await prisma.person.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] });
});

const createPerson = createServerFn({ method: "POST" })
  .inputValidator((data: { name: string }) => data)
  .handler(async ({ data }) => {
    const count = await prisma.person.count();
    return await prisma.person.create({ data: { name: data.name, sortOrder: count } });
  });

const updatePerson = createServerFn({ method: "POST" })
  .inputValidator((data: { id: number; name: string }) => data)
  .handler(async ({ data }) => {
    return await prisma.person.update({ where: { id: data.id }, data: { name: data.name } });
  });

const deletePerson = createServerFn({ method: "POST" })
  .inputValidator((data: { id: number }) => data)
  .handler(async ({ data }) => {
    return await prisma.person.delete({ where: { id: data.id } });
  });

// ─── Route ────────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
  loader: async () => await getPeople(),
});

// ─── Component ────────────────────────────────────────────────────────────────

const ACCENT = "#6e7681";

function SettingsPage() {
  const router = useRouter();
  const people = Route.useLoaderData();

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);

  const startEdit = (id: number, name: string) => {
    setEditingId(id);
    setEditValue(name);
  };

  const commitEdit = async () => {
    if (editingId === null) return;
    const trimmed = editValue.trim();
    if (trimmed) {
      await updatePerson({ data: { id: editingId, name: trimmed } });
      router.invalidate();
    }
    setEditingId(null);
  };

  const cancelEdit = () => setEditingId(null);

  const handleAdd = async () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    await createPerson({ data: { name: trimmed } });
    setNewName("");
    setAdding(false);
    router.invalidate();
  };

  const handleDelete = async (id: number) => {
    await deletePerson({ data: { id } });
    router.invalidate();
  };

  return (
    <div style={{ maxWidth: 600, display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 6,
            backgroundColor: `color-mix(in srgb, ${ACCENT} 15%, transparent)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
          <Settings size={15} style={{ color: ACCENT }} />
        </div>
        <h1
          style={{
            margin: 0,
            fontSize: 18,
            fontWeight: 600,
            color: "var(--text)",
            letterSpacing: "-0.02em",
          }}>
          Settings
        </h1>
      </div>

      {/* Household people section */}
      <section
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 8,
          overflow: "hidden",
        }}>
        <div
          style={{
            padding: "14px 18px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>Household Members</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>Names used for account ownership, income, and taxes across the app</div>
          </div>
          <button
            type="button"
            onClick={() => setAdding(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "5px 12px",
              borderRadius: 6,
              background: `color-mix(in srgb, ${ACCENT} 12%, transparent)`,
              border: `1px solid color-mix(in srgb, ${ACCENT} 30%, transparent)`,
              color: "var(--text-muted)",
              fontSize: 12,
              fontWeight: 500,
              fontFamily: "inherit",
              cursor: "pointer",
            }}>
            <Plus size={12} />
            Add person
          </button>
        </div>

        {/* People list */}
        {people.length === 0 && !adding ? (
          <div
            style={{
              padding: "24px 18px",
              fontSize: 12.5,
              color: "var(--text-dim)",
              fontStyle: "italic",
              textAlign: "center",
            }}>
            No people added yet. Add household members to get started.
          </div>
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {people.map((person, i) => (
              <li
                key={person.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 18px",
                  borderBottom: i < people.length - 1 || adding ? "1px solid var(--border)" : undefined,
                }}>
                <GripVertical size={13} style={{ color: "var(--text-dim)", flexShrink: 0 }} />

                {editingId === person.id ? (
                  <>
                    <input
                      autoFocus
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") commitEdit();
                        if (e.key === "Escape") cancelEdit();
                      }}
                      style={{
                        flex: 1,
                        background: "var(--surface-raised)",
                        border: "1px solid var(--border)",
                        borderRadius: 4,
                        padding: "4px 8px",
                        fontSize: 13,
                        color: "var(--text)",
                        fontFamily: "inherit",
                        outline: "none",
                      }}
                    />
                    <button type="button" onClick={commitEdit} style={iconBtn}>
                      <Check size={13} style={{ color: "#10b981" }} />
                    </button>
                    <button type="button" onClick={cancelEdit} style={iconBtn}>
                      <X size={13} style={{ color: "var(--text-dim)" }} />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => startEdit(person.id, person.name)}
                      style={{
                        flex: 1,
                        fontSize: 13,
                        color: "var(--text)",
                        cursor: "text",
                        background: "none",
                        border: "none",
                        padding: 0,
                        textAlign: "left",
                        fontFamily: "inherit",
                      }}>
                      {person.name}
                    </button>
                    <button type="button" onClick={() => handleDelete(person.id)} style={iconBtn}>
                      <Trash2 size={13} style={{ color: "var(--text-dim)" }} />
                    </button>
                  </>
                )}
              </li>
            ))}

            {/* Add new row */}
            {adding && (
              <li
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 18px",
                }}>
                <GripVertical size={13} style={{ color: "var(--text-dim)", flexShrink: 0 }} />
                <input
                  autoFocus
                  placeholder="Name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAdd();
                    if (e.key === "Escape") {
                      setAdding(false);
                      setNewName("");
                    }
                  }}
                  style={{
                    flex: 1,
                    background: "var(--surface-raised)",
                    border: "1px solid var(--border)",
                    borderRadius: 4,
                    padding: "4px 8px",
                    fontSize: 13,
                    color: "var(--text)",
                    fontFamily: "inherit",
                    outline: "none",
                  }}
                />
                <button type="button" onClick={handleAdd} style={iconBtn}>
                  <Check size={13} style={{ color: "#10b981" }} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAdding(false);
                    setNewName("");
                  }}
                  style={iconBtn}>
                  <X size={13} style={{ color: "var(--text-dim)" }} />
                </button>
              </li>
            )}
          </ul>
        )}
      </section>
    </div>
  );
}

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
