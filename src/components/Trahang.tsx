import React, { useState, useEffect } from "react";
import {
  RotateCcw,
  Search,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Eye,
  Trash2,
  Edit,
  X,
  Plus,
  Minus,
  RefreshCw
} from "lucide-react";
import { DatabaseSchema, ReturnOrder } from "../types";

interface TrahangProps {
  data: DatabaseSchema;
  onRefreshData?: () => void;
}

export default function Trahang({ data, onRefreshData }: TrahangProps) {
  const [customerReturnSearch, setCustomerReturnSearch] = useState("");
  const [returnPageSize, setReturnPageSize] = useState<number>(15);
  const [returnCurrentPage, setReturnCurrentPage] = useState<number>(1);

  // Time filters like Invoice (Hoadon) page
  const [returnDateFilterType, setReturnDateFilterType] = useState<"all" | "predefined" | "range">("all");
  const [returnPredefinedDateRange, setReturnPredefinedDateRange] = useState<string>("all");
  const [returnCustomStartDate, setReturnCustomStartDate] = useState<string>("");
  const [returnCustomEndDate, setReturnCustomEndDate] = useState<string>("");

  // View, Edit, Delete States
  const [viewingReturn, setViewingReturn] = useState<ReturnOrder | null>(null);
  const [editingReturn, setEditingReturn] = useState<ReturnOrder | null>(null);
  const [selectedProductToAdd, setSelectedProductToAdd] = useState("");

  const handleSaveEditedReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReturn) return;

    const oldReturn = data.Tra_hang.find(r => r.id === editingReturn.id);
    const updatedDb = { ...data };

    // Restore old quantities to stock
    if (oldReturn) {
      oldReturn.chi_tiet_tra_hang.forEach(oldDetail => {
        const prod = updatedDb.San_pham.find(p => p.id === (oldDetail.id_sp || (oldDetail as any).id_san_pham));
        if (prod) {
          prod.ton_kho -= oldDetail.so_luong;
        }
      });
    }

    // Add new quantities to stock
    let newTotalRefund = 0;
    editingReturn.chi_tiet_tra_hang.forEach((newDetail) => {
      const prod = updatedDb.San_pham.find(p => p.id === (newDetail.id_sp || (newDetail as any).id_san_pham));
      if (prod) {
        prod.ton_kho += newDetail.so_luong;
      }
      newTotalRefund += newDetail.so_luong * newDetail.gia_tra;
    });

    editingReturn.tong_tien_tra = newTotalRefund;

    // Update inside list
    updatedDb.Tra_hang = updatedDb.Tra_hang.map(r => 
      r.id === editingReturn.id ? editingReturn : r
    );

    try {
      const res = await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedDb)
      });
      if ((await res.json()).success) {
        if (onRefreshData) onRefreshData();
        setEditingReturn(null);
      } else {
        alert("Có lỗi xảy ra khi lưu phiếu trả hàng!");
      }
    } catch (err) {
      console.error(err);
      alert("Lỗi kết nối!");
    }
  };

  const handleDeleteReturn = async (id: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa phiếu trả hàng ${id}? Tồn kho của các sản phẩm sẽ được khấu trừ trả về như trước khi đổi trả.`)) return;

    const oldReturn = data.Tra_hang.find(r => r.id === id);
    const updatedDb = { ...data };

    if (oldReturn) {
      oldReturn.chi_tiet_tra_hang.forEach(detail => {
        const prod = updatedDb.San_pham.find(p => p.id === (detail.id_sp || (detail as any).id_san_pham));
        if (prod) {
          prod.ton_kho -= detail.so_luong;
        }
      });
    }

    updatedDb.Tra_hang = updatedDb.Tra_hang.filter(r => r.id !== id);

    try {
      const res = await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedDb)
      });
      if ((await res.json()).success) {
        if (onRefreshData) onRefreshData();
      } else {
        alert("Lỗi khi xóa phiếu trả hàng!");
      }
    } catch (err) {
      console.error(err);
      alert("Lỗi kết nối!");
    }
  };

  const handleAddProductToEditReturn = () => {
    if (!selectedProductToAdd || !editingReturn) return;
    const prod = data.San_pham.find(p => p.id === selectedProductToAdd);
    if (!prod) return;

    const existingDetailIndex = editingReturn.chi_tiet_tra_hang.findIndex(d => d.id_sp === prod.id);
    const updatedDetails = [...editingReturn.chi_tiet_tra_hang];

    if (existingDetailIndex >= 0) {
      updatedDetails[existingDetailIndex].so_luong += 1;
      updatedDetails[existingDetailIndex].thanh_tien = 
        updatedDetails[existingDetailIndex].so_luong * updatedDetails[existingDetailIndex].gia_tra;
    } else {
      updatedDetails.push({
        id_sp: prod.id,
        so_luong: 1,
        gia_tra: prod.gia_ban,
        thanh_tien: prod.gia_ban
      });
    }

    setEditingReturn({
      ...editingReturn,
      chi_tiet_tra_hang: updatedDetails
    });
    setSelectedProductToAdd("");
  };

  // Reset return page to 1 when search or page size or date filters change
  useEffect(() => {
    setReturnCurrentPage(1);
  }, [
    customerReturnSearch,
    returnPageSize,
    returnDateFilterType,
    returnPredefinedDateRange,
    returnCustomStartDate,
    returnCustomEndDate
  ]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("vi-VN").format(val);
  };

  const isWithinReturnDateFilter = (returnDateStr?: string) => {
    if (!returnDateStr) return true;
    const retDate = new Date(returnDateStr);
    if (isNaN(retDate.getTime())) return true;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);

    if (returnDateFilterType === "all") {
      return true;
    }

    if (returnDateFilterType === "predefined") {
      switch (returnPredefinedDateRange) {
        case "today": {
          return retDate >= startOfToday;
        }
        case "yesterday": {
          const endOfYesterday = new Date(startOfToday);
          return retDate >= startOfYesterday && retDate < endOfYesterday;
        }
        case "this_week": {
          const day = startOfToday.getDay();
          const diff = startOfToday.getDate() - day + (day === 0 ? -6 : 1);
          const startOfWeek = new Date(startOfToday);
          startOfWeek.setDate(diff);
          startOfWeek.setHours(0, 0, 0, 0);
          return retDate >= startOfWeek;
        }
        case "last_week": {
          const day = startOfToday.getDay();
          const diff = startOfToday.getDate() - day + (day === 0 ? -6 : 1);
          const startOfWeek = new Date(startOfToday);
          startOfWeek.setDate(diff);
          startOfWeek.setHours(0, 0, 0, 0);
          const startOfLastWeek = new Date(startOfWeek);
          startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);
          return retDate >= startOfLastWeek && retDate < startOfWeek;
        }
        case "last_7_days": {
          const limit = new Date(startOfToday);
          limit.setDate(limit.getDate() - 7);
          return retDate >= limit;
        }
        case "this_month": {
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          return retDate >= startOfMonth;
        }
        case "last_month": {
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          const startOfLastMonth = new Date(startOfMonth);
          startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1);
          return retDate >= startOfLastMonth && retDate < startOfMonth;
        }
        case "this_quarter": {
          const quarter = Math.floor(now.getMonth() / 3);
          const startOfQuarter = new Date(now.getFullYear(), quarter * 3, 1);
          return retDate >= startOfQuarter;
        }
        case "last_quarter": {
          const quarter = Math.floor(now.getMonth() / 3);
          const startOfQuarter = new Date(now.getFullYear(), quarter * 3, 1);
          const startOfLastQuarter = new Date(startOfQuarter);
          startOfLastQuarter.setMonth(startOfLastQuarter.getMonth() - 3);
          return retDate >= startOfLastQuarter && retDate < startOfQuarter;
        }
        case "this_year": {
          const startOfYear = new Date(now.getFullYear(), 0, 1);
          return retDate >= startOfYear;
        }
        case "last_year": {
          const startOfYear = new Date(now.getFullYear(), 0, 1);
          const startOfLastYear = new Date(startOfYear);
          startOfLastYear.setFullYear(startOfLastYear.getFullYear() - 1);
          return retDate >= startOfLastYear && retDate < startOfYear;
        }
        default:
          return true;
      }
    }

    if (returnDateFilterType === "range") {
      const start = returnCustomStartDate ? new Date(returnCustomStartDate) : null;
      const end = returnCustomEndDate ? new Date(returnCustomEndDate) : null;
      if (start && end) {
        const adjustedEnd = new Date(end);
        adjustedEnd.setHours(23, 59, 59, 999);
        return retDate >= start && retDate <= adjustedEnd;
      }
      if (start) {
        return retDate >= start;
      }
      if (end) {
        const adjustedEnd = new Date(end);
        adjustedEnd.setHours(23, 59, 59, 999);
        return retDate <= adjustedEnd;
      }
    }

    return true;
  };

  const filteredReturns = data.Tra_hang.filter((ret) => {
    const q = customerReturnSearch.toLowerCase().trim();
    const c = data.Khach_hang.find((cust) => cust.id === ret.id_khach_hang);
    const cName = c ? c.ho_ten.toLowerCase() : "";
    const cPhone = c ? c.so_dien_thoai : "";

    const matchSearch =
      !q ||
      ret.id.toLowerCase().includes(q) ||
      ret.id_hoa_don_goc.toLowerCase().includes(q) ||
      cName.includes(q) ||
      cPhone.includes(q);

    const matchDate = isWithinReturnDateFilter(ret.ngay_tra);

    return matchSearch && matchDate;
  });

  const totalReturnPages = Math.ceil(filteredReturns.length / returnPageSize) || 1;
  const safeReturnCurrentPage = Math.min(returnCurrentPage, totalReturnPages);
  const totalItems = filteredReturns.length;
  const startIndex = (safeReturnCurrentPage - 1) * returnPageSize;
  const paginatedReturns = filteredReturns.slice(startIndex, startIndex + returnPageSize);

  const getReturnPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;
    if (totalReturnPages <= maxVisible) {
      for (let i = 1; i <= totalReturnPages; i++) pages.push(i);
    } else {
      if (safeReturnCurrentPage <= 3) {
        pages.push(1, 2, 3, 4, "...", totalReturnPages);
      } else if (safeReturnCurrentPage >= totalReturnPages - 2) {
        pages.push(1, "...", totalReturnPages - 3, totalReturnPages - 2, totalReturnPages - 1, totalReturnPages);
      } else {
        pages.push(1, "...", safeReturnCurrentPage - 1, safeReturnCurrentPage, safeReturnCurrentPage + 1, "...", totalReturnPages);
      }
    }
    return pages;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200" id="trahang_view">
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        {/* Left Side: Table */}
        <div className="xl:col-span-3 space-y-4">
          {/* Main search input like Hoadon */}
          <div className="bg-white rounded-xl shadow-xs border p-2 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="relative w-full sm:w-120">
              <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-gray-400">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                placeholder="Tìm phiếu trả theo mã số, mã hóa đơn, tên khách hàng..."
                value={customerReturnSearch}
                onChange={(e) => setCustomerReturnSearch(e.target.value)}
                className="w-full rounded-md border border-gray-300 py-1.5 pl-8 pr-3 text-xs focus:border-blue-500 focus:outline-hidden text-gray-700 bg-white"
              />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-xs border overflow-hidden flex flex-col h-[732px]">
  {/* Khung chứa bảng ẩn hoàn toàn thanh cuộn */}
  <div 
    className="overflow-x-auto flex-1 [&::-webkit-scrollbar]:hidden"
    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
  >
    <table className="w-full text-left table-layout-fixed">
      <thead>
        <tr className="border-b text-gray-500 text-xs font-semibold bg-gray-50/50 h-[40px]">
          <th className="py-2 px-4 w-28">Số phiếu</th>
          <th className="py-2 px-4 w-28">Hóa đơn gốc</th>
          <th className="py-2 px-4">Khách hàng</th>
          <th className="py-2 px-4 w-40">Ngày nhận trả</th>
          <th className="py-2 px-4 text-right">Hoàn tiền khách</th>
          <th className="py-2 px-4">Lý do trả hàng</th>
          <th className="py-2 px-4 text-center w-28">Hành động</th>
        </tr>
      </thead>
      <tbody className="text-xs text-gray-700">
        {paginatedReturns.map((ret) => {
          const c = data.Khach_hang.find((cust) => cust.id === ret.id_khach_hang);
          return (
            <tr key={ret.id} className="border-b text-base last:border-0 hover:bg-slate-100/50 transition-colors h-[42px]">
              <td className="py-1 px-4 font-mono font-bold text-blue-600 truncate">{ret.id}</td>
              <td className="py-1 px-4 font-mono text-slate-500 truncate">{ret.id_hoa_don_goc}</td>
              <td className="py-1 px-4 font-medium text-gray-900 truncate max-w-[150px]">{c ? c.ho_ten : "Vãng lai / Lẻ"}</td>
              <td className="py-1 px-4 text-gray-500">{new Date(ret.ngay_tra).toLocaleString("vi-VN")}</td>
              <td className="py-1 px-4 text-right font-bold text-emerald-600">{formatCurrency(ret.tong_tien_tra)}</td>
              <td className="py-1 px-4 truncate max-w-[180px] text-gray-500" title={ret.ly_do_tra}>{ret.ly_do_tra}</td>
              <td className="py-1 px-4 text-center">
                <div className="flex items-center justify-center gap-1">
                  <button
                    onClick={() => setViewingReturn(ret)}
                    className="p-1 rounded-full text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                    title="Xem chi tiết"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setEditingReturn(JSON.parse(JSON.stringify(ret)))}
                    className="p-1 rounded-full text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                    title="Sửa phiếu"
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteReturn(ret.id)}
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

        {/* Bù các dòng trống hoàn toàn không có dòng kẻ (border-none) để khít khung 15 dòng */}
        {paginatedReturns.length > 0 && paginatedReturns.length < 15 && (
          Array.from({ length: 15 - paginatedReturns.length }).map((_, index) => (
            <tr key={`empty-${index}`} className="h-[42px] border-none">
              <td colSpan={7}></td>
            </tr>
          ))
        )}

        {/* Giao diện sạch sẽ khi không có dữ liệu trả về */}
        {filteredReturns.length === 0 && (
          <tr className="h-[630px] border-none">
            <td colSpan={7} className="text-center text-gray-400 font-medium vertical-middle">
              <div className="flex flex-col items-center justify-center h-full gap-2">
                <RefreshCw className="h-8 w-8 text-gray-300 animate-none" />
                <span>Không tìm thấy phiếu trả hàng nào khớp với bộ lọc</span>
              </div>
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>

  {/* Pagination Controls: Cố định h-[62px] ở đáy khung */}
  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t bg-gray-50/50 text-xs text-gray-500 font-medium h-[62px]">
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
        Hiển thị {totalItems > 0 ? startIndex + 1 : 0} - {Math.min(safeReturnCurrentPage * returnPageSize, totalItems)} trong {totalItems} phiếu trả
      </span>
    </div>

    {totalReturnPages > 1 && (
      <div className="flex items-center gap-1">
        <button
          onClick={() => setReturnCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={safeReturnCurrentPage === 1}
          className="p-1 rounded-md border border-gray-300 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-white transition-colors cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {getReturnPageNumbers().map((pNum, idx) => {
          if (pNum === "...") {
            return (
              <span key={`return-ellipsis-${idx}`} className="px-2 py-1 text-gray-400 select-none">
                ...
              </span>
            );
          }
          return (
            <button
              key={`return-page-${pNum}`}
              onClick={() => setReturnCurrentPage(Number(pNum))}
              className={`px-2.5 py-1 rounded-md border text-xs transition-colors cursor-pointer font-semibold ${
                safeReturnCurrentPage === pNum
                  ? "bg-blue-600 border-blue-600 text-white"
                  : "border-gray-300 bg-white text-gray-600 hover:bg-gray-100"
              }`}
            >
              {pNum}
            </button>
          );
        })}

        <button
          onClick={() => setReturnCurrentPage((prev) => Math.min(prev + 1, totalReturnPages))}
          disabled={safeReturnCurrentPage === totalReturnPages}
          className="p-1 rounded-md border border-gray-300 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-white transition-colors cursor-pointer"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    )}
  </div>
</div>
        </div>

        {/* Right Side: Filters (Matching Hoadon) */}
        <div className="space-y-6">
          <div className="bg-[#ff9100] text-white rounded-xl p-3 shadow-sm flex items-center gap-3">
            <RotateCcw className="h-5 w-5 text-blue-400 shrink-0 animate-none" />
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider">Khách trả hàng</h2>
            </div>
          </div>

          {/* Section 1: Tìm theo thời gian */}
          <div className="bg-white rounded-xl shadow-xs border p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 border-b pb-2">
              <Calendar className="h-4 w-4 text-blue-500" />
              Tìm theo thời gian
            </h3>

            <div className="space-y-2">
              {/* Predefined check */}
              <label className="flex items-start gap-2 text-xs font-medium text-gray-700 cursor-pointer">
                <input
                  type="radio"
                  name="returnDateFilterType"
                  checked={returnDateFilterType === "predefined"}
                  onChange={() => setReturnDateFilterType("predefined")}
                  className="text-blue-600 focus:ring-blue-500 mt-0.5 h-3.5 w-3.5 bg-white border-gray-300"
                />
                <div className="flex-1">
                  <span>Mốc thời gian có sẵn</span>
                  {returnDateFilterType === "predefined" && (
                    <select
                      value={returnPredefinedDateRange}
                      onChange={(e) => setReturnPredefinedDateRange(e.target.value)}
                      className="mt-1 w-full rounded-md border border-gray-300 px-2.5 py-1 text-xs focus:border-blue-500 focus:outline-hidden text-gray-700 bg-white"
                    >
                      <option value="all">Tất cả thời gian</option>
                      <option value="today">Hôm nay</option>
                      <option value="yesterday">Hôm qua</option>
                      <option value="this_week">Tuần này</option>
                      <option value="last_week">Tuần trước</option>
                      <option value="last_7_days">7 ngày gần nhất</option>
                      <option value="this_month">Tháng này</option>
                      <option value="last_month">Tháng trước</option>
                      <option value="this_quarter">Quý này</option>
                      <option value="last_quarter">Quý trước</option>
                      <option value="this_year">Năm nay</option>
                      <option value="last_year">Năm ngoái</option>
                    </select>
                  )}
                </div>
              </label>

              {/* Custom range check */}
              <label className="flex items-start gap-2 text-xs font-medium text-gray-700 cursor-pointer">
                <input
                  type="radio"
                  name="returnDateFilterType"
                  checked={returnDateFilterType === "range"}
                  onChange={() => setReturnDateFilterType("range")}
                  className="text-blue-600 focus:ring-blue-500 mt-0.5 h-3.5 w-3.5 bg-white border-gray-300"
                />
                <div className="flex-1">
                  <span>Chọn Từ ngày - Đến ngày</span>
                  {returnDateFilterType === "range" && (
                    <div className="mt-1.5 space-y-1.5 animate-in fade-in duration-100">
                      <div>
                        <span className="block text-[9px] text-gray-400 font-semibold uppercase">Từ ngày</span>
                        <input
                          type="date"
                          value={returnCustomStartDate}
                          onChange={(e) => setReturnCustomStartDate(e.target.value)}
                          className="w-full text-xs rounded-md border border-gray-300 py-1 px-2 focus:border-blue-500 focus:outline-hidden bg-white text-gray-700"
                        />
                      </div>
                      <div>
                        <span className="block text-[9px] text-gray-400 font-semibold uppercase">Đến ngày</span>
                        <input
                          type="date"
                          value={returnCustomEndDate}
                          onChange={(e) => setReturnCustomEndDate(e.target.value)}
                          className="w-full text-xs rounded-md border border-gray-300 py-1 px-2 focus:border-blue-500 focus:outline-hidden bg-white text-gray-700"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </label>

              {/* All time */}
              <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer">
                <input
                  type="radio"
                  name="returnDateFilterType"
                  checked={returnDateFilterType === "all"}
                  onChange={() => setReturnDateFilterType("all")}
                  className="text-blue-600 focus:ring-blue-500 h-3.5 w-3.5 bg-white border-gray-300"
                />
                <span>Tất cả thời gian tạo</span>
              </label>
            </div>
          </div>

          {/* Return guidelines info card */}
          <div className="bg-slate-50 rounded-xl p-4 border text-xs text-slate-600 space-y-2">
            <h4 className="font-bold text-slate-700 uppercase tracking-wide text-[10px]">💡 Hướng dẫn đổi trả</h4>
            <p>Việc đổi trả hàng được thực hiện trực tiếp từ **Hóa đơn giao dịch** hoặc thông qua màn hình bán hàng để đối soát thông tin giao dịch gốc một cách minh bạch.</p>
          </div>
        </div>

      </div>

      {/* VIEW RETURN ORDER MODAL */}
      {viewingReturn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl overflow-hidden animate-in zoom-in-95 duration-150 border border-slate-200 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between bg-slate-50 border-b border-slate-150 px-5 py-3.5 text-slate-800">
              <div className="flex items-center gap-2">
                <RotateCcw className="h-5 w-5 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-800">Chi tiết trả hàng {viewingReturn.id}</h3>
              </div>
              <button 
                onClick={() => setViewingReturn(null)} 
                className="rounded-full p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto text-xs text-gray-700">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border">
                <div>
                  <p className="mb-1"><span className="font-semibold text-gray-500">Ngày trả hàng:</span> {new Date(viewingReturn.ngay_tra).toLocaleString("vi-VN")}</p>
                  <p className="mb-1">
                    <span className="font-semibold text-gray-500">Khách trả hàng:</span> {
                      data.Khach_hang.find(c => c.id === viewingReturn.id_khach_hang)?.ho_ten || "Khách lẻ / Vãng lai"
                    }
                  </p>
                  <p><span className="font-semibold text-gray-500">Mã hóa đơn gốc:</span> <span className="font-mono font-semibold text-blue-600">{viewingReturn.id_hoa_don_goc}</span></p>
                </div>
                <div>
                  <p className="mb-1">
                    <span className="font-semibold text-gray-500">Nhân viên nhận trả:</span> {
                      data.Nhan_vien.find(e => e.id === viewingReturn.id_nhan_vien_nhan)?.ho_ten || viewingReturn.id_nhan_vien_nhan
                    }
                  </p>
                  <p className="mb-1"><span className="font-semibold text-gray-500">Hình thức hoàn tiền:</span> {viewingReturn.hinh_thuc_hoan_tien}</p>
                  <p><span className="font-semibold text-gray-500">Lý do trả hàng:</span> {viewingReturn.ly_do_tra}</p>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-gray-800 mb-2 border-b pb-1">Chi tiết danh sách hàng trả</h4>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b text-gray-500 font-semibold">
                        <th className="py-2 px-3 w-12 text-center">STT</th>
                        <th className="py-2 px-3">Mã hàng</th>
                        <th className="py-2 px-3">Tên sản phẩm</th>
                        <th className="py-2 px-3 text-right">Số lượng trả</th>
                        <th className="py-2 px-3 text-right">Giá nhận trả</th>
                        <th className="py-2 px-3 text-right">Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {viewingReturn.chi_tiet_tra_hang.map((detail, idx) => {
                        const prod = data.San_pham.find(p => p.id === (detail.id_sp || (detail as any).id_san_pham));
                        return (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="py-2 px-3 text-center text-gray-400">{idx + 1}</td>
                            <td className="py-2 px-3 font-mono font-medium">{detail.id_sp || (detail as any).id_san_pham}</td>
                            <td className="py-2 px-3 font-semibold text-slate-800">{prod ? prod.ten_san_pham : "Không rõ"}</td>
                            <td className="py-2 px-3 text-right font-semibold">{detail.so_luong}</td>
                            <td className="py-2 px-3 text-right">{formatCurrency(detail.gia_tra)}</td>
                            <td className="py-2 px-3 text-right font-bold text-rose-600">{formatCurrency(detail.thanh_tien)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <div className="w-64 space-y-1 bg-slate-50 p-3 rounded-lg border text-xs font-semibold">
                  <div className="flex justify-between text-rose-600 text-sm font-bold">
                    <span>Tổng tiền hoàn trả:</span>
                    <span>{formatCurrency(viewingReturn.tong_tien_tra)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 border-t px-5 py-3.5 flex justify-end">
              <button 
                onClick={() => setViewingReturn(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-bold text-xs cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT RETURN ORDER MODAL */}
      {editingReturn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <form onSubmit={handleSaveEditedReturn} className="w-full max-w-3xl rounded-xl bg-white shadow-xl overflow-hidden animate-in zoom-in-95 duration-150 border border-slate-200 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between bg-slate-50 border-b border-slate-150 px-5 py-3.5 text-slate-800">
              <div className="flex items-center gap-2">
                <Edit className="h-5 w-5 text-amber-600" />
                <h3 className="text-sm font-bold text-slate-800">Sửa phiếu khách trả hàng {editingReturn.id}</h3>
              </div>
              <button 
                type="button"
                onClick={() => setEditingReturn(null)} 
                className="rounded-full p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto text-xs text-gray-700">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-gray-400 mb-1">Hóa đơn gốc</label>
                  <input
                    type="text"
                    value={editingReturn.id_hoa_don_goc}
                    onChange={(e) => setEditingReturn({ ...editingReturn, id_hoa_don_goc: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-2.5 py-1.5 focus:border-blue-500 font-mono font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-400 mb-1">Khách hàng</label>
                  <select
                    value={editingReturn.id_khach_hang}
                    onChange={(e) => setEditingReturn({ ...editingReturn, id_khach_hang: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-2 py-1.5 focus:border-blue-500 bg-white"
                  >
                    <option value="">Khách lẻ</option>
                    {data.Khach_hang.map(c => (
                      <option key={c.id} value={c.id}>{c.ho_ten} ({c.id})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-400 mb-1">Nhân viên lập phiếu</label>
                  <select
                    value={editingReturn.id_nhan_vien_nhan}
                    onChange={(e) => setEditingReturn({ ...editingReturn, id_nhan_vien_nhan: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-2 py-1.5 focus:border-blue-500 bg-white"
                  >
                    {data.Nhan_vien.map(e => (
                      <option key={e.id} value={e.id}>{e.ho_ten}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-400 mb-1">Ngày lập phiếu</label>
                  <input
                    type="text"
                    value={editingReturn.ngay_tra}
                    onChange={(e) => setEditingReturn({ ...editingReturn, ngay_tra: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-2.5 py-1.5 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-400 mb-1">Hình thức hoàn tiền</label>
                  <select
                    value={editingReturn.hinh_thuc_hoan_tien}
                    onChange={(e) => setEditingReturn({ ...editingReturn, hinh_thuc_hoan_tien: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-2 py-1.5 focus:border-blue-500 bg-white"
                  >
                    <option value="Tiền mặt">Tiền mặt</option>
                    <option value="Chuyển khoản">Chuyển khoản</option>
                    <option value="Điểm">Điểm</option>
                    <option value="Voucher">Voucher</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-400 mb-1">Lý do trả hàng</label>
                  <input
                    type="text"
                    value={editingReturn.ly_do_tra}
                    onChange={(e) => setEditingReturn({ ...editingReturn, ly_do_tra: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-2.5 py-1.5 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* PRODUCT SELECT LINE FOR RETURNS */}
              <div className="bg-slate-50 p-3 rounded-lg border flex flex-col sm:flex-row sm:items-end gap-3">
                <div className="flex-1">
                  <label className="block font-bold text-gray-500 mb-1">Thêm sản phẩm nhận trả</label>
                  <select
                    value={selectedProductToAdd}
                    onChange={(e) => setSelectedProductToAdd(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-2.5 py-1.5 bg-white text-xs text-gray-800"
                  >
                    <option value="">-- Chọn sản phẩm --</option>
                    {data.San_pham.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.ten_san_pham} - {formatCurrency(p.gia_ban)}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={handleAddProductToEditReturn}
                  disabled={!selectedProductToAdd}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs px-4 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-1 shrink-0 h-[34px]"
                >
                  <Plus className="h-4 w-4" /> Thêm hàng trả
                </button>
              </div>

              <div>
                <h4 className="font-bold text-gray-800 mb-2 border-b pb-1">Chi tiết hàng trả và đơn giá hoàn trả</h4>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b text-gray-500 font-semibold">
                        <th className="py-2 px-3">Sản phẩm</th>
                        <th className="py-2 px-3 w-28 text-right">Số lượng</th>
                        <th className="py-2 px-3 w-32 text-right">Giá nhận trả</th>
                        <th className="py-2 px-3 w-32 text-right">Thành tiền</th>
                        <th className="py-2 px-3 w-16 text-center">Xóa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y bg-white">
                      {editingReturn.chi_tiet_tra_hang.map((detail, idx) => {
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
                                    detail.thanh_tien = nextQty * detail.gia_tra;
                                    setEditingReturn({ ...editingReturn });
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
                                    detail.thanh_tien = val * detail.gia_tra;
                                    setEditingReturn({ ...editingReturn });
                                  }}
                                  className="w-12 text-center border rounded py-0.5 font-bold"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const nextQty = detail.so_luong + 1;
                                    detail.so_luong = nextQty;
                                    detail.thanh_tien = nextQty * detail.gia_tra;
                                    setEditingReturn({ ...editingReturn });
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
                                value={detail.gia_tra}
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  detail.gia_tra = val;
                                  detail.thanh_tien = detail.so_luong * val;
                                  setEditingReturn({ ...editingReturn });
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
                                  editingReturn.chi_tiet_tra_hang = editingReturn.chi_tiet_tra_hang.filter((_, i) => i !== idx);
                                  setEditingReturn({ ...editingReturn });
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
                <div className="w-72 space-y-1 text-right text-xs font-semibold">
                  <div className="flex justify-between text-rose-600 font-bold text-sm">
                    <span>Tổng tiền hoàn trả:</span>
                    <span>{formatCurrency(editingReturn.chi_tiet_tra_hang.reduce((acc, d) => acc + d.thanh_tien, 0))}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 border-t px-5 py-3.5 flex justify-end gap-2 shrink-0">
              <button 
                type="button"
                onClick={() => setEditingReturn(null)}
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
