import React, { useState } from "react";
import {
  FileSpreadsheet,
  Plus,
  Search,
  Eye,
  Trash2,
  Edit,
  X,
  Minus,
  Archive,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { DatabaseSchema, ImportOrder } from "../types";

interface NhaphangProps {
  data: DatabaseSchema;
  onRefreshData: () => void;
  onCreateNewClick?: () => void;
}

export default function Nhaphang({ data, onRefreshData, onCreateNewClick }: NhaphangProps) {
  const [importSearch, setImportSearch] = useState("");
  const [importDebtFilter, setImportDebtFilter] = useState<"all" | "has_debt" | "no_debt">("all");

  const [importPageSize, setImportPageSize] = useState<number>(15);
  const [importCurrentPage, setImportCurrentPage] = useState<number>(1);

  // View, Edit, Delete States
  const [viewingImport, setViewingImport] = useState<ImportOrder | null>(null);
  const [editingImport, setEditingImport] = useState<ImportOrder | null>(null);
  const [selectedProductToAdd, setSelectedProductToAdd] = useState("");

  const handleSaveEditedImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingImport) return;

    const oldImport = data.Nhap_hang.find(imp => imp.id === editingImport.id);
    const updatedDb = { ...data };

    // Restore old stock quantities and old supplier debt
    if (oldImport) {
      oldImport.chi_tiet_nhap.forEach(oldDetail => {
        const prod = updatedDb.San_pham.find(p => p.id === (oldDetail.id_sp || (oldDetail as any).id_san_pham));
        if (prod) {
          prod.ton_kho -= oldDetail.so_luong;
        }
      });
      const oldSup = updatedDb.Nha_cung_cap.find(s => s.id === oldImport.id_nha_cung_cap);
      if (oldSup) {
        oldSup.cong_no_hien_tai -= oldImport.con_no;
      }
    }

    // Apply new quantities and calculate cost
    let newTotalImportPrice = 0;
    editingImport.chi_tiet_nhap.forEach((newDetail) => {
      const prod = updatedDb.San_pham.find(p => p.id === (newDetail.id_sp || (newDetail as any).id_san_pham));
      if (prod) {
        prod.ton_kho += newDetail.so_luong;
      }
      newTotalImportPrice += newDetail.so_luong * newDetail.gian_nhap;
    });

    editingImport.tong_tien_nhap = newTotalImportPrice;
    editingImport.con_no = Math.max(0, newTotalImportPrice - editingImport.da_thanh_toan);

    // Apply new supplier debt
    const newSup = updatedDb.Nha_cung_cap.find(s => s.id === editingImport.id_nha_cung_cap);
    if (newSup) {
      newSup.cong_no_hien_tai += editingImport.con_no;
    }

    // Update inside database
    updatedDb.Nhap_hang = updatedDb.Nhap_hang.map(imp => 
      imp.id === editingImport.id ? editingImport : imp
    );

    try {
      const res = await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedDb)
      });
      if ((await res.json()).success) {
        onRefreshData();
        setEditingImport(null);
      } else {
        alert("Lưu dữ liệu phiếu nhập hàng thất bại!");
      }
    } catch (err) {
      console.error(err);
      alert("Lỗi kết nối!");
    }
  };

  const handleDeleteImport = async (id: string) => {
    if (!confirm(`Bạn có chắc muốn xóa phiếu nhập hàng ${id}? Tồn kho sẽ được trừ lại và công nợ nhà cung cấp liên quan sẽ được điều chỉnh.`)) return;

    const oldImport = data.Nhap_hang.find(imp => imp.id === id);
    const updatedDb = { ...data };

    if (oldImport) {
      // Subtract the imported quantities from inventory
      oldImport.chi_tiet_nhap.forEach(detail => {
        const prod = updatedDb.San_pham.find(p => p.id === (detail.id_sp || (detail as any).id_san_pham));
        if (prod) {
          prod.ton_kho -= detail.so_luong;
        }
      });
      // Deduct supplier debt
      const sup = updatedDb.Nha_cung_cap.find(s => s.id === oldImport.id_nha_cung_cap);
      if (sup) {
        sup.cong_no_hien_tai -= oldImport.con_no;
      }
    }

    updatedDb.Nhap_hang = updatedDb.Nhap_hang.filter(imp => imp.id !== id);

    try {
      const res = await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedDb)
      });
      if ((await res.json()).success) {
        onRefreshData();
      } else {
        alert("Xóa phiếu nhập hàng thất bại!");
      }
    } catch (err) {
      console.error(err);
      alert("Lỗi kết nối!");
    }
  };

  const handleAddProductToEditImport = () => {
    if (!selectedProductToAdd || !editingImport) return;
    const prod = data.San_pham.find(p => p.id === selectedProductToAdd);
    if (!prod) return;

    const existingDetailIndex = editingImport.chi_tiet_nhap.findIndex(d => d.id_sp === prod.id);
    const updatedDetails = [...editingImport.chi_tiet_nhap];

    if (existingDetailIndex >= 0) {
      updatedDetails[existingDetailIndex].so_luong += 1;
      updatedDetails[existingDetailIndex].thanh_tien = 
        updatedDetails[existingDetailIndex].so_luong * updatedDetails[existingDetailIndex].gian_nhap;
    } else {
      updatedDetails.push({
        id_sp: prod.id,
        so_luong: 1,
        gian_nhap: prod.gia_von,
        thanh_tien: prod.gia_von
      });
    }

    setEditingImport({
      ...editingImport,
      chi_tiet_nhap: updatedDetails
    });
    setSelectedProductToAdd("");
  };

  React.useEffect(() => {
    setImportCurrentPage(1);
  }, [importSearch, importDebtFilter, importPageSize]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("vi-VN").format(val);
  };

  const filteredImports = data.Nhap_hang.filter((imp) => {
    const s = data.Nha_cung_cap.find((sup) => sup.id === imp.id_nha_cung_cap);
    const sName = s ? s.ten_nha_cung_cap.toLowerCase() : "";
    const q = importSearch.toLowerCase().trim();
    const matchesSearch = !q || imp.id.toLowerCase().includes(q) || sName.includes(q);

    let matchesDebt = true;
    if (importDebtFilter === "has_debt") {
      matchesDebt = imp.con_no > 0;
    } else if (importDebtFilter === "no_debt") {
      matchesDebt = imp.con_no <= 0;
    }

    return matchesSearch && matchesDebt;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-blue-500" />
            Quản lý Nhập hàng kho
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Lập phiếu nhập kho, theo dõi nhật ký nhập hàng và công nợ với nhà cung cấp.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Left side: Restocking list */}
        <div className="xl:col-span-3 bg-white rounded-xl shadow-xs border overflow-hidden flex flex-col h-[732px]">
  {/* Header tiêu đề bảng */}
  <div className="p-4 border-b bg-gray-50/50 flex justify-between items-center h-[40px] shrink-0">
    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
      Nhật ký phiếu nhập kho ({filteredImports.length})
    </h3>
  </div>

  {/* Khung chứa bảng ẩn hoàn toàn thanh cuộn */}
  <div 
    className="overflow-x-auto flex-1 [&::-webkit-scrollbar]:hidden"
    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
  >
    <table className="w-full text-left table-layout-fixed">
      <thead>
        <tr className="border-b text-gray-500 text-xs font-semibold bg-gray-50/30 h-[40px]">
          <th className="py-2 px-4 w-28">Mã phiếu</th>
          <th className="py-2 px-4 w-44">Ngày nhập</th>
          <th className="py-2 px-4">Nhà cung cấp</th>
          <th className="py-2 px-4 text-right">Tổng thành tiền</th>
          <th className="py-2 px-4 text-right">Đã thanh toán</th>
          <th className="py-2 px-4 text-right">Nợ còn lại</th>
          <th className="py-2 px-4 text-center w-28">Hành động</th>
        </tr>
      </thead>
      <tbody className="text-xs text-gray-700">
        {(() => {
          const totalItems = filteredImports.length;
          const totalPages = Math.ceil(totalItems / importPageSize) || 1;
          const safeCurrentPage = Math.max(1, Math.min(importCurrentPage, totalPages));
          const paginatedImports = filteredImports.slice(
            (safeCurrentPage - 1) * importPageSize,
            safeCurrentPage * importPageSize
          );

          return (
            <>
              {paginatedImports.map((imp) => {
                const s = data.Nha_cung_cap.find((sup) => sup.id === imp.id_nha_cung_cap);
                return (
                  <tr key={imp.id} className="border-b text-base last:border-0 hover:bg-slate-100/50 transition-colors h-[42px]">
                    <td className="py-1 px-4 font-mono font-bold text-blue-600 truncate">{imp.id}</td>
                    <td className="py-1 px-4 text-gray-500">
                      {new Date(imp.ngay_nhap).toLocaleDateString("vi-VN") +
                        " " +
                        new Date(imp.ngay_nhap).toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                    </td>
                    <td className="py-1 px-4 font-semibold text-gray-900 truncate max-w-[200px]">
                      {s ? s.ten_nha_cung_cap : imp.id_nha_cung_cap}
                    </td>
                    <td className="py-1 px-4 text-right font-bold text-gray-900">
                      {formatCurrency(imp.tong_tien_nhap)}
                    </td>
                    <td className="py-1 px-4 text-right text-emerald-600 font-medium">
                      {formatCurrency(imp.da_thanh_toan)}
                    </td>
                    <td className="py-1 px-4 text-right font-bold text-rose-600">
                      {formatCurrency(imp.con_no)}
                    </td>
                    <td className="py-1 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setViewingImport(imp)}
                          className="p-1 rounded-full text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                          title="Xem chi tiết"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingImport(JSON.parse(JSON.stringify(imp)))}
                          className="p-1 rounded-full text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                          title="Sửa phiếu"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteImport(imp.id)}
                          className="p-1 rounded-full text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Xóa phiếu"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {/* Bù dòng trống không có đường kẻ border để khít giao diện 15 dòng */}
              {paginatedImports.length > 0 && paginatedImports.length < 15 && (
                Array.from({ length: 15 - paginatedImports.length }).map((_, index) => (
                  <tr key={`empty-import-${index}`} className="h-[42px] border-none">
                    <td colSpan={7}></td>
                  </tr>
                ))
              )}

              {/* Trạng thái danh sách trống mượt mà với Icon */}
              {totalItems === 0 && (
                <tr className="h-[590px] border-none">
                  <td colSpan={7} className="text-center text-gray-400 font-medium vertical-middle">
                    <div className="flex flex-col items-center justify-center h-full gap-2">
                      <Archive className="h-8 w-8 text-gray-300" />
                      <span>Không tìm thấy phiếu nhập kho nào khớp bộ lọc</span>
                    </div>
                  </td>
                </tr>
              )}
            </>
          );
        })()}
      </tbody>
    </table>
  </div>

  {/* Pagination Controls: Cố định h-[62px] ở đáy bảng */}
  {(() => {
    const totalItems = filteredImports.length;
    const totalPages = Math.ceil(totalItems / importPageSize) || 1;
    const safeCurrentPage = Math.max(1, Math.min(importCurrentPage, totalPages));

    const getPageNumbers = () => {
      const pages = [];
      const maxVisible = 5;
      if (totalPages <= maxVisible) {
        for (let i = 1; i <= totalPages; i++) pages.push(i);
      } else {
        if (safeCurrentPage <= 3) {
          pages.push(1, 2, 3, 4, "...", totalPages);
        } else if (safeCurrentPage >= totalPages - 2) {
          pages.push(1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
        } else {
          pages.push(1, "...", safeCurrentPage - 1, safeCurrentPage, safeCurrentPage + 1, "...", totalPages);
        }
      }
      return pages;
    };

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t bg-gray-50/50 text-xs text-gray-500 font-medium h-[62px] shrink-0">
        <div className="flex items-center gap-2">
          <span>Hiển thị:</span>
          <select
            value={importPageSize}
            onChange={(e) => setImportPageSize(Number(e.target.value))}
            className="rounded-md border border-gray-300 bg-white px-2 py-1 focus:border-blue-500 focus:outline-hidden text-gray-700 cursor-pointer text-xs font-semibold"
          >
            <option value={15}>15 dòng</option>
            <option value={30}>30 dòng</option>
            <option value={50}>50 dòng</option>
            <option value={100}>100 dòng</option>
          </select>
          <span className="text-gray-400">|</span>
          <span>
            Hiển thị {totalItems > 0 ? (safeCurrentPage - 1) * importPageSize + 1 : 0} - {Math.min(safeCurrentPage * importPageSize, totalItems)} trong {totalItems} dòng
          </span>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setImportCurrentPage(1)}
              disabled={safeCurrentPage === 1}
              className="p-1 rounded-md border border-gray-300 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-white transition-colors cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" style={{ strokeWidth: 3 }} />
            </button>
            <button
              onClick={() => setImportCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={safeCurrentPage === 1}
              className="p-1 rounded-md border border-gray-300 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-white transition-colors cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {getPageNumbers().map((p, idx) => {
              if (p === "...") {
                return (
                  <span key={`dots-import-${idx}`} className="px-2 py-1 text-gray-400 select-none">
                    ...
                  </span>
                );
              }
              return (
                <button
                  key={`import-page-btn-${p}`}
                  onClick={() => setImportCurrentPage(p)}
                  className={`px-2.5 py-1 rounded-md border text-xs transition-colors cursor-pointer font-semibold ${
                    safeCurrentPage === p
                      ? "bg-blue-600 border-blue-600 text-white"
                      : "border-gray-300 bg-white text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {p}
                </button>
              );
            })}

            <button
              onClick={() => setImportCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={safeCurrentPage === totalPages}
              className="p-1 rounded-md border border-gray-300 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-white transition-colors cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => setImportCurrentPage(totalPages)}
              disabled={safeCurrentPage === totalPages}
              className="p-1 rounded-md border border-gray-300 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-white transition-colors cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" style={{ strokeWidth: 3 }} />
            </button>
          </div>
        )}
      </div>
    );
  })()}
</div>

        {/* Right side: Actions & Filters */}
        <div className="space-y-6">
          {/* Lập phiếu mới button card */}
          <div className="bg-white rounded-xl shadow-xs border p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b pb-2">
              Thao tác nhập kho
            </h3>
            <button
              onClick={() => {
                if (data.San_pham.length === 0) {
                  return alert("Cần có sản phẩm trong hệ thống trước khi làm phiếu nhập!");
                }
                if (onCreateNewClick) {
                  onCreateNewClick();
                }
              }}
              className="w-full flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2.5 rounded-lg transition-all shadow-sm cursor-pointer"
            >
              <Plus className="h-4.5 w-4.5" />
              Lập phiếu nhập kho mới
            </button>
          </div>

          {/* Tìm kiếm & Bộ lọc */}
          <div className="bg-white rounded-xl shadow-xs border p-4 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 border-b pb-2">
              <Search className="h-4 w-4 text-blue-500" />
              Tìm kiếm & Bộ lọc
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">
                  Mã phiếu / Nhà cung cấp
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-gray-400">
                    <Search className="h-3.5 w-3.5" />
                  </span>
                  <input
                    type="text"
                    placeholder="Nhập mã hoặc tên đối tác..."
                    value={importSearch}
                    onChange={(e) => setImportSearch(e.target.value)}
                    className="w-full rounded-md border border-gray-300 py-1.5 pl-8 pr-2.5 focus:border-blue-500 focus:outline-hidden bg-white text-gray-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">
                  Tình trạng công nợ
                </label>
                <select
                  value={importDebtFilter}
                  onChange={(e) => setImportDebtFilter(e.target.value as any)}
                  className="w-full rounded-md border border-gray-300 py-1.5 px-2.5 focus:border-blue-500 focus:outline-hidden bg-white text-gray-700"
                >
                  <option value="all">Tất cả phiếu nhập</option>
                  <option value="has_debt">Còn nợ nhà cung cấp</option>
                  <option value="no_debt">Đã thanh toán đủ</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* VIEW IMPORT ORDER MODAL */}
      {viewingImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl overflow-hidden animate-in zoom-in-95 duration-150 border border-slate-200 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between bg-slate-50 border-b border-slate-150 px-5 py-3.5 text-slate-800">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-800">Chi tiết phiếu nhập kho {viewingImport.id}</h3>
              </div>
              <button 
                onClick={() => setViewingImport(null)} 
                className="rounded-full p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto text-xs text-gray-700">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border">
                <div>
                  <p className="mb-1"><span className="font-semibold text-gray-500">Ngày nhập hàng:</span> {new Date(viewingImport.ngay_nhap).toLocaleString("vi-VN")}</p>
                  <p className="mb-1">
                    <span className="font-semibold text-gray-500">Nhà cung cấp:</span> {
                      data.Nha_cung_cap.find(s => s.id === viewingImport.id_nha_cung_cap)?.ten_nha_cung_cap || viewingImport.id_nha_cung_cap
                    }
                  </p>
                  <p><span className="font-semibold text-gray-500">Mã nhà cung cấp:</span> <span className="font-mono">{viewingImport.id_nha_cung_cap}</span></p>
                </div>
                <div>
                  <p className="mb-1">
                    <span className="font-semibold text-gray-500">Nhân viên nhận hàng:</span> {
                      data.Nhan_vien.find(e => e.id === viewingImport.id_nhan_vien)?.ho_ten || viewingImport.id_nhan_vien
                    }
                  </p>
                  <p className="mb-1"><span className="font-semibold text-gray-500">Phương thức thanh toán:</span> {viewingImport.phuong_thuc_thanh_toan || "Tiền mặt"}</p>
                  <p>
                    <span className="font-semibold text-gray-500">Trạng thái công nợ:</span> {
                      viewingImport.con_no > 0 
                        ? <span className="px-2 py-0.5 bg-rose-50 text-rose-600 rounded-full font-bold text-[10px]">Còn nợ đối tác</span>
                        : <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full font-bold text-[10px]">Đã trả đủ</span>
                    }
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-gray-800 mb-2 border-b pb-1">Chi tiết hàng hóa nhập kho</h4>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b text-gray-500 font-semibold">
                        <th className="py-2 px-3 w-12 text-center">STT</th>
                        <th className="py-2 px-3">Mã hàng</th>
                        <th className="py-2 px-3">Tên sản phẩm</th>
                        <th className="py-2 px-3 text-right">Số lượng nhập</th>
                        <th className="py-2 px-3 text-right">Giá nhập gốc</th>
                        <th className="py-2 px-3 text-right">Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {viewingImport.chi_tiet_nhap.map((detail, idx) => {
                        const prod = data.San_pham.find(p => p.id === (detail.id_sp || (detail as any).id_san_pham));
                        return (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="py-2 px-3 text-center text-gray-400">{idx + 1}</td>
                            <td className="py-2 px-3 font-mono font-medium">{detail.id_sp || (detail as any).id_san_pham}</td>
                            <td className="py-2 px-3 font-semibold text-slate-800">{prod ? prod.ten_san_pham : "Không rõ"}</td>
                            <td className="py-2 px-3 text-right font-semibold">{detail.so_luong}</td>
                            <td className="py-2 px-3 text-right">{formatCurrency(detail.gian_nhap)}</td>
                            <td className="py-2 px-3 text-right font-bold text-slate-900">{formatCurrency(detail.thanh_tien)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <div className="w-64 space-y-1.5 border-t pt-3 text-xs font-semibold text-gray-700">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Tổng tiền hàng nhập:</span>
                    <span>{formatCurrency(viewingImport.tong_tien_nhap)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-600">
                    <span>Đã thanh toán:</span>
                    <span>{formatCurrency(viewingImport.da_thanh_toan)}</span>
                  </div>
                  <div className="flex justify-between text-rose-600 border-t pt-1 font-bold">
                    <span>Nợ còn lại:</span>
                    <span>{formatCurrency(viewingImport.con_no)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 border-t px-5 py-3.5 flex justify-end">
              <button 
                onClick={() => setViewingImport(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-bold text-xs cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT IMPORT ORDER MODAL */}
      {editingImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <form onSubmit={handleSaveEditedImport} className="w-full max-w-3xl rounded-xl bg-white shadow-xl overflow-hidden animate-in zoom-in-95 duration-150 border border-slate-200 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between bg-slate-50 border-b border-slate-150 px-5 py-3.5 text-slate-800">
              <div className="flex items-center gap-2">
                <Edit className="h-5 w-5 text-amber-600" />
                <h3 className="text-sm font-bold text-slate-800">Sửa phiếu nhập kho {editingImport.id}</h3>
              </div>
              <button 
                type="button"
                onClick={() => setEditingImport(null)} 
                className="rounded-full p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto text-xs text-gray-700">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-gray-400 mb-1">Nhà cung cấp</label>
                  <select
                    value={editingImport.id_nha_cung_cap}
                    onChange={(e) => setEditingImport({ ...editingImport, id_nha_cung_cap: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-2 py-1.5 focus:border-blue-500 bg-white font-semibold"
                  >
                    {data.Nha_cung_cap.map(s => (
                      <option key={s.id} value={s.id}>{s.ten_nha_cung_cap}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-400 mb-1">Nhân viên nhận hàng</label>
                  <select
                    value={editingImport.id_nhan_vien}
                    onChange={(e) => setEditingImport({ ...editingImport, id_nhan_vien: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-2 py-1.5 focus:border-blue-500 bg-white"
                  >
                    {data.Nhan_vien.map(e => (
                      <option key={e.id} value={e.id}>{e.ho_ten}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-400 mb-1">Ngày nhập hàng</label>
                  <input
                    type="text"
                    value={editingImport.ngay_nhap}
                    onChange={(e) => setEditingImport({ ...editingImport, ngay_nhap: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-2.5 py-1.5 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-400 mb-1">Phương thức thanh toán</label>
                  <select
                    value={editingImport.phuong_thuc_thanh_toan || "Tiền mặt"}
                    onChange={(e) => setEditingImport({ ...editingImport, phuong_thuc_thanh_toan: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-2 py-1.5 focus:border-blue-500 bg-white"
                  >
                    <option value="Tiền mặt">Tiền mặt</option>
                    <option value="Chuyển khoản">Chuyển khoản</option>
                    <option value="Ví">Ví</option>
                    <option value="Voucher">Voucher</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-400 mb-1">Đã thanh toán (VND)</label>
                  <input
                    type="number"
                    min="0"
                    value={editingImport.da_thanh_toan}
                    onChange={(e) => {
                      const pay = Number(e.target.value);
                      const totalCost = editingImport.chi_tiet_nhap.reduce((acc, d) => acc + d.thanh_tien, 0);
                      setEditingImport({
                        ...editingImport,
                        da_thanh_toan: pay,
                        con_no: Math.max(0, totalCost - pay)
                      });
                    }}
                    className="w-full rounded-md border border-gray-300 px-2.5 py-1 focus:border-blue-500 font-mono font-bold text-emerald-600"
                  />
                </div>
              </div>

              {/* ITEM ADDITION LINE FOR IMPORTS */}
              <div className="bg-slate-50 p-3 rounded-lg border flex flex-col sm:flex-row sm:items-end gap-3">
                <div className="flex-1">
                  <label className="block font-bold text-gray-500 mb-1">Thêm sản phẩm cần nhập</label>
                  <select
                    value={selectedProductToAdd}
                    onChange={(e) => setSelectedProductToAdd(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-2.5 py-1.5 bg-white text-xs text-gray-800"
                  >
                    <option value="">-- Chọn sản phẩm --</option>
                    {data.San_pham.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.ten_san_pham} - Giá vốn: {formatCurrency(p.gia_von)} (Kho: {p.ton_kho})
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={handleAddProductToEditImport}
                  disabled={!selectedProductToAdd}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs px-4 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-1 shrink-0 h-[34px]"
                >
                  <Plus className="h-4 w-4" /> Thêm hàng nhập
                </button>
              </div>

              <div>
                <h4 className="font-bold text-gray-800 mb-2 border-b pb-1">Chi tiết hàng và giá nhập</h4>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b text-gray-500 font-semibold">
                        <th className="py-2 px-3">Sản phẩm</th>
                        <th className="py-2 px-3 w-28 text-right">Số lượng</th>
                        <th className="py-2 px-3 w-32 text-right">Giá nhập gốc</th>
                        <th className="py-2 px-3 w-32 text-right">Thành tiền</th>
                        <th className="py-2 px-3 w-16 text-center">Xóa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y bg-white">
                      {editingImport.chi_tiet_nhap.map((detail, idx) => {
                        const prod = data.San_pham.find(p => p.id === (detail.id_sp || (detail as any).id_san_pham));
                        return (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="py-2 px-3">
                              <div className="font-semibold text-slate-800">{prod ? prod.ten_san_pham : "Không rõ"}</div>
                              <div className="text-[10px] text-gray-400 font-mono">{detail.id_sp || (detail as any).id_san_pham}</div>
                            </td>
                            <td className="py-2 px-3">
                              <div className="flex items-center gap-1 justify-end">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const nextQty = Math.max(1, detail.so_luong - 1);
                                    detail.so_luong = nextQty;
                                    detail.thanh_tien = nextQty * detail.gian_nhap;
                                    setEditingImport({ ...editingImport });
                                  }}
                                  className="p-1 rounded-md border hover:bg-slate-100"
                                >
                                  <Minus className="h-3 w-3" />
                                </button>
                                <input
                                  type="number"
                                  min="1"
                                  value={detail.so_luong}
                                  onChange={(e) => {
                                    const val = Math.max(1, Number(e.target.value));
                                    detail.so_luong = val;
                                    detail.thanh_tien = val * detail.gian_nhap;
                                    setEditingImport({ ...editingImport });
                                  }}
                                  className="w-12 text-center border rounded py-0.5 font-bold"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const nextQty = detail.so_luong + 1;
                                    detail.so_luong = nextQty;
                                    detail.thanh_tien = nextQty * detail.gian_nhap;
                                    setEditingImport({ ...editingImport });
                                  }}
                                  className="p-1 rounded-md border hover:bg-slate-100"
                                >
                                  <Plus className="h-3 w-3" />
                                </button>
                              </div>
                            </td>
                            <td className="py-2 px-3">
                              <input
                                type="number"
                                min="0"
                                value={detail.gian_nhap}
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  detail.gian_nhap = val;
                                  detail.thanh_tien = detail.so_luong * val;
                                  setEditingImport({ ...editingImport });
                                }}
                                className="w-full text-right border rounded py-0.5 font-mono px-1"
                              />
                            </td>
                            <td className="py-2 px-3 text-right font-bold font-mono text-slate-800">
                              {formatCurrency(detail.thanh_tien)}
                            </td>
                            <td className="py-2 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => {
                                  editingImport.chi_tiet_nhap = editingImport.chi_tiet_nhap.filter((_, i) => i !== idx);
                                  setEditingImport({ ...editingImport });
                                }}
                                className="text-rose-500 hover:text-rose-700 p-1 rounded-md hover:bg-rose-50 transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Total Summary */}
              <div className="flex justify-end pt-2">
                <div className="w-72 space-y-2 border-t pt-3 font-semibold text-gray-700">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Tạm tính tổng tiền nhập:</span>
                    <span>{formatCurrency(editingImport.chi_tiet_nhap.reduce((acc, d) => acc + d.thanh_tien, 0))}</span>
                  </div>
                  <div className="flex justify-between text-xs text-emerald-600">
                    <span>Đã trả nhà cung cấp:</span>
                    <span>{formatCurrency(editingImport.da_thanh_toan)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-rose-600 border-t pt-1">
                    <span>Còn nợ nhà cung cấp:</span>
                    <span>{formatCurrency(Math.max(0, editingImport.chi_tiet_nhap.reduce((acc, d) => acc + d.thanh_tien, 0) - editingImport.da_thanh_toan))}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 border-t px-5 py-3.5 flex justify-end gap-2 shrink-0">
              <button 
                type="button"
                onClick={() => setEditingImport(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-bold text-xs cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button 
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold text-xs cursor-pointer"
              >
                Lưu phiếu
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
