// src/pages/admin/AdminUsersPage.tsx

import { useEffect, useRef, useState } from "react";
import { adminUsersApi } from "../../api/adminUsers";
import AdminUsersPageView from "./AdminUsersPageView";
import { useDebounce } from "../../hooks/useDebounce";

import type { AdminUser, Role, UserStats } from "./types/userTypes";

export default function AdminUsersPage() {

  /* =========================================================
     STATE UTAMA
  ========================================================= */

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);


  /* =========================================================
     SEARCH USER
     digunakan untuk mencari pengguna kontributor sistem
  ========================================================= */

  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 400);


  /* =========================================================
     FILTER ROLE USER
     admin        → administrator sistem
     registered   → kontributor dataset banjir
     public       → pengguna publik
  ========================================================= */

  const [roleFilter, setRoleFilter] = useState<Role | "all">("all");


  /* =========================================================
     PAGINATION
  ========================================================= */

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;


  /* =========================================================
     STATISTIK PENGGUNA
     digunakan pada dashboard admin
  ========================================================= */

  const [stats, setStats] = useState<UserStats>({
    total: 0,
    admin: 0,
    registered: 0,
    public: 0
  });


  /* =========================================================
     ABORT CONTROLLER
     untuk menghentikan request sebelumnya jika user
     melakukan search baru
  ========================================================= */

  const controllerRef = useRef<AbortController | null>(null);


  /* =========================================================
     INITIAL LOAD
  ========================================================= */

  useEffect(() => {

    fetchUsers();

    return () => {

      if (controllerRef.current) {
        controllerRef.current.abort();
      }

    };

  }, []);


  /* =========================================================
     SEARCH EFFECT
  ========================================================= */

  useEffect(() => {

    fetchUsers(debouncedSearch);

  }, [debouncedSearch, roleFilter]);


  /* =========================================================
     FETCH USERS
  ========================================================= */

  async function fetchUsers(search?: string) {

    if (controllerRef.current) {
      controllerRef.current.abort();
    }

    const controller = new AbortController();
    controllerRef.current = controller;

    try {

      setLoading(true);

      const res = await adminUsersApi.list(search, controller.signal);

      const data: AdminUser[] = res.data;

      /* =========================================================
         FILTER SEARCH DI FRONTEND
      ========================================================= */

      const searched = search
        ? data.filter((u) =>
            `${u.username} ${u.email} ${u.role}`
              .toLowerCase()
              .includes(search.toLowerCase())
          )
        : data;


      /* =========================================================
         FILTER ROLE
      ========================================================= */

      const filtered =
        roleFilter === "all"
          ? searched
          : searched.filter((u) => u.role === roleFilter);


      setUsers(filtered);

      setCurrentPage(1);


      /* =========================================================
         HITUNG STATISTIK USER
      ========================================================= */

      setStats({

        total: filtered.length,

        admin: filtered.filter((u) => u.role === "admin").length,

        registered: filtered.filter((u) => u.role === "registered").length,

        public: filtered.filter((u) => u.role === "public").length

      });

    } catch (err: any) {

      if (err.name === "CanceledError") return;

      console.error("Fetch users error:", err);

    } finally {

      setLoading(false);

    }

  }


  /* =========================================================
     EDIT USER
  ========================================================= */

  async function saveEdit() {

    if (!editing) return;

    await adminUsersApi.update(editing.id, editing);

    setEditing(null);

    fetchUsers(debouncedSearch);

  }


  /* =========================================================
     DELETE USER
     admin tidak boleh dihapus
  ========================================================= */

  async function deleteUser(id: number, role: Role) {

    if (role === "admin") return;

    if (!confirm("Hapus user ini?")) return;

    await adminUsersApi.delete(id);

    fetchUsers(debouncedSearch);

  }


  /* =========================================================
     VERIFY USER
     digunakan untuk menyetujui kontributor dataset
  ========================================================= */

  async function verifyUser(id: number) {

    await adminUsersApi.verify(id);

    fetchUsers(debouncedSearch);

  }


  /* =========================================================
     PAGINATION
  ========================================================= */

  const totalPages = Math.ceil(users.length / itemsPerPage);


  const paginatedData = users.slice(

    (currentPage - 1) * itemsPerPage,

    currentPage * itemsPerPage

  );


  function goToPage(page: number) {

    if (page < 1 || page > totalPages) return;

    setCurrentPage(page);

  }


  /* =========================================================
     RENDER VIEW
  ========================================================= */

  return (

    <AdminUsersPageView

      paginatedData={paginatedData}

      editing={editing}

      setEditing={setEditing}

      loading={loading}

      searchInput={searchInput}

      setSearchInput={setSearchInput}

      roleFilter={roleFilter}

      setRoleFilter={setRoleFilter}

      stats={stats}

      currentPage={currentPage}

      totalPages={totalPages}

      saveEdit={saveEdit}

      deleteUser={deleteUser}

      verifyUser={verifyUser}

      goToPage={goToPage}

    />

  );

}