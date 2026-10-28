// src/pages/admin/ModelsPage.tsx

import { useEffect, useState } from "react";
import {
  listModels,
  uploadModel,
  rollbackModel,
  setActiveModel,
  getActiveModel,
  getRollbackStatus
} from "../../api/adminModels";

import { Toaster, toast } from "react-hot-toast";
import ModelsPageView from "./ModelsPageView";

import type { ModelItem, ActiveModel } from "./types/modelTypes";

export default function ModelsPage() {

  /* =====================================================
     TAB NAVIGATION
  ===================================================== */

  const [tab, setTab] = useState<"active" | "upload" | "list" | "version">("active");


  /* =====================================================
     DATA STATE
  ===================================================== */

  const [models, setModels] = useState<ModelItem[]>([]);
  const [filtered, setFiltered] = useState<ModelItem[]>([]);

  const [activeModel, setActiveModelState] = useState<ActiveModel | null>(null);


  /* =====================================================
     UI STATE
  ===================================================== */

  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [canRollback, setCanRollback] = useState(false);


  /* =====================================================
     MODEL STATISTICS
     digunakan untuk monitoring model AI segmentasi banjir
  ===================================================== */

  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0
  });


  /* =====================================================
     PAGINATION
  ===================================================== */

  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 5;


  /* =====================================================
     MODEL UPLOAD STATE
  ===================================================== */

  const [uploadName, setUploadName] = useState("");

  const [uploadFile, setUploadFile] = useState<File | null>(null);

  const [uploadLoading, setUploadLoading] = useState(false);



  /* =====================================================
     LOAD DATA
  ===================================================== */

  const loadData = async () => {

    try {

      setLoading(true);

      /*
        Jalankan API secara paralel
        agar dashboard model lebih cepat dimuat
      */

      const [
        modelRes,
        activeRes
      ] = await Promise.all([
        listModels(),
        getActiveModel()
      ]);


      /* ================= ROLLBACK STATUS ================= */

      let rollbackAvailable = false;

      try {

        const rollbackRes = await getRollbackStatus();

        rollbackAvailable = rollbackRes.available;

      } catch {

        rollbackAvailable = false;

      }


      setModels(modelRes);

      setActiveModelState(activeRes);

      setCanRollback(rollbackAvailable);


      /* ================= MODEL STATISTICS ================= */

      setStats({

        total: modelRes.length,

        approved: modelRes.filter(
          (m) => m.review_status === "approved"
        ).length,

        pending: modelRes.filter(
          (m) => m.review_status === "pending"
        ).length,

        rejected: modelRes.filter(
          (m) => m.review_status === "rejected"
        ).length

      });


      applySearchFilter(search, modelRes);

    } catch (err) {

      console.error("Load models failed:", err);

      toast.error("Gagal memuat data model");

    } finally {

      setLoading(false);

    }

  };


  /* =====================================================
     INITIAL LOAD
  ===================================================== */

  useEffect(() => {

    loadData();

  }, []);



  /* =====================================================
     SEARCH FILTER
     hanya model APPROVED yang boleh dipakai
     untuk inference
  ===================================================== */

  const applySearchFilter = (
    text: string,
    source: ModelItem[] = models
  ) => {

    const q = text.toLowerCase();

    const approved = source.filter(
      (m) => m.review_status === "approved"
    );

    const result = approved.filter((m) =>
      `${m.name} ${m.version}`.toLowerCase().includes(q)
    );

    setFiltered(result);

    setCurrentPage(1);

  };


  const handleSearch = (text: string) => {

    setSearch(text);

    applySearchFilter(text);

  };



  /* =====================================================
     PAGINATION
  ===================================================== */

  const totalPages = Math.ceil(
    filtered.length / itemsPerPage
  );

  const paginatedData = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );



  /* =====================================================
     UPLOAD MODEL
     digunakan untuk upload model AI (.pth)
     hasil training segmentasi banjir
  ===================================================== */

  const handleUpload = async () => {

    if (!uploadName || !uploadFile) {

      alert("Isi nama dan pilih file model (.pth)");

      return;

    }

    try {

      setUploadLoading(true);

      await uploadModel(uploadName, uploadFile);

      setUploadName("");

      setUploadFile(null);

      await loadData();

      setTab("list");

    } catch (err: any) {

      toast(err?.response?.data?.detail || "Upload gagal");

    } finally {

      setUploadLoading(false);

    }

  };



  /* =====================================================
     SET ACTIVE MODEL
  ===================================================== */

  const handleSetActive = async (model: ModelItem) => {

    if (model.is_active) return;

    if (!confirm(`Aktifkan model "${model.name}"?`)) return;

    try {

      await setActiveModel(model.id);

      await loadData();

      toast.success("Model berhasil diaktifkan");

    } catch (err) {

      console.error("Set active failed:", err);

      toast.error("Gagal mengaktifkan model");

    }

  };



  /* =====================================================
     ROLLBACK MODEL
  ===================================================== */

  const handleRollback = async () => {

    if (!canRollback) return;

    if (!confirm("Rollback ke model sebelumnya?")) return;

    try {

      await rollbackModel();

      await loadData();

      setTab("active");

      toast.success("Rollback model berhasil");

    } catch (err: any) {

      toast(err?.response?.data?.detail || "Rollback gagal");

    }

  };



  /* =====================================================
     RENDER
  ===================================================== */

  return (

    <>
      <Toaster position="top-right" />

      <ModelsPageView

        tab={tab}

        setTab={setTab}

        paginatedData={paginatedData}

        models={models}

        activeModel={activeModel}

        loading={loading}

        search={search}

        handleSearch={handleSearch}

        uploadName={uploadName}

        setUploadName={setUploadName}

        uploadFile={uploadFile}

        setUploadFile={setUploadFile}

        uploadLoading={uploadLoading}

        handleUpload={handleUpload}

        handleSetActive={handleSetActive}

        handleRollback={handleRollback}

        canRollback={canRollback}

        stats={stats}

        currentPage={currentPage}

        totalPages={totalPages}

        setCurrentPage={setCurrentPage}

      />

    </>

  );

}