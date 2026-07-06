import React, { useState } from "react";
import {
  FileText,
  Search,
  Plus,
  Eye,
  Trash2,
  Edit,
  X,
  Minus,
  Archive,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { DatabaseSchema, ReturnSupplierOrder } from "../types";

interface TrahangnccProps {
  data: DatabaseSchema;
  onRefreshData: () => void;
  onCreateNewClick?: () => void;
}

export default function Trahangncc({ data, onRefreshData, onCreateNewClick }: TrahangnccProps) {
  // Filter & Search List State
  const [supplierReturnSearch, setSupplierReturnSearch] = useState("");
  const [returnPageSize, setReturnPageSize] = useState<number>(15);
  const [returnCurrentPage, setReturnCurrentPage] = useState<number>(1);

  // View, Edit, Delete States
  const [viewingReturnNCC, setViewingReturnNCC] = useState<ReturnSupplierOrder | null>(null);
  const [editingReturnNCC, setEditingReturnNCC] = useState<ReturnSupplierOrder | null>(null);
  const [selectedProductToAdd, setSelectedProductToAdd] = useState("");

  const handleSaveEditedReturnNCC = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReturnNCC) return;

    const oldReturn = data.Tra_hang_NCC.find(r => r.id === editingReturnNCC.id);
    const updatedDb = { ...data };

    // Restore old quantities to stock
    if (oldReturn) {
      oldReturn.chi_tiet_tra.forEach(oldDetail => {
        const prod = updatedDb.San_pham.find(p => p.id === (oldDetail.id_sp || (oldDetail as any).id_san_pham));
        if (prod) {
          prod.ton_kho += oldDetail.so_luong;
        }
      });
    }

    // Apply new quantities
    let newTotalRefund = 0;
    editingReturnNCC.chi_tiet_tra.forEach((newDetail) => {
      const prod = updatedDb.San_pham.find(p => p.id === (newDetail.id_sp || (newDetail as any).id_san_pham));
      if (prod) {
        prod.ton_kho -= newDetail.so_luong;
      }
      newTotalRefund += newDetail.so_luong * newDetail.gia_tra_lai;
    });

    editingReturnNCC.tong_tien_ncc_hoan = newTotalRefund;

    // Update list
    updatedDb.Tra_hang_NCC = updatedDb.Tra_hang_NCC.map(r => 
      r.id === editingReturnNCC.id ? editingReturnNCC : r
    );

    try {
      const res = await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedDb)
      });
      if ((await res.json()).success) {
        onRefreshData();
        setEditingReturnNCC(null);
      } else {
        alert("Lưu phiếu trả hàng NCC thất bại!");
      }
    } catch (err) {
      console.error(err);
      alert("Lỗi kết nối!");
    }
  };

  const handleDeleteReturnNCC = async (id: string) => {
    if (!confirm(`Bạn có chắc muốn xóa phiếu trả hàng NCC ${id}? Số lượng hàng trả sẽ được hoàn nhập vào tồn kho của hệ thống.`)) return;

    const oldReturn = data.Tra_hang_NCC.find(r => r.id === id);
    const updatedDb = { ...data };

    if (oldReturn) {
      oldReturn.chi_tiet_tra.forEach(detail => {
        const prod = updatedDb.San_pham.find(p => p.id === (detail.id_sp || (detail as any).id_san_pham));
        if (prod) {
          prod.ton_kho += detail.so_luong;
        }
      });
    }

    updatedDb.Tra_hang_NCC = updatedDb.Tra_hang_NCC.filter(r => r.id !== id);

    try {
      const res = await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedDb)
      });
      if ((await res.json()).success) {
        onRefreshData();
      } else {
        alert("Xóa phiếu thất bại!");
      }
    } catch (err) {
      console.error(err);
      alert("Lỗi kết nối!");
    }
  };

  const handleAddProductToEditReturnNCC = () => {
    if (!selectedProductToAdd || !editingReturnNCC) return;
    const prod = data.San_pham.find(p => p.id === selectedProductToAdd);
    if (!prod) return;

    const existingDetailIndex = editingReturnNCC.chi_tiet_tra.findIndex(d => d.id_sp === prod.id);
    const updatedDetails = [...editingReturnNCC.chi_tiet_tra];

    if (existingDetailIndex >= 0) {
      updatedDetails[existingDetailIndex].so_luong += 1;
      updatedDetails[existingDetailIndex].thanh_tien = 
        updatedDetails[existingDetailIndex].so_luong * updatedDetails[existingDetailIndex].gia_tra_lai;
    } else {
      updatedDetails.push({
        id_sp: prod.id,
        so_luong: 1,
        gia_tra_lai: prod.gia_von,
        thanh_tien: prod.gia_von
      });
    }

    setEditingReturnNCC({
      ...editingReturnNCC,
      chi_tiet_tra: updatedDetails
    });
    setSelectedProductToAdd("");
  };

  React.useEffect(() => {
    setReturnCurrentPage(1);
  }, [supplierReturnSearch, returnPageSize]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("vi-VN").format(val);
  };

  const filteredReturns = (data.Tra_hang_NCC || []).filter((ret) => {
    const s = data.Nha_cung_cap.find((sup) => sup.id === ret.id_nha_cung_cap);
    const sName = s ? s.ten_nha_cung_cap.toLowerCase() : "";
    const q = supplierReturnSearch.toLowerCase().trim();
    return !q || ret.id.toLowerCase().includes(q) || sName.includes(q) || (ret.id_phieu_nhap_goc && ret.id_phieu_nhap_goc.toLowerCase().includes(q));
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <FileText className="h-5 w-5 text-rose-500" />
            Quản lý Trả hàng NCC
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Lập phiếu trả hàng nhà cung cấp và theo dõi lịch sử hoàn tiền / công nợ.
          </p>
        </div>
      </div>

      {/* Main Table & Logs list view */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Left Side: Table */}
        <div className="xl:col-span-3 bg-white rounded-xl shadow-xs border overflow-hidden flex flex-col h-[732px]">
  {/* Header tiêu đề bảng */}
  <div className="p-4 border-b bg-gray-50/50 flex justify-between items-center h-[40px] shrink-0">
    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
      Nhật ký Phiếu Trả Hàng Nhà Cung Cấp ({filteredReturns.length})
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
          <th className="py-2 px-4 w-32">Số phiếu trả</th>
          <th className="py-2 px-4 w-32">Phiếu gốc</th>
          <th className="py-2 px-4">Nhà cung cấp</th>
          <th className="py-2 px-4 w-44">Ngày thực hiện</th>
          <th className="py-2 px-4 text-right w-40">Tiền đối tác hoàn</th>
          <th className="py-2 px-4 w-40">Hình thức hoàn nợ</th>
          <th className="py-2 px-4 text-center w-28">Hành động</th>
        </tr>
      </thead>
      <tbody className="text-xs text-gray-700 bg-white">
        {(() => {
          const totalItems = filteredReturns.length;
          const totalPages = Math.ceil(totalItems / returnPageSize) || 1;
          const safeCurrentPage = Math.max(1, Math.min(returnCurrentPage, totalPages));
          const paginatedReturns = filteredReturns.slice(
            (safeCurrentPage - 1) * returnPageSize,
            safeCurrentPage * returnPageSize
          );

          return (
            <>
              {paginatedReturns.map((ret) => {
                const s = data.Nha_cung_cap.find((sup) => sup.id === ret.id_nha_cung_cap);
                return (
                  <tr key={ret.id} className="border-b text-base last:border-0 hover:bg-slate-100/50 transition-colors h-[42px]">
                    <td className="py-1 px-4 font-mono font-bold text-rose-600 truncate">{ret.id}</td>
                    <td className="py-1 px-4 font-mono text-slate-500 truncate">{ret.id_phieu_nhap_goc || "Không có"}</td>
                    <td className="py-1 px-4 font-bold text-slate-900 truncate max-w-[200px]">
                      {s ? s.ten_nha_cung_cap : ret.id_nha_cung_cap}
                    </td>
                    <td className="py-1 px-4 text-gray-500">
                      {new Date(ret.ngay_tra).toLocaleDateString("vi-VN") +
                        " " +
                        new Date(ret.ngay_tra).toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                    </td>
                    <td className="py-1 px-4 text-right font-bold text-rose-500">
                      {formatCurrency(ret.tong_tien_ncc_hoan)}
                    </td>
                    <td className="py-1 px-4 font-semibold text-slate-600 truncate">
                      {ret.tinh_trang_hoan_tien}
                    </td>
                    <td className="py-1 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setViewingReturnNCC(ret)}
                          className="p-1 rounded-full text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                          title="Xem chi tiết"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingReturnNCC(JSON.parse(JSON.stringify(ret)))}
                          className="p-1 rounded-full text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                          title="Sửa phiếu"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteReturnNCC(ret.id)}
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

              {/* Bù dòng trống không có đường kẻ để khít giao diện 15 dòng */}
              {paginatedReturns.length > 0 && paginatedReturns.length < 15 && (
                Array.from({ length: 15 - paginatedReturns.length }).map((_, index) => (
                  <tr key={`empty-return-${index}`} className="h-[42px] border-none">
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
                      <span>Chưa có phiếu trả hàng nhà cung cấp nào</span>
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
    const totalItems = filteredReturns.length;
    const totalPages = Math.ceil(totalItems / returnPageSize) || 1;
    const safeCurrentPage = Math.max(1, Math.min(returnCurrentPage, totalPages));

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
            value={returnPageSize}
            onChange={(e) => setReturnPageSize(Number(e.target.value))}
            className="rounded-md border border-gray-300 bg-white px-2 py-1 focus:border-blue-500 focus:outline-hidden text-gray-700 cursor-pointer text-xs font-semibold"
          >
            <option value={15}>15 dòng</option>
            <option value={30}>30 dòng</option>
            <option value={50}>50 dòng</option>
            <option value={100}>100 dòng</option>
          </select>
          <span className="text-gray-400">|</span>
          <span>
            Hiển thị {totalItems > 0 ? (safeCurrentPage - 1) * returnPageSize + 1 : 0} - {Math.min(safeCurrentPage * returnPageSize, totalItems)} trong {totalItems} dòng
          </span>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setReturnCurrentPage(1)}
              disabled={safeCurrentPage === 1}
              className="p-1 rounded-md border border-gray-300 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-white transition-colors cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" style={{ strokeWidth: 3 }} />
            </button>
            <button
              onClick={() => setReturnCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={safeCurrentPage === 1}
              className="p-1 rounded-md border border-gray-300 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-white transition-colors cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {getPageNumbers().map((p, idx) => {
              if (p === "...") {
                return (
                  <span key={`dots-return-${idx}`} className="px-2 py-1 text-gray-400 select-none">
                    ...
                  </span>
                );
              }
              return (
                <button
                  key={`return-page-btn-${p}`}
                  onClick={() => setReturnCurrentPage(p)}
                  className={`px-2.5 py-1 rounded-md border text-xs transition-colors cursor-pointer font-semibold ${
                    safeCurrentPage === p
                      ? "bg-rose-600 border-rose-600 text-white"
                      : "border-gray-300 bg-white text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {p}
                </button>
              );
            })}

            <button
              onClick={() => setReturnCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={safeCurrentPage === totalPages}
              className="p-1 rounded-md border border-gray-300 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-white transition-colors cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => setReturnCurrentPage(totalPages)}
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

        {/* Right Side: Filters & Actions */}
        <div className="space-y-6">
          {/* Lập phiếu trả hàng NCC mới Button Card */}
          <div className="bg-white rounded-xl shadow-xs border p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b pb-2">
              Thao tác trả hàng
            </h3>
            <button
              onClick={() => {
                if (data.San_pham.length === 0) {
                  return alert("Cần có sản phẩm trong hệ thống trước khi làm phiếu trả hàng!");
                }
                if (onCreateNewClick) {
                  onCreateNewClick();
                }
              }}
              className="w-full flex items-center justify-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold py-2.5 rounded-lg transition-all shadow-sm cursor-pointer"
            >
              <Plus className="h-4.5 w-4.5" />
              Lập phiếu trả hàng NCC mới
            </button>
          </div>

          {/* Filters & Search */}
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
                    placeholder="Nhập mã phiếu, tên đối tác..."
                    value={supplierReturnSearch}
                    onChange={(e) => setSupplierReturnSearch(e.target.value)}
                    className="w-full rounded-md border border-gray-300 py-1.5 pl-8 pr-2.5 focus:border-blue-500 focus:outline-hidden bg-white text-gray-800"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Info card */}
          <div className="bg-slate-50 rounded-xl p-4 border text-xs text-slate-600 space-y-2">
            <h4 className="font-bold text-slate-700 uppercase tracking-wide text-[10px]">
              ⚠️ Ghi chú đối soát
            </h4>
            <p className="leading-relaxed text-gray-500">
              Mỗi phiếu trả hàng nhà cung cấp đều khấu trừ trực tiếp vào **Công nợ hiện tại** của nhà
              cung cấp đó hoặc nhận hoàn tiền bằng tiền mặt / chuyển khoản.
            </p>
          </div>
        </div>
      </div>

      {/* VIEW SUPPLIER RETURN MODAL */}
      {viewingReturnNCC && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl overflow-hidden animate-in zoom-in-95 duration-150 border border-slate-200 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between bg-slate-50 border-b border-slate-150 px-5 py-3.5 text-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-rose-600" />
                <h3 className="text-sm font-bold text-slate-800">Chi tiết phiếu trả hàng NCC {viewingReturnNCC.id}</h3>
              </div>
              <button 
                onClick={() => setViewingReturnNCC(null)} 
                className="rounded-full p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto text-xs text-gray-700">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border">
                <div>
                  <p className="mb-1"><span className="font-semibold text-gray-500">Ngày trả hàng:</span> {new Date(viewingReturnNCC.ngay_tra).toLocaleString("vi-VN")}</p>
                  <p className="mb-1">
                    <span className="font-semibold text-gray-500">Nhà cung cấp:</span> {
                      data.Nha_cung_cap.find(s => s.id === viewingReturnNCC.id_nha_cung_cap)?.ten_nha_cung_cap || viewingReturnNCC.id_nha_cung_cap
                    }
                  </p>
                  <p><span className="font-semibold text-gray-500">Phiếu nhập gốc:</span> <span className="font-mono font-bold text-blue-600">{viewingReturnNCC.id_phieu_nhap_goc || "Không có"}</span></p>
                </div>
                <div>
                  <p className="mb-1">
                    <span className="font-semibold text-gray-500">Nhân viên thực hiện:</span> {
                      data.Nhan_vien.find(e => e.id === viewingReturnNCC.id_nhan_vien_thuc_hien)?.ho_ten || viewingReturnNCC.id_nhan_vien_thuc_hien
                    }
                  </p>
                  <p className="mb-1"><span className="font-semibold text-gray-500">Hình thức hoàn tiền:</span> {viewingReturnNCC.tinh_trang_hoan_tien || "Chưa hoàn tiền"}</p>
                  <p><span className="font-semibold text-gray-500">Lý do trả hàng:</span> {viewingReturnNCC.ly_do_tra || "Không có"}</p>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-gray-800 mb-2 border-b pb-1">Chi tiết danh sách trả hàng</h4>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b text-gray-500 font-semibold">
                        <th className="py-2 px-3 w-12 text-center">STT</th>
                        <th className="py-2 px-3">Mã hàng</th>
                        <th className="py-2 px-3">Tên sản phẩm</th>
                        <th className="py-2 px-3 text-right">Số lượng trả</th>
                        <th className="py-2 px-3 text-right">Giá trả lại gốc</th>
                        <th className="py-2 px-3 text-right">Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {viewingReturnNCC.chi_tiet_tra.map((detail, idx) => {
                        const prod = data.San_pham.find(p => p.id === (detail.id_sp || (detail as any).id_san_pham));
                        return (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="py-2 px-3 text-center text-gray-400">{idx + 1}</td>
                            <td className="py-2 px-3 font-mono font-medium">{detail.id_sp || (detail as any).id_san_pham}</td>
                            <td className="py-2 px-3 font-semibold text-slate-800">{prod ? prod.ten_san_pham : "Không rõ"}</td>
                            <td className="py-2 px-3 text-right font-semibold text-rose-600">{detail.so_luong}</td>
                            <td className="py-2 px-3 text-right">{formatCurrency(detail.gia_tra_lai)}</td>
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
                  <div className="flex justify-between text-rose-600 font-bold text-sm">
                    <span>Tổng tiền đối tác hoàn:</span>
                    <span>{formatCurrency(viewingReturnNCC.tong_tien_ncc_hoan)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 border-t px-5 py-3.5 flex justify-end">
              <button 
                onClick={() => setViewingReturnNCC(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-bold text-xs cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT SUPPLIER RETURN MODAL */}
      {editingReturnNCC && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <form onSubmit={handleSaveEditedReturnNCC} className="w-full max-w-3xl rounded-xl bg-white shadow-xl overflow-hidden animate-in zoom-in-95 duration-150 border border-slate-200 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between bg-slate-50 border-b border-slate-150 px-5 py-3.5 text-slate-800">
              <div className="flex items-center gap-2">
                <Edit className="h-5 w-5 text-amber-600" />
                <h3 className="text-sm font-bold text-slate-800">Sửa phiếu trả hàng NCC {editingReturnNCC.id}</h3>
              </div>
              <button 
                type="button"
                onClick={() => setEditingReturnNCC(null)} 
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
                    value={editingReturnNCC.id_nha_cung_cap}
                    onChange={(e) => setEditingReturnNCC({ ...editingReturnNCC, id_nha_cung_cap: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-2 py-1.5 focus:border-blue-500 bg-white font-semibold"
                  >
                    {data.Nha_cung_cap.map(s => (
                      <option key={s.id} value={s.id}>{s.ten_nha_cung_cap}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-400 mb-1">Nhân viên thực hiện</label>
                  <select
                    value={editingReturnNCC.id_nhan_vien_thuc_hien}
                    onChange={(e) => setEditingReturnNCC({ ...editingReturnNCC, id_nhan_vien_thuc_hien: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-2 py-1.5 focus:border-blue-500 bg-white"
                  >
                    {data.Nhan_vien.map(e => (
                      <option key={e.id} value={e.id}>{e.ho_ten}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-400 mb-1">Ngày thực hiện</label>
                  <input
                    type="text"
                    value={editingReturnNCC.ngay_tra}
                    onChange={(e) => setEditingReturnNCC({ ...editingReturnNCC, ngay_tra: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-2.5 py-1.5 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-400 mb-1">Phiếu gốc (Mã phiếu nhập)</label>
                  <input
                    type="text"
                    value={editingReturnNCC.id_phieu_nhap_goc || ""}
                    onChange={(e) => setEditingReturnNCC({ ...editingReturnNCC, id_phieu_nhap_goc: e.target.value })}
                    placeholder="Mã phiếu nhập kho gốc..."
                    className="w-full rounded-md border border-gray-300 px-2.5 py-1.5 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-400 mb-1">Hình thức hoàn tiền</label>
                  <select
                    value={editingReturnNCC.tinh_trang_hoan_tien || "Khấu trừ công nợ"}
                    onChange={(e) => setEditingReturnNCC({ ...editingReturnNCC, tinh_trang_hoan_tien: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-2 py-1.5 focus:border-blue-500 bg-white"
                  >
                    <option value="Khấu trừ công nợ">Khấu trừ công nợ</option>
                    <option value="Tiền mặt">Tiền mặt</option>
                    <option value="Chuyển khoản">Chuyển khoản</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-400 mb-1">Lý do trả hàng</label>
                  <input
                    type="text"
                    value={editingReturnNCC.ly_do_tra || ""}
                    onChange={(e) => setEditingReturnNCC({ ...editingReturnNCC, ly_do_tra: e.target.value })}
                    placeholder="Lỗi kỹ thuật, đổi hàng..."
                    className="w-full rounded-md border border-gray-300 px-2.5 py-1.5 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* ITEM ADDITION LINE FOR SUPPLIER RETURN */}
              <div className="bg-slate-50 p-3 rounded-lg border flex flex-col sm:flex-row sm:items-end gap-3">
                <div className="flex-1">
                  <label className="block font-bold text-gray-500 mb-1">Thêm sản phẩm muốn trả</label>
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
                  onClick={handleAddProductToEditReturnNCC}
                  disabled={!selectedProductToAdd}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs px-4 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-1 shrink-0 h-[34px]"
                >
                  <Plus className="h-4 w-4" /> Thêm hàng trả
                </button>
              </div>

              <div>
                <h4 className="font-bold text-gray-800 mb-2 border-b pb-1">Chi tiết hàng trả nhà cung cấp</h4>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b text-gray-500 font-semibold">
                        <th className="py-2 px-3">Sản phẩm</th>
                        <th className="py-2 px-3 w-28 text-right">Số lượng trả</th>
                        <th className="py-2 px-3 w-32 text-right">Giá trả gốc</th>
                        <th className="py-2 px-3 w-32 text-right">Thành tiền</th>
                        <th className="py-2 px-3 w-16 text-center">Xóa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y bg-white">
                      {editingReturnNCC.chi_tiet_tra.map((detail, idx) => {
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
                                    detail.thanh_tien = nextQty * detail.gia_tra_lai;
                                    setEditingReturnNCC({ ...editingReturnNCC });
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
                                    detail.thanh_tien = val * detail.gia_tra_lai;
                                    setEditingReturnNCC({ ...editingReturnNCC });
                                  }}
                                  className="w-12 text-center border rounded py-0.5 font-bold"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const nextQty = detail.so_luong + 1;
                                    detail.so_luong = nextQty;
                                    detail.thanh_tien = nextQty * detail.gia_tra_lai;
                                    setEditingReturnNCC({ ...editingReturnNCC });
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
                                value={detail.gia_tra_lai}
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  detail.gia_tra_lai = val;
                                  detail.thanh_tien = detail.so_luong * val;
                                  setEditingReturnNCC({ ...editingReturnNCC });
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
                                  editingReturnNCC.chi_tiet_tra = editingReturnNCC.chi_tiet_tra.filter((_, i) => i !== idx);
                                  setEditingReturnNCC({ ...editingReturnNCC });
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
                  <div className="flex justify-between text-rose-600 font-bold text-sm">
                    <span>Tổng tiền đối tác hoàn:</span>
                    <span>{formatCurrency(editingReturnNCC.chi_tiet_tra.reduce((acc, d) => acc + d.thanh_tien, 0))}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 border-t px-5 py-3.5 flex justify-end gap-2 shrink-0">
              <button 
                type="button"
                onClick={() => setEditingReturnNCC(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-bold text-xs cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button 
                type="submit"
                className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg font-bold text-xs cursor-pointer"
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
