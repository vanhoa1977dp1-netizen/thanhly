import React, { useState, useRef } from "react";
import {
  Settings,
  CreditCard,
  Plus,
  Award,
  Save,
  Check,
  Building,
  Info,
  Edit,
  Trash2,
  Database,
  Download,
  Upload,
  RefreshCw,
  Globe,
  Mail,
  Phone,
  MapPin,
  Sparkles,
  ShieldAlert,
  HelpCircle,
  FileJson,
  CheckCircle2,
  X,
  CreditCard as CardIcon
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { DatabaseSchema, BankAccount } from "../types";

interface AdminProps {
  data: DatabaseSchema;
  onRefreshData: () => void;
}

export default function Admin({ data, onRefreshData }: AdminProps) {
  // 1. Shop Profile States
  const [shopProfile, setShopProfile] = useState({
    ten_shop: data.Thong_tin_shop.ten_shop || "",
    dia_chi: data.Thong_tin_shop.dia_chi || "",
    dien_thoai: data.Thong_tin_shop.dien_thoai || "",
    email: data.Thong_tin_shop.email || "",
    website: data.Thong_tin_shop.website || "",
    slogan: data.Thong_tin_shop.slogan || ""
  });
  const [shopSaveSuccess, setShopSaveSuccess] = useState(false);
  const [shopError, setShopError] = useState("");

  // Sync shop profile if database data changes
  React.useEffect(() => {
    setShopProfile({
      ten_shop: data.Thong_tin_shop.ten_shop || "",
      dia_chi: data.Thong_tin_shop.dia_chi || "",
      dien_thoai: data.Thong_tin_shop.dien_thoai || "",
      email: data.Thong_tin_shop.email || "",
      website: data.Thong_tin_shop.website || "",
      slogan: data.Thong_tin_shop.slogan || ""
    });
  }, [data.Thong_tin_shop]);

  // 2. Bank Account States
  const [showAddBankForm, setShowAddBankForm] = useState(false);
  const [editingBankId, setEditingBankId] = useState<string | null>(null);
  const [newBank, setNewBank] = useState({
    ten_ngan_hang: "",
    so_tai_khoan: "",
    chu_tai_khoan: "",
    chi_nhanh: ""
  });
  const [bankSaveSuccess, setBankSaveSuccess] = useState(false);
  const [bankError, setBankError] = useState("");
  const [bankToDelete, setBankToDelete] = useState<string | null>(null);

  // 3. Member Point Configuration States
  const [doanhThuDoiDiem, setDoanhThuDoiDiem] = useState<number>(
    data.Thong_tin_shop.doanh_thu_doi_diem || 50000
  );
  const [giaTri1Diem, setGiaTri1Diem] = useState<number>(
    data.Thong_tin_shop.gia_tri_1_diem || 1000
  );
  const [pointsSuccess, setPointsSuccess] = useState(false);

  // 4. Backup & Restore states
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [backupSuccess, setBackupSuccess] = useState(false);
  const [restoreSuccessMsg, setRestoreSuccessMsg] = useState("");
  const [restoreError, setRestoreError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [pendingRestoreFile, setPendingRestoreFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync point configs if database data changes
  React.useEffect(() => {
    setDoanhThuDoiDiem(data.Thong_tin_shop.doanh_thu_doi_diem || 50000);
    setGiaTri1Diem(data.Thong_tin_shop.gia_tri_1_diem || 500);
  }, [data.Thong_tin_shop]);

  // Handlers
  const handleSaveShopProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setShopError("");
    try {
      const res = await fetch("/api/settings/shop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(shopProfile)
      });
      const result = await res.json();
      if (result.success) {
        setShopSaveSuccess(true);
        setTimeout(() => setShopSaveSuccess(false), 3000);
        onRefreshData();
      } else {
        setShopError("Không thể cập nhật hồ sơ cửa hàng.");
      }
    } catch (err) {
      console.error(err);
      setShopError("Lỗi kết nối máy chủ khi lưu hồ sơ.");
    }
  };

  const handleAddBankAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setBankError("");
    if (!newBank.ten_ngan_hang.trim() || !newBank.so_tai_khoan.trim() || !newBank.chu_tai_khoan.trim()) {
      setBankError("Vui lòng điền đầy đủ Tên ngân hàng, Số tài khoản và Chủ tài khoản!");
      return;
    }
    try {
      const payload = editingBankId ? { ...newBank, id: editingBankId } : newBank;
      const res = await fetch("/api/settings/bank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      if (result.success) {
        setBankSaveSuccess(true);
        setNewBank({
          ten_ngan_hang: "",
          so_tai_khoan: "",
          chu_tai_khoan: "",
          chi_nhanh: ""
        });
        setEditingBankId(null);
        setShowAddBankForm(false);
        setTimeout(() => setBankSaveSuccess(false), 3000);
        onRefreshData();
      } else {
        setBankError("Lưu tài khoản ngân hàng thất bại.");
      }
    } catch (err) {
      console.error(err);
      setBankError("Lỗi kết nối khi thêm tài khoản ngân hàng.");
    }
  };

  const handleDeleteBank = async (bankId: string) => {
    try {
      const res = await fetch(`/api/settings/bank/${bankId}`, {
        method: "DELETE"
      });
      const result = await res.json();
      if (result.success) {
        onRefreshData();
      } else {
        setBankError("Xóa tài khoản ngân hàng thất bại.");
      }
    } catch (err) {
      console.error(err);
      setBankError("Lỗi kết nối khi xóa tài khoản ngân hàng.");
    } finally {
      setBankToDelete(null);
    }
  };

  const handleSavePointsConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/settings/shop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doanh_thu_doi_diem: Number(doanhThuDoiDiem) || 50000,
          gia_tri_1_diem: Number(giaTri1Diem) || 500
        })
      });
      const result = await res.json();
      if (result.success) {
        setPointsSuccess(true);
        setTimeout(() => setPointsSuccess(false), 3000);
        onRefreshData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleResetPointsConfig = () => {
    setDoanhThuDoiDiem(data.Thong_tin_shop.doanh_thu_doi_diem || 50000);
    setGiaTri1Diem(data.Thong_tin_shop.gia_tri_1_diem || 500);
  };

  // Backup handlers
  const handleExportBackup = async () => {
    setIsExporting(true);
    setBackupSuccess(false);
    try {
      const res = await fetch("/api/backup");
      if (!res.ok) throw new Error("Yêu cầu sao lưu thất bại.");
      const json = await res.json();
      
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(json, null, 2));
      const downloadAnchor = document.createElement("a");
      const dateStr = new Date().toISOString().replace(/[:.]/g, "-");
      
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `backup_pos_data_${dateStr}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      
      setBackupSuccess(true);
      setTimeout(() => setBackupSuccess(false), 4000);
    } catch (err) {
      console.error(err);
      alert("Lỗi khi tải file sao lưu dữ liệu.");
    } finally {
      setIsExporting(false);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processBackupFile(file);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processBackupFile(file);
    }
  };

  const processBackupFile = async (file: File) => {
    if (file.type !== "application/json" && !file.name.endsWith(".json")) {
      setRestoreError("File được chọn không đúng định dạng JSON!");
      setRestoreSuccessMsg("");
      return;
    }
    setPendingRestoreFile(file);
  };

  const executeRestore = async (file: File) => {
    setIsImporting(true);
    setRestoreError("");
    setRestoreSuccessMsg("");

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const jsonContent = JSON.parse(event.target?.result as string);
        if (!jsonContent.files || typeof jsonContent.files !== "object") {
          throw new Error("Cấu trúc file sao lưu không hợp lệ! Thiếu phần dữ liệu 'files'.");
        }

        const res = await fetch("/api/restore", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(jsonContent)
        });
        const result = await res.json();

        if (result.success) {
          setRestoreSuccessMsg("Chúc mừng! Toàn bộ cơ sở dữ liệu đã được khôi phục thành công.");
          onRefreshData();
          if (fileInputRef.current) fileInputRef.current.value = "";
        } else {
          setRestoreError(result.message || "Không thể khôi phục dữ liệu từ máy chủ.");
        }
      } catch (err: any) {
        console.error(err);
        setRestoreError(err.message || "Lỗi đọc file JSON hoặc phân tích cú pháp dữ liệu.");
      } finally {
        setIsImporting(false);
        setPendingRestoreFile(null);
      }
    };
    reader.readAsText(file);
  };

  const getBankGradient = (index: number) => {
    const gradients = [
      "from-slate-900 via-slate-800 to-indigo-950 text-white border-slate-700/50",
      "from-blue-600 via-indigo-600 to-blue-800 text-white border-blue-500/50",
      "from-teal-600 via-emerald-600 to-teal-800 text-white border-teal-500/50",
      "from-violet-700 via-purple-600 to-indigo-800 text-white border-purple-500/50"
    ];
    return gradients[index % gradients.length];
  };

  const formatBankNumber = (num: string) => {
    // Monospace spaced view
    return num.replace(/\s?/g, "").replace(/(\d{4})/g, "$1 ").trim();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-7xl mx-auto pb-12">
      
      {/* 1. HERO BRANDING & METRIC HEADER */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 md:p-8 text-white shadow-xl border border-slate-800">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-[11px] font-bold tracking-wider uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Data Synchronization
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight font-sans text-white">
              Cửa Hàng &amp; Quản Trị Hệ Thống
            </h1>
            <p className="text-slate-300 text-xs md:text-sm max-w-2xl font-medium leading-relaxed">
              Thiết lập cấu hình vận hành cốt lõi của thương hiệu <span className="text-indigo-400 font-bold">{shopProfile.ten_shop || "Cửa hàng"}</span>. Quản lý hồ sơ doanh nghiệp, cổng thanh toán ngân hàng tích hợp VietQR và sao lưu dữ liệu JSON an toàn.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-4 bg-slate-800/40 backdrop-blur-md p-4 rounded-xl border border-slate-700/50 shrink-0">
            <div className="text-center px-4 border-r border-slate-700/50">
              <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tổng sản phẩm</span>
              <span className="text-lg font-extrabold text-white font-mono">{data.San_pham?.length || 0}</span>
            </div>
            <div className="text-center px-4 border-r border-slate-700/50">
              <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Hóa đơn</span>
              <span className="text-lg font-extrabold text-emerald-400 font-mono">{data.Hoa_don?.length || 0}</span>
            </div>
            <div className="text-center px-2">
              <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Khách hàng</span>
              <span className="text-lg font-extrabold text-indigo-400 font-mono">{data.Khach_hang?.length || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* BENTO GRID LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN (Sao lưu & Khôi phục, Tích điểm hội viên) */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* A. SAO LƯU & KHÔI PHỤC DỮ LIỆU CARD */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden hover:shadow-md transition-all duration-300">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                  <Database className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                    Trung tâm Sao lưu &amp; Khôi phục JSON
                  </h3>
                  <p className="text-[10px] text-slate-500 font-medium">Bảo vệ và chuyển đổi cơ sở dữ liệu hệ thống chỉ với một click</p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-700 uppercase">
                JSON DB v1.0
              </span>
            </div>

            <div className="p-6 space-y-6">
              
              {/* Main functional split */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* 1. Export backup block */}
                <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/40 flex flex-col justify-between space-y-4">
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1">
                      <Download className="h-3 w-3" /> Xuất dữ liệu hệ thống
                    </span>
                    <h4 className="text-xs font-bold text-slate-800">Tải xuống Bản sao lưu (Backup)</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Đóng gói toàn bộ các file cơ sở dữ liệu (<span className="font-mono text-slate-700 font-semibold">brands, categories, configs, customers, employees, orders, products...</span>) thành duy nhất một file JSON để lưu trữ ngoại tuyến an toàn.
                    </p>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      disabled={isExporting}
                      onClick={handleExportBackup}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-xs hover:shadow-md transition-all duration-150 cursor-pointer"
                    >
                      {isExporting ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          Đang tạo bản sao lưu...
                        </>
                      ) : (
                        <>
                          <Download className="h-3.5 w-3.5" />
                          Tải xuống Backup (.JSON)
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* 2. Import restore block (Drag & Drop) */}
                <div className="flex flex-col justify-between space-y-4">
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
                      <Upload className="h-3 w-3" /> Khôi phục dữ liệu
                    </span>
                    <h4 className="text-xs font-bold text-slate-800 font-sans">Tải lên file sao lưu (Restore)</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Nhập file bản sao lưu JSON hợp lệ được tải xuống từ hệ thống trước đó để khôi phục toàn bộ trạng thái hoạt động của cửa hàng.
                    </p>
                  </div>

                  {/* Drag-and-drop zone */}
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center space-y-2 ${
                      isDragging
                        ? "border-indigo-500 bg-indigo-50/50"
                        : "border-slate-200 hover:border-indigo-400 hover:bg-slate-50/30"
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    
                    {isImporting ? (
                      <RefreshCw className="h-7 w-7 text-indigo-500 animate-spin" />
                    ) : (
                      <FileJson className={`h-7 w-7 ${isDragging ? 'text-indigo-500' : 'text-slate-400'}`} />
                    )}
                    
                    <div className="space-y-0.5">
                      <span className="block text-xs font-bold text-slate-700">
                        {isImporting ? "Đang giải nén & khôi phục..." : "Kéo thả file .json vào đây"}
                      </span>
                      <span className="block text-[10px] text-slate-400 font-medium">hoặc click để chọn file từ máy</span>
                    </div>
                  </div>

                </div>

              </div>

              {/* Toast / Status messages */}
              <AnimatePresence>
                {backupSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-3 bg-indigo-50 border border-indigo-100 text-indigo-800 rounded-xl flex items-center gap-2.5 text-xs font-semibold"
                  >
                    <CheckCircle2 className="h-4.5 w-4.5 text-indigo-600 shrink-0" />
                    <div>
                      <p className="font-bold">Đã tải bản sao lưu thành công!</p>
                      <p className="text-[10px] text-indigo-500 font-normal">Hãy bảo quản tệp JSON này cẩn thận, nó chứa toàn bộ dữ liệu kinh doanh của bạn.</p>
                    </div>
                  </motion.div>
                )}

                {restoreSuccessMsg && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2.5 text-xs font-semibold"
                  >
                    <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
                    <div>
                      <p className="font-bold">{restoreSuccessMsg}</p>
                      <p className="text-[10px] text-emerald-600/80 font-normal">Hệ thống đã cập nhật toàn bộ cơ sở dữ liệu. Tất cả các tab màn hình sẽ tự động hiển thị dữ liệu mới.</p>
                    </div>
                  </motion.div>
                )}

                {restoreError && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-3 bg-rose-50 border border-rose-100 text-rose-800 rounded-xl flex items-center gap-2.5 text-xs font-semibold"
                  >
                    <ShieldAlert className="h-4.5 w-4.5 text-rose-600 shrink-0" />
                    <div>
                      <p className="font-bold">Khôi phục thất bại</p>
                      <p className="text-[10px] text-rose-500 font-normal">{restoreError}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Quick warning */}
              <div className="pt-4 border-t border-slate-100 flex items-start gap-2.5 text-[10.5px] text-slate-500 font-medium leading-relaxed bg-amber-50/40 p-3 rounded-lg border border-amber-100/50">
                <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-amber-800">Lưu ý bảo mật:</span> File sao lưu JSON chứa thông tin nhạy cảm về doanh thu, công nợ nhà cung cấp, thông tin nhân viên và khách hàng. Tránh chia sẻ công khai hoặc tải lên các nền tảng không đáng tin cậy.
                </div>
              </div>

            </div>
          </div>

          {/* B. CẤU HÌNH TÍCH ĐIỂM HỘI VIÊN */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden hover:shadow-md transition-all duration-300">
            <div className="bg-gradient-to-r from-indigo-700 to-indigo-900 px-5 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-white/10 rounded-lg">
                  <Award className="h-5 w-5 text-yellow-300 fill-yellow-300/20" />
                </div>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                    Cấu hình Tích điểm &amp; Hạng Hội viên
                  </h3>
                  <p className="text-[10px] text-indigo-200">Kích thích mua sắm lặp lại bằng hệ thống điểm thưởng khách hàng thân thiết</p>
                </div>
              </div>
              <button 
                onClick={handleResetPointsConfig}
                className="text-white/80 hover:text-white transition-colors cursor-pointer text-xs font-semibold bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-lg"
                title="Khôi phục mặc định"
              >
                Mặc định
              </button>
            </div>

            <form onSubmit={handleSavePointsConfig} className="p-6 space-y-6">
              {pointsSuccess && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-100 text-emerald-800 font-bold text-xs rounded-xl flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600" />
                  Cấu hình điểm tích lũy hội viên đã được lưu thành công!
                </div>
              )}

              {/* VISUAL TIER METRIC SHOWN AS PROGRESS SLIDER */}
              <div className="bg-slate-50/60 rounded-xl p-4 border border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-indigo-500" />
                    Hệ thống Phân hạng Hội viên
                  </h4>
                  <span className="text-[10px] font-bold text-slate-400">Tự động nâng hạng</span>
                </div>
                
                {/* Visual bar */}
                <div className="space-y-4 pt-1">
                  <div className="relative h-2 bg-slate-200 rounded-full flex justify-between">
                    <div className="absolute top-0 left-0 h-full bg-indigo-500 rounded-full" style={{ width: "65%" }}></div>
                    <span className="absolute -top-1.5 left-[0%] w-5 h-5 rounded-full bg-slate-300 border-2 border-white flex items-center justify-center text-[8px] font-bold text-slate-700" title="Thường">T</span>
                    <span className="absolute -top-1.5 left-[25%] w-5 h-5 rounded-full bg-blue-400 border-2 border-white flex items-center justify-center text-[8px] font-bold text-white" title="Bạc">S</span>
                    <span className="absolute -top-1.5 left-[50%] w-5 h-5 rounded-full bg-yellow-500 border-2 border-white flex items-center justify-center text-[8px] font-bold text-white" title="Vàng">G</span>
                    <span className="absolute -top-1.5 left-[100%] w-5 h-5 rounded-full bg-indigo-600 border-2 border-white flex items-center justify-center text-[8px] font-bold text-white" title="Kim Cương">D</span>
                  </div>
                  
                  {/* Legend */}
                  <div className="grid grid-cols-4 gap-2 text-[10px] text-slate-600 text-center font-semibold pt-1">
                    <div className="text-left"><span className="font-bold text-slate-800">Thường</span><br/>&lt; 50đ</div>
                    <div><span className="font-bold text-blue-600">Bạc</span><br/>Từ 50đ</div>
                    <div><span className="font-bold text-yellow-600">Vàng</span><br/>Từ 100đ</div>
                    <div className="text-right"><span className="font-bold text-indigo-600">K.Cương</span><br/>&ge; 200đ</div>
                  </div>
                </div>
              </div>

              {/* INPUT GROUPS */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Doanh thu tích lũy để quy đổi thành 1 Điểm thưởng (VNĐ):
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      min={500}
                      step={500}
                      value={doanhThuDoiDiem}
                      onChange={(e) => setDoanhThuDoiDiem(Number(e.target.value) || 0)}
                      className="w-full rounded-xl border border-slate-200 py-2.5 pl-4 pr-10 font-mono text-xs font-bold text-slate-800 bg-slate-50/50 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 focus:outline-hidden transition-all duration-150"
                    />
                    <span className="absolute right-4 text-slate-400 font-extrabold text-xs">đ</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 font-medium">
                    Mặc định: Cứ mua hàng đạt <span className="font-bold text-slate-600">50,000đ</span> sẽ được tự động cộng <span className="font-bold text-slate-600">1 điểm thưởng</span>.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Giá trị giảm giá khi quy đổi 1 Điểm thưởng (VNĐ):
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      min={10}
                      step={10}
                      value={giaTri1Diem}
                      onChange={(e) => setGiaTri1Diem(Number(e.target.value) || 0)}
                      className="w-full rounded-xl border border-slate-200 py-2.5 pl-4 pr-10 font-mono text-xs font-bold text-slate-800 bg-slate-50/50 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 focus:outline-hidden transition-all duration-150"
                    />
                    <span className="absolute right-4 text-slate-400 font-extrabold text-xs">đ</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 font-medium">
                    Mặc định: Mỗi <span className="font-bold text-slate-600">1 điểm thưởng</span> được trừ trực tiếp <span className="font-bold text-slate-600">500đ</span> vào hóa đơn thanh toán tiếp theo.
                  </p>
                </div>
              </div>

              {/* Form submit */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleResetPointsConfig}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-500 font-bold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-xs hover:shadow-md transition-all duration-150 cursor-pointer"
                >
                  <Save className="h-3.5 w-3.5" />
                  Lưu &amp; Áp dụng quy tắc
                </button>
              </div>
            </form>
          </div>

        </div>

        {/* RIGHT COLUMN (Hồ sơ cửa hàng, Tài khoản ngân hàng) */}
        <div className="lg:col-span-5 space-y-8">
          
          {/* C. HỒ SƠ CỬA HÀNG */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden hover:shadow-md transition-all duration-300">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                  <Building className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                    Hồ sơ Cửa Hàng &amp; Nhận Diện
                  </h3>
                  <p className="text-[10px] text-slate-500 font-medium">Đồng bộ lên hóa đơn bán lẻ, website và báo cáo kinh doanh</p>
                </div>
              </div>
              {shopSaveSuccess && (
                <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 animate-bounce">
                  <Check className="h-3 w-3" /> Đã lưu!
                </span>
              )}
            </div>

            <form onSubmit={handleSaveShopProfile} className="p-6 space-y-4">
              {shopError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
                  {shopError}
                </div>
              )}

              <div className="space-y-4">
                {/* 1. Tên cửa hàng */}
                <div>
                  <label className="block text-slate-500 font-bold mb-1 text-[10px] uppercase tracking-wider">
                    Tên thương hiệu cửa hàng *
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-slate-400">
                      <Building className="h-4 w-4" />
                    </span>
                    <input
                      type="text"
                      required
                      value={shopProfile.ten_shop}
                      onChange={(e) => setShopProfile({ ...shopProfile, ten_shop: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-4 text-slate-800 font-bold text-xs bg-slate-50/50 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 focus:outline-hidden transition-all duration-150"
                      placeholder="Tên cửa hàng..."
                    />
                  </div>
                </div>

                {/* 2. Slogan */}
                <div>
                  <label className="block text-slate-500 font-bold mb-1 text-[10px] uppercase tracking-wider">
                    Slogan / Châm ngôn kinh doanh
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-emerald-500">
                      <Sparkles className="h-4 w-4" />
                    </span>
                    <input
                      type="text"
                      value={shopProfile.slogan}
                      onChange={(e) => setShopProfile({ ...shopProfile, slogan: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-4 text-emerald-700 font-semibold italic text-xs bg-slate-50/50 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 focus:outline-hidden transition-all duration-150"
                      placeholder="Slogan..."
                    />
                  </div>
                </div>

                {/* 3. Địa chỉ */}
                <div>
                  <label className="block text-slate-500 font-bold mb-1 text-[10px] uppercase tracking-wider">
                    Địa chỉ liên hệ chính
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-slate-400">
                      <MapPin className="h-4 w-4" />
                    </span>
                    <input
                      type="text"
                      value={shopProfile.dia_chi}
                      onChange={(e) => setShopProfile({ ...shopProfile, dia_chi: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-4 text-slate-800 text-xs bg-slate-50/50 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 focus:outline-hidden transition-all duration-150"
                      placeholder="Địa chỉ..."
                    />
                  </div>
                </div>

                {/* 4. Grid SĐT / Email */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-500 font-bold mb-1 text-[10px] uppercase tracking-wider">
                      Hotline SĐT
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 text-slate-400">
                        <Phone className="h-3.5 w-3.5" />
                      </span>
                      <input
                        type="text"
                        value={shopProfile.dien_thoai}
                        onChange={(e) => setShopProfile({ ...shopProfile, dien_thoai: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-slate-800 font-mono text-xs bg-slate-50/50 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 focus:outline-hidden transition-all duration-150"
                        placeholder="SĐT..."
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-500 font-bold mb-1 text-[10px] uppercase tracking-wider">
                      Email hỗ trợ
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 text-slate-400">
                        <Mail className="h-3.5 w-3.5" />
                      </span>
                      <input
                        type="email"
                        value={shopProfile.email}
                        onChange={(e) => setShopProfile({ ...shopProfile, email: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-slate-800 text-xs bg-slate-50/50 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 focus:outline-hidden transition-all duration-150"
                        placeholder="Email..."
                      />
                    </div>
                  </div>
                </div>

                {/* 5. Website */}
                <div>
                  <label className="block text-slate-500 font-bold mb-1 text-[10px] uppercase tracking-wider">
                    Website chính thức
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-slate-400">
                      <Globe className="h-4 w-4" />
                    </span>
                    <input
                      type="text"
                      value={shopProfile.website}
                      onChange={(e) => setShopProfile({ ...shopProfile, website: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-4 text-indigo-600 font-mono text-xs bg-slate-50/50 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 focus:outline-hidden transition-all duration-150"
                      placeholder="https://..."
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-xs hover:shadow-md transition-all duration-150 cursor-pointer"
                >
                  <Save className="h-3.5 w-3.5" />
                  Xác nhận lưu hồ sơ cửa hàng
                </button>
              </div>
            </form>
          </div>

          {/* D. TÀI KHOẢN NGÂN HÀNG (VIETQR COMPLIANT) */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden hover:shadow-md transition-all duration-300">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                    Tài khoản Thanh toán (VietQR)
                  </h3>
                  <p className="text-[10px] text-slate-500 font-medium">Cấu hình nhận thanh toán QR Code động trên màn hình POS</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingBankId(null);
                  setNewBank({
                    ten_ngan_hang: "",
                    so_tai_khoan: "",
                    chu_tai_khoan: "",
                    chi_nhanh: ""
                  });
                  setShowAddBankForm(!showAddBankForm);
                  setBankError("");
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl text-[10px] font-bold border border-indigo-100 cursor-pointer transition-colors"
              >
                {showAddBankForm && !editingBankId ? (
                  <>
                    <X className="h-3.5 w-3.5" />
                    Hủy bỏ
                  </>
                ) : (
                  <>
                    <Plus className="h-3.5 w-3.5" />
                    Thêm mới
                  </>
                )}
              </button>
            </div>

            <div className="p-6 space-y-4">
              {bankError && (
                <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl text-xs font-semibold">
                  {bankError}
                </div>
              )}

              {/* Bank update/creation feedback */}
              {bankSaveSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 font-semibold text-xs rounded-xl flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600" />
                  {editingBankId ? "Đã cập nhật thông tin tài khoản!" : "Đã thêm tài khoản ngân hàng thành công!"}
                </div>
              )}

              {/* Form addition toggle */}
              <AnimatePresence>
                {showAddBankForm && (
                  <motion.form
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    onSubmit={handleAddBankAccount}
                    className="p-4 bg-slate-50 border border-slate-200/60 rounded-xl space-y-3 overflow-hidden"
                  >
                    <h4 className="font-bold text-slate-700 text-[10px] uppercase tracking-wider text-indigo-600">
                      {editingBankId ? `Cập nhật tài khoản: ${editingBankId}` : "Thêm liên kết tài khoản VietQR mới"}
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-500 font-bold mb-1 text-[10px]">Tên Ngân hàng *</label>
                        <input
                          type="text"
                          required
                          value={newBank.ten_ngan_hang}
                          onChange={(e) => setNewBank({ ...newBank, ten_ngan_hang: e.target.value })}
                          className="w-full rounded-lg border border-slate-200 py-1.5 px-3 text-slate-800 font-bold text-xs bg-white focus:border-indigo-500 focus:outline-hidden"
                          placeholder="MB Bank, VCB, BIDV..."
                        />
                      </div>
                      <div>
                        <label className="block text-slate-500 font-bold mb-1 text-[10px]">Số tài khoản *</label>
                        <input
                          type="text"
                          required
                          value={newBank.so_tai_khoan}
                          onChange={(e) => setNewBank({ ...newBank, so_tai_khoan: e.target.value })}
                          className="w-full rounded-lg border border-slate-200 py-1.5 px-3 text-slate-800 font-mono font-bold text-xs bg-white focus:border-indigo-500 focus:outline-hidden"
                          placeholder="Số tài khoản nhận..."
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-500 font-bold mb-1 text-[10px]">Tên Chủ tài khoản *</label>
                        <input
                          type="text"
                          required
                          value={newBank.chu_tai_khoan}
                          onChange={(e) => setNewBank({ ...newBank, chu_tai_khoan: e.target.value })}
                          className="w-full rounded-lg border border-slate-200 py-1.5 px-3 text-slate-800 font-bold uppercase text-xs bg-white focus:border-indigo-500 focus:outline-hidden"
                          placeholder="HOANG VAN A"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-500 font-bold mb-1 text-[10px]">Chi nhánh</label>
                        <input
                          type="text"
                          value={newBank.chi_nhanh}
                          onChange={(e) => setNewBank({ ...newBank, chi_nhanh: e.target.value })}
                          className="w-full rounded-lg border border-slate-200 py-1.5 px-3 text-slate-800 text-xs bg-white focus:border-indigo-500 focus:outline-hidden"
                          placeholder="Chi nhánh Hà Nội..."
                        />
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingBankId(null);
                          setNewBank({
                            ten_ngan_hang: "",
                            so_tai_khoan: "",
                            chu_tai_khoan: "",
                            chi_nhanh: ""
                          });
                          setShowAddBankForm(false);
                        }}
                        className="px-3 py-1.5 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 bg-white hover:bg-slate-50 cursor-pointer"
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        className="flex items-center gap-1 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-[10px] shadow-xs cursor-pointer transition-all"
                      >
                        <Check className="h-3 w-3" />
                        {editingBankId ? "Cập nhật" : "Thêm mới"}
                      </button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>

              {/* LIST OF DEBIT CARDS */}
              <div className="space-y-4">
                {data.Ngan_hang && data.Ngan_hang.length > 0 ? (
                  data.Ngan_hang.map((bank, index) => (
                    <div
                      key={bank.id}
                      className={`relative overflow-hidden rounded-2xl p-5 border shadow-xs bg-gradient-to-br ${getBankGradient(
                        index
                      )} hover:scale-101 hover:shadow-md transition-all duration-200`}
                    >
                      {/* Debit card holographic chip accent */}
                      <div className="absolute top-4 right-12 w-8 h-6 bg-yellow-400/20 rounded-md border border-yellow-400/40 backdrop-blur-xs flex items-center justify-center opacity-70">
                        <div className="grid grid-cols-3 gap-0.5 w-6 h-4">
                          <div className="border border-yellow-400/30 rounded-xs"></div>
                          <div className="border border-yellow-400/30 rounded-xs"></div>
                          <div className="border border-yellow-400/30 rounded-xs"></div>
                        </div>
                      </div>

                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-extrabold text-xs uppercase tracking-wider opacity-90 text-indigo-200">
                            VietQR COMPLIANT SENDER
                          </div>
                          <div className="font-black text-lg font-sans tracking-tight mt-1 flex items-center gap-1.5">
                            <CardIcon className="h-5 w-5 opacity-90" />
                            {bank.ten_ngan_hang}
                          </div>
                        </div>

                        {/* Top-right Actions on the Card */}
                        <div className="relative z-20 flex items-center gap-1.5 bg-white/15 hover:bg-white/25 p-1.5 rounded-xl border border-white/20 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingBankId(bank.id);
                              setNewBank({
                                ten_ngan_hang: bank.ten_ngan_hang,
                                so_tai_khoan: bank.so_tai_khoan,
                                chu_tai_khoan: bank.chu_tai_khoan,
                                chi_nhanh: bank.chi_nhanh || ""
                              });
                              setShowAddBankForm(true);
                              setBankError("");
                            }}
                            className="p-1 text-white hover:text-indigo-200 transition-colors cursor-pointer"
                            title="Sửa"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setBankToDelete(bank.id);
                            }}
                            className="p-1 text-white hover:text-rose-200 transition-colors cursor-pointer"
                            title="Xóa"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Monospace spaced card number representation */}
                      <div className="mt-6 font-mono text-base md:text-lg font-bold tracking-widest text-center py-1 opacity-95 text-white/95">
                        {formatBankNumber(bank.so_tai_khoan)}
                      </div>

                      <div className="mt-5 flex justify-between items-end text-xs font-semibold">
                        <div>
                          <span className="block text-[9px] uppercase tracking-wider text-white/50">CHỦ TÀI KHOẢN</span>
                          <span className="font-bold tracking-wide uppercase text-white">{bank.chu_tai_khoan}</span>
                        </div>
                        <div className="text-right">
                          <span className="block text-[9px] uppercase tracking-wider text-white/50">CHI NHÁNH</span>
                          <span className="text-[10px] text-white/90 font-medium truncate max-w-[150px] block">
                            {bank.chi_nhanh || "Khôi phục toàn quốc"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center text-slate-400 font-bold border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                    <HelpCircle className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                    Chưa thiết lập tài khoản ngân hàng nhận thanh toán.
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-4 bg-slate-50 border-t border-slate-100 text-slate-400 text-[10.5px] text-center leading-relaxed font-medium">
              VietQR và mã quét QR nhận tiền tự động được đồng bộ với Ngân hàng Nhà nước, đảm bảo bảo mật và giao dịch tức thì 24/7.
            </div>
          </div>

        </div>

      </div>

      {/* Custom Delete Confirmation Modal */}
      <AnimatePresence>
        {bankToDelete !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200"
            >
              <div className="flex items-center gap-3 text-amber-600 mb-4">
                <ShieldAlert className="h-6 w-6 shrink-0" />
                <h3 className="text-base font-bold text-slate-800">Xác nhận xóa tài khoản</h3>
              </div>
              <p className="text-xs text-slate-600 mb-6 leading-relaxed">
                Bạn có chắc chắn muốn xóa tài khoản ngân hàng này? Hành động này sẽ gỡ bỏ tài khoản khỏi cấu hình hiển thị VietQR trên hóa đơn và POS.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setBankToDelete(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteBank(bankToDelete)}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
                >
                  Đồng ý xóa
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Restore Confirmation Modal */}
      <AnimatePresence>
        {pendingRestoreFile !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-rose-100"
            >
              <div className="flex items-center gap-3 text-rose-600 mb-4">
                <ShieldAlert className="h-7 w-7 shrink-0 animate-pulse" />
                <h3 className="text-lg font-black text-slate-800 font-sans tracking-tight">⚠️ CẢNH BÁO QUAN TRỌNG</h3>
              </div>
              
              <div className="space-y-3 text-xs text-slate-600 leading-relaxed mb-6">
                <p className="font-bold text-rose-700 bg-rose-50 p-3 rounded-xl border border-rose-100">
                  Việc khôi phục dữ liệu sẽ GHI ĐÈ và THAY THẾ TOÀN BỘ dữ liệu hiện tại của hệ thống!
                </p>
                <p>
                  Các danh mục sẽ bị thay thế bao gồm:
                </p>
                <ul className="list-disc pl-5 space-y-1 font-semibold text-slate-700">
                  <li>Danh sách sản phẩm &amp; Tồn kho hiện tại</li>
                  <li>Toàn bộ lịch sử Hóa đơn bán hàng &amp; Trả hàng</li>
                  <li>Lịch sử Nhập hàng &amp; Công nợ nhà cung cấp</li>
                  <li>Thông tin khách hàng, nhân viên &amp; điểm tích lũy</li>
                </ul>
                <p className="text-slate-500 italic">
                  Tệp khôi phục: <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">{pendingRestoreFile.name}</span> ({(pendingRestoreFile.size / 1024).toFixed(2)} KB)
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setPendingRestoreFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={() => executeRestore(pendingRestoreFile)}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
                >
                  Xác nhận khôi phục (Ghi đè)
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
