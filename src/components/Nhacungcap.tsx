import React, { useState } from "react";
import {
  Truck,
  Plus,
  Search,
  Trash2,
  Edit,
  X,
  Archive,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { DatabaseSchema } from "../types";

interface NhacungcapProps {
  data: DatabaseSchema;
  onRefreshData: () => void;
}

export default function Nhacungcap({ data, onRefreshData }: NhacungcapProps) {
  const [supplierSearch, setSupplierSearch] = useState("");
  const [supplierMinDebtFilter, setSupplierMinDebtFilter] = useState("");
  const [supplierMaxDebtFilter, setSupplierMaxDebtFilter] = useState("");

  const [newSupName, setNewSupName] = useState("");
  const [newSupContact, setNewSupContact] = useState("");
  const [newSupPhone, setNewSupPhone] = useState("");
  const [newSupEmail, setNewSupEmail] = useState("");
  const [newSupAddress, setNewSupAddress] = useState("");
  const [newSupDebt, setNewSupDebt] = useState("");

  const [supplierPageSize, setSupplierPageSize] = useState<number>(15);
  const [supplierCurrentPage, setSupplierCurrentPage] = useState<number>(1);

  // Edit Supplier state
  const [editingSupplier, setEditingSupplier] = useState<any | null>(null);

  const handleEditSupplierSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSupplier) return;
    const updated = { ...data };
    updated.Nha_cung_cap = updated.Nha_cung_cap.map(s => 
      s.id === editingSupplier.id ? {
        ...s,
        ten_nha_cung_cap: editingSupplier.ten_nha_cung_cap.trim(),
        nguoi_lien_he: editingSupplier.nguoi_lien_he.trim(),
        so_dien_thoai: editingSupplier.so_dien_thoai.trim(),
        email: editingSupplier.email.trim(),
        dia_chi: editingSupplier.dia_chi.trim(),
        cong_no_hien_tai: Number(editingSupplier.cong_no_hien_tai || 0)
      } : s
    );

    try {
      const res = await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated)
      });
      if ((await res.json()).success) {
        onRefreshData();
        setEditingSupplier(null);
      } else {
        alert("Cập nhật nhà cung cấp thất bại!");
      }
    } catch (e) {
      console.error(e);
      alert("Lỗi kết nối máy chủ!");
    }
  };

  React.useEffect(() => {
    setSupplierCurrentPage(1);
  }, [supplierSearch, supplierMinDebtFilter, supplierMaxDebtFilter, supplierPageSize]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("vi-VN").format(val);
  };

  const handleAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupName.trim()) return;
    try {
      const res = await fetch("/api/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ten_nha_cung_cap: newSupName.trim(),
          nguoi_lien_he: newSupContact.trim(),
          so_dien_thoai: newSupPhone.trim(),
          email: newSupEmail.trim(),
          dia_chi: newSupAddress.trim(),
          cong_no_hien_tai: Number(newSupDebt) || 0
        })
      });
      if ((await res.json()).success) {
        setNewSupName("");
        setNewSupContact("");
        setNewSupPhone("");
        setNewSupEmail("");
        setNewSupAddress("");
        setNewSupDebt("");
        onRefreshData();
      }
    } catch (e) {
      console.error(e);
      alert("Lỗi khi thêm nhà cung cấp");
    }
  };

  const handleDeleteSupplier = async (id: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa đối tác này (${id}) khỏi hệ thống?`)) return;
    
    const updated = { ...data };
    updated.Nha_cung_cap = updated.Nha_cung_cap.filter(s => s.id !== id);

    try {
      const res = await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated)
      });
      if ((await res.json()).success) {
        onRefreshData();
      } else {
        alert("Xóa thất bại!");
      }
    } catch (e) {
      console.error(e);
      alert("Lỗi kết nối máy chủ");
    }
  };

  const filteredSuppliers = data.Nha_cung_cap.filter((s) => {
    const q = supplierSearch.toLowerCase().trim();
    const matchesSearch =
      !q ||
      s.ten_nha_cung_cap.toLowerCase().includes(q) ||
      s.nguoi_lien_he.toLowerCase().includes(q) ||
      s.so_dien_thoai.includes(q);

    const min = supplierMinDebtFilter ? Number(supplierMinDebtFilter) : null;
    const max = supplierMaxDebtFilter ? Number(supplierMaxDebtFilter) : null;
    const matchesMin = min === null || s.cong_no_hien_tai >= min;
    const matchesMax = max === null || s.cong_no_hien_tai <= max;

    return matchesSearch && matchesMin && matchesMax;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Truck className="h-5 w-5 text-blue-500" />
            Quản lý Đối tác Cung cấp
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Danh mục, thông tin liên hệ và quản lý công nợ nhà cung cấp.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Left Side: Supplier List */}
        <div className="xl:col-span-3 bg-white rounded-xl shadow-xs border overflow-hidden flex flex-col h-[732px]">
  {/* Header tiêu đề bảng */}
  <div className="p-4 border-b bg-gray-50/50 flex justify-between items-center h-[40px] shrink-0">
    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
      Danh mục Nhà cung cấp ({filteredSuppliers.length})
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
          <th className="py-2 px-4 w-24">Mã số</th>
          <th className="py-2 px-4 w-56">Tên Nhà cung cấp</th>
          <th className="py-2 px-4 w-44">Người liên hệ</th>
          <th className="py-2 px-4">Số điện thoại</th>
          <th className="py-2 px-4 text-right w-44">Công nợ hiện tại</th>
          <th className="py-2 px-4 text-center w-28">Hành động</th>
        </tr>
      </thead>
      <tbody className="text-xs text-gray-700 bg-white">
        {(() => {
          const totalItems = filteredSuppliers.length;
          const totalPages = Math.ceil(totalItems / supplierPageSize) || 1;
          const safeCurrentPage = Math.max(1, Math.min(supplierCurrentPage, totalPages));
          const paginatedSuppliers = filteredSuppliers.slice(
            (safeCurrentPage - 1) * supplierPageSize,
            safeCurrentPage * supplierPageSize
          );

          return (
            <>
              {paginatedSuppliers.map((s) => (
                <tr key={s.id} className="border-b text-base last:border-0 hover:bg-slate-100/50 transition-colors h-[42px]">
                  <td className="py-1 px-4 font-mono font-semibold text-blue-600 truncate">{s.id}</td>
                  <td className="py-1 px-4 font-bold text-gray-900 truncate">{s.ten_nha_cung_cap}</td>
                  <td className="py-1 px-4 font-medium text-slate-700 truncate">{s.nguoi_lien_he}</td>
                  <td className="py-1 px-4">
                    <div className="flex items-center gap-3 text-gray-500">
                      <span className="font-mono text-gray-600 shrink-0">{s.so_dien_thoai}</span>
                    </div>
                  </td>
                  <td className="py-1 px-4 text-right font-medium text-rose-600">
                    {formatCurrency(s.cong_no_hien_tai)}
                  </td>
                  <td className="py-1 px-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => setEditingSupplier(s)}
                        className="p-1 rounded-full text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                        title="Sửa nhà cung cấp"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteSupplier(s.id)}
                        className="p-1 rounded-full text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Xóa nhà cung cấp"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {/* Bù dòng trống không có đường kẻ để khít giao diện 15 dòng */}
              {paginatedSuppliers.length > 0 && paginatedSuppliers.length < 15 && (
                Array.from({ length: 15 - paginatedSuppliers.length }).map((_, index) => (
                  <tr key={`empty-supplier-${index}`} className="h-[42px] border-none">
                    <td colSpan={6}></td>
                  </tr>
                ))
              )}

              {/* Trạng thái danh sách trống mượt mà với Icon */}
              {totalItems === 0 && (
                <tr className="h-[590px] border-none">
                  <td colSpan={6} className="text-center text-gray-400 font-medium vertical-middle">
                    <div className="flex flex-col items-center justify-center h-full gap-2">
                      <Archive className="h-8 w-8 text-gray-300" />
                      <span>Không tìm thấy nhà cung cấp nào khớp bộ lọc</span>
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
    const totalItems = filteredSuppliers.length;
    const totalPages = Math.ceil(totalItems / supplierPageSize) || 1;
    const safeCurrentPage = Math.max(1, Math.min(supplierCurrentPage, totalPages));

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
            value={supplierPageSize}
            onChange={(e) => setSupplierPageSize(Number(e.target.value))}
            className="rounded-md border border-gray-300 bg-white px-2 py-1 focus:border-blue-500 focus:outline-hidden text-gray-700 cursor-pointer text-xs font-semibold"
          >
            <option value={15}>15 dòng</option>
            <option value={30}>30 dòng</option>
            <option value={50}>50 dòng</option>
            <option value={100}>100 dòng</option>
          </select>
          <span className="text-gray-400">|</span>
          <span>
            Hiển thị {totalItems > 0 ? (safeCurrentPage - 1) * supplierPageSize + 1 : 0} - {Math.min(safeCurrentPage * supplierPageSize, totalItems)} trong {totalItems} dòng
          </span>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSupplierCurrentPage(1)}
              disabled={safeCurrentPage === 1}
              className="p-1 rounded-md border border-gray-300 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-white transition-colors cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" style={{ strokeWidth: 3 }} />
            </button>
            <button
              onClick={() => setSupplierCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={safeCurrentPage === 1}
              className="p-1 rounded-md border border-gray-300 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-white transition-colors cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {getPageNumbers().map((p, idx) => {
              if (p === "...") {
                return (
                  <span key={`dots-supplier-${idx}`} className="px-2 py-1 text-gray-400 select-none">
                    ...
                  </span>
                );
              }
              return (
                <button
                  key={`supplier-page-btn-${p}`}
                  onClick={() => setSupplierCurrentPage(p)}
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
              onClick={() => setSupplierCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={safeCurrentPage === totalPages}
              className="p-1 rounded-md border border-gray-300 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-white transition-colors cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => setSupplierCurrentPage(totalPages)}
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

        {/* Right Side: Filters and Create Form */}
        <div className="space-y-6">
          {/* Form Tạo Mới */}
          <div className="bg-white rounded-xl shadow-xs border p-4 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 border-b pb-2">
              <Plus className="h-4 w-4 text-blue-500" />
              Tạo Nhà cung cấp mới
            </h3>
            <form onSubmit={handleAddSupplier} className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-500 mb-1 font-medium">Tên nhà cung cấp *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Công ty Dược phẩm XYZ..."
                  value={newSupName}
                  onChange={(e) => setNewSupName(e.target.value)}
                  className="w-full rounded-md border border-gray-300 py-1.5 px-2.5 focus:border-blue-500 focus:outline-hidden bg-white text-gray-800"
                />
              </div>
              <div>
                <label className="block text-gray-500 mb-1 font-medium">Người liên hệ</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Nguyễn Văn A..."
                  value={newSupContact}
                  onChange={(e) => setNewSupContact(e.target.value)}
                  className="w-full rounded-md border border-gray-300 py-1.5 px-2.5 focus:border-blue-500 focus:outline-hidden bg-white text-gray-800"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-500 mb-1 font-medium">Số điện thoại</label>
                  <input
                    type="text"
                    placeholder="SĐT..."
                    value={newSupPhone}
                    onChange={(e) => setNewSupPhone(e.target.value)}
                    className="w-full rounded-md border border-gray-300 py-1.5 px-2.5 focus:border-blue-500 focus:outline-hidden bg-white text-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-gray-500 mb-1 font-medium">Email</label>
                  <input
                    type="email"
                    placeholder="Email..."
                    value={newSupEmail}
                    onChange={(e) => setNewSupEmail(e.target.value)}
                    className="w-full rounded-md border border-gray-300 py-1.5 px-2.5 focus:border-blue-500 focus:outline-hidden bg-white text-gray-800"
                  />
                </div>
              </div>
              <div>
                <label className="block text-gray-500 mb-1 font-medium">Địa chỉ</label>
                <input
                  type="text"
                  placeholder="Địa chỉ..."
                  value={newSupAddress}
                  onChange={(e) => setNewSupAddress(e.target.value)}
                  className="w-full rounded-md border border-gray-300 py-1.5 px-2.5 focus:border-blue-500 focus:outline-hidden bg-white text-gray-800"
                />
              </div>
              <div>
                <label className="block text-gray-500 mb-1 font-medium">Nợ ban đầu (nếu có)</label>
                <input
                  type="number"
                  placeholder="Đồng..."
                  value={newSupDebt}
                  onChange={(e) => setNewSupDebt(e.target.value)}
                  className="w-full rounded-md border border-gray-300 py-1.5 px-2.5 focus:border-blue-500 focus:outline-hidden bg-white text-gray-800 font-mono"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg shadow-sm cursor-pointer transition-colors uppercase tracking-wider text-[10px]"
              >
                Thêm đối tác mới
              </button>
            </form>
          </div>

          {/* Tìm kiếm & Lọc */}
          <div className="bg-white rounded-xl shadow-xs border p-4 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 border-b pb-2">
              <Search className="h-4 w-4 text-blue-500" />
              Tìm kiếm & Bộ lọc
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Từ khóa tìm kiếm</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-gray-400">
                    <Search className="h-3.5 w-3.5" />
                  </span>
                  <input
                    type="text"
                    placeholder="Tìm theo tên, SĐT, liên hệ..."
                    value={supplierSearch}
                    onChange={(e) => setSupplierSearch(e.target.value)}
                    className="w-full rounded-md border border-gray-300 py-1.5 pl-8 pr-2.5 focus:border-blue-500 focus:outline-hidden bg-white text-gray-800"
                  />
                </div>
              </div>

              {/* Lọc nợ */}
              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Công nợ hiện tại</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="Từ..."
                    value={supplierMinDebtFilter}
                    onChange={(e) => setSupplierMinDebtFilter(e.target.value)}
                    className="w-full text-xs rounded-md border border-gray-300 py-1 px-2 focus:border-blue-500 focus:outline-hidden bg-white text-gray-800"
                  />
                  <input
                    type="number"
                    placeholder="Đến..."
                    value={supplierMaxDebtFilter}
                    onChange={(e) => setSupplierMaxDebtFilter(e.target.value)}
                    className="w-full text-xs rounded-md border border-gray-300 py-1 px-2 focus:border-blue-500 focus:outline-hidden bg-white text-gray-800"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Dialog: Edit Supplier Info */}
      {editingSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl overflow-hidden animate-in zoom-in-95 duration-150 border border-slate-200 flex flex-col">
            <div className="flex items-center justify-between bg-slate-50 border-b border-slate-150 px-5 py-3.5 text-slate-800">
              <div className="flex items-center gap-2">
                <Truck className="h-4.5 w-4.5 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-800">Chỉnh sửa thông tin nhà cung cấp</h3>
              </div>
              <button 
                type="button"
                onClick={() => setEditingSupplier(null)} 
                className="rounded-full p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleEditSupplierSave} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-500 mb-1">Mã nhà cung cấp</label>
                <input
                  type="text"
                  disabled
                  value={editingSupplier.id}
                  className="w-full rounded-md border border-slate-200 bg-slate-100 px-3 py-1.5 font-mono text-slate-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-500 mb-1">Tên Nhà cung cấp *</label>
                <input
                  type="text"
                  required
                  value={editingSupplier.ten_nha_cung_cap}
                  onChange={(e) => setEditingSupplier({ ...editingSupplier, ten_nha_cung_cap: e.target.value })}
                  className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-slate-800 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-500 mb-1">Người liên hệ</label>
                <input
                  type="text"
                  value={editingSupplier.nguoi_lien_he || ""}
                  onChange={(e) => setEditingSupplier({ ...editingSupplier, nguoi_lien_he: e.target.value })}
                  className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-500 mb-1">Số điện thoại</label>
                  <input
                    type="text"
                    value={editingSupplier.so_dien_thoai || ""}
                    onChange={(e) => setEditingSupplier({ ...editingSupplier, so_dien_thoai: e.target.value })}
                    className="w-full rounded-md border border-slate-300 px-3 py-1.5 font-mono text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-500 mb-1">Email</label>
                  <input
                    type="email"
                    value={editingSupplier.email || ""}
                    placeholder="Nhập email..."
                    onChange={(e) => setEditingSupplier({ ...editingSupplier, email: e.target.value })}
                    className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-500 mb-1">Địa chỉ</label>
                <input
                  type="text"
                  value={editingSupplier.dia_chi || ""}
                  placeholder="Nhập địa chỉ..."
                  onChange={(e) => setEditingSupplier({ ...editingSupplier, dia_chi: e.target.value })}
                  className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-500 mb-1">Công nợ hiện tại (VND)</label>
                <input
                  type="number"
                  value={editingSupplier.cong_no_hien_tai || 0}
                  onChange={(e) => setEditingSupplier({ ...editingSupplier, cong_no_hien_tai: Number(e.target.value) })}
                  className="w-full rounded-md border border-slate-300 px-3 py-1.5 font-mono text-rose-600 font-bold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingSupplier(null)}
                  className="rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 font-bold cursor-pointer transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 font-bold cursor-pointer transition-colors"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
