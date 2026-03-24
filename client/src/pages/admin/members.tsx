import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Crown, Search, Phone, Star, Edit2, Trash2, ChevronRight, Gift, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/utils";
import type { Member } from "@shared/schema";

function formatDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

function MemberBadge({ member }: { member: Member }) {
  if (member.isVip) {
    return (
      <span style={{
        display: "inline-flex", alignItems: "center", gap: 3,
        padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 700,
        background: "linear-gradient(135deg, #FFAB00, #FF9500)", color: "#fff",
      }}>
        <Crown size={10} /> VIP
      </span>
    );
  }
  if (member.discountPercent > 0) {
    return (
      <span style={{
        padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 600,
        background: "rgba(255,149,0,0.1)", color: "#FF9500",
      }}>
        {member.discountPercent}% Diskon
      </span>
    );
  }
  return (
    <span style={{
      padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 500,
      background: "#F5F5F7", color: "#AEAEB2",
    }}>
      Regular
    </span>
  );
}

export default function MembersSection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Member | null>(null);
  const [form, setForm] = useState({ discountPercent: 0, isVip: false, notes: "", name: "" });

  const { data: members = [], isLoading } = useQuery<Member[]>({
    queryKey: ["/api/members"],
  });

  const updateMutation = useMutation({
    mutationFn: async ({ phone, data }: { phone: string; data: any }) => {
      const res = await apiRequest("PUT", `/api/members/${phone}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      toast({ title: "Data member diperbarui" });
      setEditing(null);
    },
    onError: () => toast({ title: "Gagal memperbarui member", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (phone: string) => {
      await apiRequest("DELETE", `/api/members/${phone}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      toast({ title: "Member dihapus" });
    },
    onError: () => toast({ title: "Gagal menghapus member", variant: "destructive" }),
  });

  const handleEdit = (member: Member) => {
    setEditing(member);
    setForm({
      discountPercent: member.discountPercent,
      isVip: member.isVip,
      notes: member.notes || "",
      name: member.name,
    });
  };

  const handleSave = () => {
    if (!editing) return;
    updateMutation.mutate({ phone: editing.phone, data: form });
  };

  const filtered = members.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.phone.includes(search)
  );

  const totalMembers = members.length;
  const vipMembers = members.filter(m => m.isVip).length;
  const discountMembers = members.filter(m => m.discountPercent > 0 && !m.isVip).length;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1D1D1F", marginBottom: 4 }}>Data Member</h2>
        <p style={{ fontSize: 14, color: "#6E6E73" }}>
          Nomor HP pelanggan otomatis terdaftar saat pesan. Kelola diskon & status VIP di sini.
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Total Member", value: totalMembers, icon: "👥", color: "#FF9500" },
          { label: "Member VIP", value: vipMembers, icon: "👑", color: "#FFAB00" },
          { label: "Ada Diskon", value: discountMembers, icon: "🎁", color: "#FF2D55" },
        ].map(stat => (
          <div key={stat.label} style={{
            background: "#fff", borderRadius: 16, padding: "14px 16px",
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid rgba(0,0,0,0.04)",
          }}>
            <p style={{ fontSize: 22, lineHeight: 1, marginBottom: 4 }}>{stat.icon}</p>
            <p style={{ fontSize: 22, fontWeight: 800, color: stat.color, lineHeight: 1 }}>{stat.value}</p>
            <p style={{ fontSize: 12, color: "#6E6E73", marginTop: 3 }}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        background: "#F5F5F7", borderRadius: 14, padding: "10px 14px",
        marginBottom: 16,
      }}>
        <Search size={16} style={{ color: "#AEAEB2", flexShrink: 0 }} />
        <input
          type="text"
          placeholder="Cari nama atau nomor HP..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ background: "none", border: "none", outline: "none", flex: 1, fontSize: 14, color: "#1D1D1F" }}
          data-testid="input-search-member"
        />
        {search && (
          <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer" }}>
            <X size={14} style={{ color: "#AEAEB2" }} />
          </button>
        )}
      </div>

      {/* Member List */}
      {isLoading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="animate-pulse" style={{ height: 76, borderRadius: 16, background: "#F5F5F7" }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <p style={{ fontSize: 40, marginBottom: 8 }}>📱</p>
          <p style={{ fontWeight: 600, color: "#1D1D1F", marginBottom: 4 }}>
            {search ? "Tidak ditemukan" : "Belum ada member"}
          </p>
          <p style={{ fontSize: 13, color: "#6E6E73" }}>
            {search ? "Coba kata kunci lain" : "Member akan terdaftar otomatis saat pelanggan pesan"}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map(member => (
            <div
              key={member.phone}
              style={{
                background: "#fff", borderRadius: 16, padding: "14px 16px",
                boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid rgba(0,0,0,0.04)",
                display: "flex", alignItems: "center", gap: 12,
              }}
              data-testid={`member-item-${member.phone}`}
            >
              {/* Avatar */}
              <div style={{
                width: 42, height: 42, borderRadius: "50%", flexShrink: 0,
                background: member.isVip
                  ? "linear-gradient(135deg, #FFAB00, #FF9500)"
                  : "linear-gradient(135deg, #F0F0F0, #E5E5EA)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {member.isVip
                  ? <Crown size={18} style={{ color: "#fff" }} />
                  : <span style={{ fontWeight: 700, fontSize: 16, color: "#6E6E73" }}>{member.name[0]?.toUpperCase()}</span>}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                  <span style={{ fontWeight: 600, fontSize: 14, color: "#1D1D1F" }}>{member.name}</span>
                  <MemberBadge member={member} />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 12, color: "#6E6E73", display: "flex", alignItems: "center", gap: 3 }}>
                    <Phone size={10} /> {member.phone}
                  </span>
                  <span style={{ fontSize: 12, color: "#AEAEB2" }}>
                    {member.totalOrders} pesanan · {formatCurrency(member.totalSpent)}
                  </span>
                </div>
                <p style={{ fontSize: 11, color: "#AEAEB2", marginTop: 1 }}>
                  Bergabung {formatDate(member.joinedAt as unknown as string)} · Terakhir {formatDate(member.lastOrderAt as unknown as string)}
                </p>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                <button
                  onClick={() => handleEdit(member)}
                  style={{
                    width: 34, height: 34, borderRadius: 10, border: "none", cursor: "pointer",
                    background: "rgba(255,149,0,0.08)", display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                  data-testid={`button-edit-member-${member.phone}`}
                >
                  <Edit2 size={14} style={{ color: "#FF9500" }} />
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Hapus member ${member.name}?`)) deleteMutation.mutate(member.phone);
                  }}
                  style={{
                    width: 34, height: 34, borderRadius: 10, border: "none", cursor: "pointer",
                    background: "rgba(255,59,48,0.07)", display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                  data-testid={`button-delete-member-${member.phone}`}
                >
                  <Trash2 size={14} style={{ color: "#FF3B30" }} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editing && (
        <div
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
          style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
          onClick={() => setEditing(null)}
        >
          <div
            className="w-full md:max-w-md rounded-t-3xl md:rounded-3xl overflow-hidden"
            style={{ background: "#fff" }}
            onClick={e => e.stopPropagation()}
          >
            {/* Handle */}
            <div style={{ display: "flex", justifyContent: "center", paddingTop: 12 }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: "#E5E5EA" }} />
            </div>

            <div style={{ padding: "16px 20px 32px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: "50%",
                  background: "linear-gradient(135deg, #FF9500, #FF2D55)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <span style={{ color: "#fff", fontWeight: 700, fontSize: 18 }}>{editing.name[0]?.toUpperCase()}</span>
                </div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 16, color: "#1D1D1F" }}>{editing.name}</p>
                  <p style={{ fontSize: 13, color: "#6E6E73" }}>{editing.phone}</p>
                </div>
              </div>

              {/* Name */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#6E6E73", display: "block", marginBottom: 6 }}>Nama</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  style={{
                    width: "100%", height: 44, padding: "0 14px",
                    background: "#F5F5F7", border: "none", borderRadius: 12,
                    fontSize: 14, outline: "none", boxSizing: "border-box",
                  }}
                  data-testid="input-member-name"
                />
              </div>

              {/* Discount */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#6E6E73", display: "block", marginBottom: 6 }}>
                  Diskon Member (%)
                </label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {[0, 5, 10, 15, 20].map(pct => (
                    <button
                      key={pct}
                      onClick={() => setForm(f => ({ ...f, discountPercent: pct }))}
                      style={{
                        padding: "7px 16px", borderRadius: 10, border: "none", cursor: "pointer",
                        fontSize: 13, fontWeight: 600,
                        background: form.discountPercent === pct ? "#FF9500" : "#F5F5F7",
                        color: form.discountPercent === pct ? "#fff" : "#1D1D1F",
                      }}
                    >
                      {pct === 0 ? "Tidak ada" : `${pct}%`}
                    </button>
                  ))}
                  <input
                    type="number"
                    min={0} max={100}
                    placeholder="Custom %"
                    value={form.discountPercent || ""}
                    onChange={e => setForm(f => ({ ...f, discountPercent: parseInt(e.target.value) || 0 }))}
                    style={{
                      width: 90, height: 36, padding: "0 10px",
                      background: "#F5F5F7", border: "none", borderRadius: 10,
                      fontSize: 13, outline: "none",
                    }}
                    data-testid="input-member-discount"
                  />
                </div>
              </div>

              {/* VIP Toggle */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, padding: "12px 14px", background: "#F5F5F7", borderRadius: 14 }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "#1D1D1F", marginBottom: 2 }}>Status VIP</p>
                  <p style={{ fontSize: 12, color: "#6E6E73" }}>Tampilkan lencana VIP khusus untuk member ini</p>
                </div>
                <button
                  onClick={() => setForm(f => ({ ...f, isVip: !f.isVip }))}
                  style={{
                    width: 48, height: 28, borderRadius: 14, border: "none", cursor: "pointer",
                    background: form.isVip ? "#FF9500" : "#E5E5EA", position: "relative", flexShrink: 0,
                    transition: "background 0.2s",
                  }}
                  data-testid="toggle-member-vip"
                >
                  <div style={{
                    position: "absolute", top: 3,
                    left: form.isVip ? "calc(100% - 25px)" : 3,
                    width: 22, height: 22, borderRadius: "50%",
                    background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
                    transition: "left 0.2s",
                  }} />
                </button>
              </div>

              {/* Notes */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#6E6E73", display: "block", marginBottom: 6 }}>Catatan Admin</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Misalnya: pelanggan setia, alergi kacang, dll."
                  rows={2}
                  style={{
                    width: "100%", padding: "10px 14px",
                    background: "#F5F5F7", border: "none", borderRadius: 12,
                    fontSize: 14, outline: "none", resize: "none", boxSizing: "border-box",
                  }}
                  data-testid="input-member-notes"
                />
              </div>

              {/* Buttons */}
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => setEditing(null)}
                  style={{
                    flex: 1, height: 48, borderRadius: 14, border: "none", cursor: "pointer",
                    background: "#F5F5F7", fontSize: 14, fontWeight: 600, color: "#1D1D1F",
                  }}
                >
                  Batal
                </button>
                <button
                  onClick={handleSave}
                  disabled={updateMutation.isPending}
                  style={{
                    flex: 2, height: 48, borderRadius: 14, border: "none", cursor: "pointer",
                    background: "#FF9500", fontSize: 14, fontWeight: 700, color: "#fff",
                    opacity: updateMutation.isPending ? 0.6 : 1,
                  }}
                  data-testid="button-save-member"
                >
                  {updateMutation.isPending ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
