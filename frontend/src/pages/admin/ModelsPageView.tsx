// src/pages/admin/ModelsPageView.tsx

import Section from "../../components/ui/Section";

import ModelsPageViewTabs from "./ModelsPageViewTabs";
import ModelsPageViewActive from "./ModelsPageViewActive";
import ModelsPageViewUpload from "./ModelsPageViewUpload";
import ModelsPageViewList from "./ModelsPageViewList";
import ModelsPageViewVersion from "./ModelsPageViewVersion";

import type { ModelItem, ActiveModel } from "./types/modelTypes";

type Props = {
  tab: "active" | "upload" | "list" | "version";
  setTab: (v: "active" | "upload" | "list" | "version") => void;

  paginatedData: ModelItem[];
  models: ModelItem[];
  activeModel: ActiveModel | null;
  loading: boolean;

  search: string;
  handleSearch: (v: string) => void;

  uploadName: string;
  setUploadName: (v: string) => void;

  uploadFile: File | null;
  setUploadFile: (f: File | null) => void;

  uploadLoading: boolean;

  handleUpload: () => void;

  handleSetActive: (m: ModelItem) => void;

  handleRollback: () => void;

  canRollback: boolean;

  stats: {
    total: number;
    approved: number;
    pending: number;
    rejected: number;
  };

  currentPage: number;
  totalPages: number;
  setCurrentPage: (p: number) => void;
};

export default function ModelsPageView(props: Props) {

  const {
    tab,
    setTab,
    search,
    handleSearch,

    activeModel,
    loading,

    uploadName,
    setUploadName,
    uploadFile,
    setUploadFile,
    uploadLoading,

    paginatedData,
    models,

    stats,
    currentPage,
    totalPages,
    setCurrentPage,

    handleUpload,
    handleSetActive,
    handleRollback,

    canRollback
  } = props;


  return (

    <Section title="🧠 Manajemen Model AI Segmentasi Banjir">

      {/* =====================================================
          TAB NAVIGATION
      ===================================================== */}

      <ModelsPageViewTabs
        tab={tab}
        setTab={setTab}
        search={search}
        onSearch={handleSearch}
      />


      {/* =====================================================
          ACTIVE MODEL VIEW
          menampilkan model AI yang sedang digunakan
          untuk proses inferensi segmentasi banjir
      ===================================================== */}

      {tab === "active" && (

        <ModelsPageViewActive
          activeModel={activeModel}
          loading={loading}
        />

      )}


      {/* =====================================================
          MODEL UPLOAD VIEW
          upload model AI (.pth) hasil training
      ===================================================== */}

      {tab === "upload" && (

        <ModelsPageViewUpload
          uploadName={uploadName}
          setUploadName={setUploadName}
          uploadFile={uploadFile}
          setUploadFile={setUploadFile}
          uploadLoading={uploadLoading}
          handleUpload={handleUpload}
        />

      )}


      {/* =====================================================
          MODEL LIST VIEW
          daftar model yang sudah disetujui
      ===================================================== */}

      {tab === "list" && (

        <ModelsPageViewList
          paginatedData={paginatedData}
          stats={stats}
          loading={loading}
          currentPage={currentPage}
          totalPages={totalPages}
          setCurrentPage={setCurrentPage}
          handleSetActive={handleSetActive}
        />

      )}


      {/* =====================================================
          MODEL VERSION CONTROL
          rollback ke model sebelumnya
      ===================================================== */}

      {tab === "version" && (

        <ModelsPageViewVersion
          models={models}
          canRollback={canRollback}
          handleRollback={handleRollback}
        />

      )}

    </Section>

  );

}