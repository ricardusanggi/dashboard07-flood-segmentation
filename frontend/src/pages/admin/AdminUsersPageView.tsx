// src/pages/admin/AdminUsersPageView.tsx

import Section from "../../components/ui/Section";
import Card from "../../components/ui/Card";
import Table from "../../components/ui/Table";
import { TableHead } from "../../components/ui/TableHead";
import { Tr } from "../../components/ui/TableRow";
import { Th, Td } from "../../components/ui/TableCell";
import { Pencil, Trash2, ShieldCheck, Search } from "lucide-react";

import type { AdminUser, Role, UserStats } from "./types/userTypes";

type Props = {
  paginatedData: AdminUser[];
  editing: AdminUser | null;
  setEditing: React.Dispatch<React.SetStateAction<AdminUser | null>>;
  loading: boolean;

  searchInput: string;
  setSearchInput: React.Dispatch<React.SetStateAction<string>>;

  roleFilter: Role | "all";
  setRoleFilter: React.Dispatch<React.SetStateAction<Role | "all">>;

  stats: UserStats;
  currentPage: number;
  totalPages: number;

  saveEdit: () => Promise<void>;
  deleteUser: (id: number, role: Role) => Promise<void>;
  verifyUser: (id: number) => Promise<void>;
  goToPage: (page: number) => void;
};

const ROLE_STYLE: Record<Role, string> = {
  admin: "bg-red-100 text-red-700 border-red-300",
  registered: "bg-cyan-100 text-cyan-700 border-cyan-300",
  public: "bg-green-100 text-green-700 border-green-300"
};

export default function AdminUsersPageView({
  paginatedData,
  editing,
  setEditing,
  loading,
  searchInput,
  setSearchInput,
  roleFilter,
  setRoleFilter,
  stats,
  currentPage,
  totalPages,
  saveEdit,
  deleteUser,
  verifyUser,
  goToPage
}: Props) {
  return (
    
    <Section title="👥 Manajemen Pengguna & Kontributor Dataset Banjir">

      {/* ================= STATISTIK ================= */}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">

        <StatCard title="Total Pengguna" value={stats.total} color="blue" />

        <StatCard title="Administrator Sistem" value={stats.admin} color="red" />

        <StatCard title="Kontributor Dataset" value={stats.registered} color="cyan" />

        <StatCard title="Menunggu Verifikasi" value={stats.public} color="green" />

      </div>


      {/* ================= CONTROL BAR ================= */}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">

        <div>

          <h3 className="text-lg font-semibold tracking-tight">

            Daftar Pengguna Sistem

          </h3>

          <p className="text-sm text-gray-500">

            Menampilkan {paginatedData.length} pengguna aktif

          </p>

        </div>


        <div className="flex items-center gap-3">

          {/* SEARCH */}

          <div className="relative">

            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              placeholder="Cari pengguna atau kontributor..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="
                pl-9 pr-4 py-2 rounded-full text-sm
                bg-gray-100 dark:bg-gray-800
                border border-gray-200 dark:border-gray-700
                focus:ring-2 focus:ring-cyan-500
                outline-none transition
              "
            />

          </div>


          {/* ROLE FILTER */}

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as Role | "all")}
            className="
              px-4 py-2 rounded-full text-sm
              bg-gray-100 dark:bg-gray-800
              border border-gray-200 dark:border-gray-700
              focus:ring-2 focus:ring-cyan-500
              outline-none transition
            "
          >

            <option value="all">Semua Role</option>

            <option value="admin">Admin Sistem</option>

            <option value="registered">Kontributor Dataset</option>

            <option value="public">Belum Diverifikasi</option>

          </select>

        </div>

      </div>


      {/* ================= TABLE ================= */}

      <Card className="p-6">

        {loading ? (

          <p className="text-center text-gray-500">Loading...</p>

        ) : paginatedData.length === 0 ? (

          <div className="text-center py-10 text-gray-400">
            Tidak ada data pengguna ditemukan
          </div>

        ) : (

          <>
            <Table className="text-sm">

              <TableHead>

                <Tr>

                  <Th className="w-[70px] text-xs font-semibold uppercase tracking-wide">
                    ID
                  </Th>

                  <Th className="w-[180px] text-xs font-semibold uppercase tracking-wide">
                    Username
                  </Th>

                  <Th className="text-xs font-semibold uppercase tracking-wide">
                    Email
                  </Th>

                  <Th className="text-xs font-semibold uppercase tracking-wide">
                    Nama
                  </Th>
                  
                  <Th className="text-xs font-semibold uppercase tracking-wide">
                      Bergabung
                  </Th>

                  <Th className="w-[130px] text-xs font-semibold uppercase tracking-wide">
                    Role
                  </Th>

                  <Th className="w-[140px] text-xs font-semibold uppercase tracking-wide text-center">
                    Aksi
                  </Th>

                </Tr>

              </TableHead>


              <tbody>

                {paginatedData.map((u) => (

                  <Tr
                    key={u.id}
                    className="hover:bg-gray-50 dark:hover:bg-slate-800 transition"
                  >

                    <Td className="font-medium text-gray-700 dark:text-gray-200 tabular-nums w-[70px]">
                      {u.id}
                    </Td>

                    <Td className="font-medium w-[180px] truncate">
                      {u.username}
                    </Td>

                    <Td className="max-w-[260px] truncate text-gray-700 dark:text-gray-300">
                      {u.email}
                    </Td>

                    <Td className="max-w-[220px] truncate">
                      {u.full_name || "-"}
                    </Td>

                    <Td className="text-gray-600 dark:text-gray-300 whitespace-nowrap">
                      {formatDate(u.created_at)}
                    </Td>
                    
                    <Td>

                      <span
                        className={`px-3 py-1 rounded-full border text-xs font-semibold tracking-wide whitespace-nowrap ${ROLE_STYLE[u.role]}`}
                      >

                        {u.role.toUpperCase()}

                      </span>

                    </Td>


                    <Td className="text-center w-[140px]">

                      <div className="flex gap-2 justify-center">

                        {/* VERIFY */}

                        <button
                          disabled={u.role !== "public"}
                          onClick={() => verifyUser(u.id)}
                          className={`
                            p-2 rounded-lg transition
                            ${
                              u.role === "public"
                                ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                                : "bg-gray-200 text-gray-400 cursor-not-allowed"
                            }
                          `}
                          title="Verifikasi Kontributor"
                        >
                          <ShieldCheck size={16} />
                        </button>


                        {/* EDIT */}

                        <button
                          disabled={u.role === "admin"}
                          onClick={() => setEditing({ ...u })}
                          className={`
                            p-2 rounded-lg transition
                            ${
                              u.role !== "admin"
                                ? "bg-cyan-100 text-cyan-700 hover:bg-cyan-200"
                                : "bg-gray-200 text-gray-400 cursor-not-allowed"
                            }
                          `}
                          title="Edit Pengguna"
                        >
                          <Pencil size={16} />
                        </button>


                        {/* DELETE */}

                        <button
                          disabled={u.role === "admin"}
                          onClick={() => deleteUser(u.id, u.role)}
                          className={`
                            p-2 rounded-lg transition
                            ${
                              u.role !== "admin"
                                ? "bg-red-100 text-red-700 hover:bg-red-200"
                                : "bg-gray-200 text-gray-400 cursor-not-allowed"
                            }
                          `}
                          title="Hapus Pengguna"
                        >
                          <Trash2 size={16} />
                        </button>

                      </div>

                    </Td>

                  </Tr>

                ))}

              </tbody>

            </Table>


            {/* ================= PAGINATION ================= */}

            {totalPages > 1 && (

              <div className="flex justify-between items-center mt-6">

                <div className="text-sm text-gray-500">
                  Halaman {currentPage} dari {totalPages}
                </div>

                <div className="flex gap-2">

                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm border rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40"
                  >
                    ←
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => {

                    const page = i + 1;

                    return (

                      <button
                        key={page}
                        onClick={() => goToPage(page)}
                        className={`px-3 py-1 text-sm rounded ${
                          currentPage === page
                            ? "bg-cyan-600 text-white"
                            : "border hover:bg-gray-100 dark:hover:bg-gray-700"
                        }`}
                      >
                        {page}
                      </button>

                    );

                  })}

                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-sm border rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40"
                  >
                    →
                  </button>

                </div>

              </div>

            )}

          </>

        )}

      </Card>


      {/* ================= MODAL ================= */}

      {editing && (

        <div className="fixed inset-0 bg-black/30 flex items-center justify-center">

          <Card className="p-6 w-[380px]">

            <h3 className="font-semibold text-lg mb-4">
              Edit Pengguna
            </h3>

            <input
              value={editing.username}
              onChange={(e) => setEditing({ ...editing, username: e.target.value })}
              className="w-full border p-2 mb-3 rounded"
            />

            <div className="flex justify-end gap-3">

              <button onClick={() => setEditing(null)}>
                Cancel
              </button>

              <button
                onClick={saveEdit}
                className="px-4 py-2 bg-cyan-600 text-white rounded"
              >
                Simpan
              </button>

            </div>

          </Card>

        </div>

      )}

    </Section>
  );

}


/* ================= STAT CARD ================= */

function StatCard({
  title,
  value,
  color
}: {
  title: string;
  value: number;
  color: "blue" | "red" | "cyan" | "green";
}) {

  const colors = {

    blue: "bg-blue-50 text-blue-700",

    red: "bg-red-50 text-red-700",

    cyan: "bg-cyan-50 text-cyan-700",

    green: "bg-green-50 text-green-700"

  };

  return (

    <div className={`p-4 rounded-xl shadow-sm ${colors[color]}`}>

      <div className="text-xs font-medium opacity-80">
        {title}
      </div>

      <div className="text-2xl font-semibold tabular-nums">
        {value}
      </div>

    </div>

  );

}


/* ================= DATE FORMAT ================= */

function formatDate(date?: string) {

  if (!date) return "-";

  try {

    return new Date(date).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });

  } catch {

    return "-";

  }

}