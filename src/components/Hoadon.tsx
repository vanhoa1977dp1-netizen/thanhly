import React, { useState, useEffect } from "react";
import {
  FileText,
  Search,
  Calendar,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  FileSpreadsheet,
  Eye,
  Trash2,
  Edit,
  X,
  Plus,
  Minus
} from "lucide-react";
import * as XLSX from "xlsx";
import { DatabaseSchema, Invoice } from "../types";

interface HoadonProps {
  data: DatabaseSchema;
  onRefreshData: () => void;
}

export default function Hoadon({ data, onRefreshData }: HoadonProps) {
  const [invoiceSearch, setInvoiceSearch] = useState<string>("");
  const [invoiceDateFilterType, setInvoiceDateFilterType] = useState<"all" | "predefined" | "range">("all");
  const [invoicePredefinedDateRange, setInvoicePredefinedDateRange] = useState<string>("all");
  const [invoiceCustomStartDate, setInvoiceCustomStartDate] = useState<string>("");
  const [invoiceCustomEndDate, setInvoiceCustomEndDate] = useState<string>("");
  const [invoicePaymentMethodFilter, setInvoicePaymentMethodFilter] = useState<string>("all");
  
  // Invoice Pagination & Export Menu States
  const [invoicePageSize, setInvoicePageSize] = useState<number>(15);
  const [invoiceCurrentPage, setInvoiceCurrentPage] = useState<number>(1);
  const [showExportInvoiceMenu, setShowExportInvoiceMenu] = useState<boolean>(false);

  // View, Edit, Delete States
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [selectedProductToAdd, setSelectedProductToAdd] = useState<string>("");

  const handleSaveEditedInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInvoice) return;

    const oldInvoice = data.Hoa_don.find(inv => inv.id === editingInvoice.id);
    const updatedDb = { ...data };

    // Restore old stock quantities
    if (oldInvoice) {
      oldInvoice.chi_tiet_san_pham.forEach(oldDetail => {
        const prod = updatedDb.San_pham.find(p => p.id === (oldDetail.id_sp || (oldDetail as any).id_san_pham));
        if (prod) {
          prod.ton_kho += oldDetail.so_luong;
        }
      });
    }

    // Deduct new quantities and calculate aggregate totals
    let newTotalTienHang = 0;
    editingInvoice.chi_tiet_san_pham.forEach((newDetail) => {
      const prod = updatedDb.San_pham.find(p => p.id === (newDetail.id_sp || (newDetail as any).id_san_pham));
      if (prod) {
        prod.ton_kho -= newDetail.so_luong;
      }
      newTotalTienHang += newDetail.so_luong * newDetail.don_gia;
    });

    editingInvoice.tong_tien_hang = newTotalTienHang;
    editingInvoice.khach_can_tra = Math.max(0, newTotalTienHang - editingInvoice.giam_gia);

    // Update the list of invoices
    updatedDb.Hoa_don = updatedDb.Hoa_don.map(inv => 
      inv.id === editingInvoice.id ? editingInvoice : inv
    );

    try {
      const res = await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedDb)
      });
      const resJson = await res.json();
      if (resJson.success) {
        onRefreshData();
        setEditingInvoice(null);
      } else {
        alert("Lưu dữ liệu thất bại!");
      }
    } catch (err) {
      console.error(err);
      alert("Lỗi kết nối máy chủ!");
    }
  };

  const handleDeleteInvoice = async (id: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa hóa đơn ${id}? Thao tác này sẽ khôi phục lại tồn kho cho các sản phẩm trong hóa đơn.`)) return;

    const oldInvoice = data.Hoa_don.find(inv => inv.id === id);
    const updatedDb = { ...data };

    if (oldInvoice) {
      // Restore product stock
      oldInvoice.chi_tiet_san_pham.forEach(detail => {
        const prod = updatedDb.San_pham.find(p => p.id === (detail.id_sp || (detail as any).id_san_pham));
        if (prod) {
          prod.ton_kho += detail.so_luong;
        }
      });
    }

    // Filter out the invoice
    updatedDb.Hoa_don = updatedDb.Hoa_don.filter(inv => inv.id !== id);

    try {
      const res = await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedDb)
      });
      const resJson = await res.json();
      if (resJson.success) {
        onRefreshData();
      } else {
        alert("Xóa hóa đơn thất bại!");
      }
    } catch (err) {
      console.error(err);
      alert("Lỗi kết nối máy chủ!");
    }
  };

  const handleAddProductToEditInvoice = () => {
    if (!selectedProductToAdd || !editingInvoice) return;
    const prod = data.San_pham.find(p => p.id === selectedProductToAdd);
    if (!prod) return;

    const existingDetailIndex = editingInvoice.chi_tiet_san_pham.findIndex(d => d.id_sp === prod.id);
    const updatedDetails = [...editingInvoice.chi_tiet_san_pham];

    if (existingDetailIndex >= 0) {
      updatedDetails[existingDetailIndex].so_luong += 1;
      updatedDetails[existingDetailIndex].thanh_tien = 
        updatedDetails[existingDetailIndex].so_luong * updatedDetails[existingDetailIndex].don_gia;
    } else {
      updatedDetails.push({
        id_sp: prod.id,
        so_luong: 1,
        don_gia: prod.gia_ban,
        thanh_tien: prod.gia_ban
      });
    }

    setEditingInvoice({
      ...editingInvoice,
      chi_tiet_san_pham: updatedDetails
    });
    setSelectedProductToAdd("");
  };

  // Reset invoice page to 1 when filters or page size change
  useEffect(() => {
    setInvoiceCurrentPage(1);
  }, [
    invoiceSearch,
    invoiceDateFilterType,
    invoicePredefinedDateRange,
    invoiceCustomStartDate,
    invoiceCustomEndDate,
    invoicePaymentMethodFilter,
    invoicePageSize
  ]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("vi-VN").format(val);
  };

  const isWithinInvoiceDateFilter = (invoiceDateStr?: string) => {
    if (!invoiceDateStr) return true;
    const invDate = new Date(invoiceDateStr);
    if (isNaN(invDate.getTime())) return true;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);

    if (invoiceDateFilterType === "all") {
      return true;
    }

    if (invoiceDateFilterType === "predefined") {
      switch (invoicePredefinedDateRange) {
        case "today": {
          return invDate >= startOfToday;
        }
        case "yesterday": {
          const endOfYesterday = new Date(startOfToday);
          return invDate >= startOfYesterday && invDate < endOfYesterday;
        }
        case "this_week": {
          const day = startOfToday.getDay();
          const diff = startOfToday.getDate() - day + (day === 0 ? -6 : 1);
          const startOfWeek = new Date(startOfToday);
          startOfWeek.setDate(diff);
          startOfWeek.setHours(0, 0, 0, 0);
          return invDate >= startOfWeek;
        }
        case "last_week": {
          const day = startOfToday.getDay();
          const diff = startOfToday.getDate() - day + (day === 0 ? -6 : 1);
          const startOfWeek = new Date(startOfToday);
          startOfWeek.setDate(diff);
          startOfWeek.setHours(0, 0, 0, 0);
          const startOfLastWeek = new Date(startOfWeek);
          startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);
          return invDate >= startOfLastWeek && invDate < startOfWeek;
        }
        case "last_7_days": {
          const limit = new Date(startOfToday);
          limit.setDate(limit.getDate() - 7);
          return invDate >= limit;
        }
        case "this_month": {
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          return invDate >= startOfMonth;
        }
        case "last_month": {
          const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          return invDate >= startOfLastMonth && invDate < endOfLastMonth;
        }
        case "this_quarter": {
          const currentQuarter = Math.floor(now.getMonth() / 3);
          const startOfQuarter = new Date(now.getFullYear(), currentQuarter * 3, 1);
          return invDate >= startOfQuarter;
        }
        case "last_quarter": {
          const currentQuarter = Math.floor(now.getMonth() / 3);
          const startOfLastQuarter = new Date(now.getFullYear(), (currentQuarter - 1) * 3, 1);
          const endOfLastQuarter = new Date(now.getFullYear(), currentQuarter * 3, 1);
          return invDate >= startOfLastQuarter && invDate < endOfLastQuarter;
        }
        case "this_year": {
          const startOfYear = new Date(now.getFullYear(), 0, 1);
          return invDate >= startOfYear;
        }
        case "last_year": {
          const startOfLastYear = new Date(now.getFullYear() - 1, 0, 1);
          const endOfLastYear = new Date(now.getFullYear(), 0, 1);
          return invDate >= startOfLastYear && invDate < endOfLastYear;
        }
        case "all":
        default:
          return true;
      }
    }

    if (invoiceDateFilterType === "range") {
      if (invoiceCustomStartDate) {
        const start = new Date(invoiceCustomStartDate);
        start.setHours(0, 0, 0, 0);
        if (invDate < start) return false;
      }
      if (invoiceCustomEndDate) {
        const end = new Date(invoiceCustomEndDate);
        end.setHours(23, 59, 59, 999);
        if (invDate > end) return false;
      }
      return true;
    }

    return true;
  };

  // Export Invoices Overview
  const handleExportInvoicesOverview = () => {
    try {
      const exportData = data.Hoa_don.map((inv) => {
        const cust = data.Khach_hang.find((c) => c.id === inv.id_khach_hang);
        return {
          "Số hóa đơn": inv.id,
          "Ngày giao dịch": new Date(inv.ngay_lap).toLocaleString("vi-VN"),
          "Khách hàng": cust ? cust.ho_ten : "Khách lẻ",
          "Mã khách hàng": inv.id_khach_hang,
          "Tổng tiền hàng": inv.tong_tien_hang,
          "Giảm giá": inv.giam_gia,
          "Thực thu": inv.khach_can_tra,
          "Khách đã trả": inv.khach_da_tra,
          "Phương thức thanh toán": inv.phuong_thuc_thanh_toan,
          "Trạng thái": inv.trang_thai,
        };
      });

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Tổng quan Hóa đơn");
      XLSX.writeFile(wb, "tong_quan_hoa_don.xlsx");
    } catch (e) {
      console.error(e);
      alert("Xuất excel thất bại");
    }
  };

  // Export Invoices Detailed
  const handleExportInvoicesDetail = () => {
    try {
      const exportData: any[] = [];
      data.Hoa_don.forEach((inv) => {
        const cust = data.Khach_hang.find((c) => c.id === inv.id_khach_hang);
        
        if (!inv.chi_tiet_san_pham || inv.chi_tiet_san_pham.length === 0) {
          exportData.push({
            "Số hóa đơn": inv.id,
            "Ngày giao dịch": new Date(inv.ngay_lap).toLocaleString("vi-VN"),
            "Mã sản phẩm": "",
            "Tên sản phẩm": "",
            "Số lượng": 0,
            "Đơn giá": 0,
            "Thành tiền": 0,
            "Khách hàng": cust ? cust.ho_ten : "Khách lẻ",
            "Mã khách hàng": inv.id_khach_hang,
            "Phương thức thanh toán": inv.phuong_thuc_thanh_toan,
            "Trạng thái": inv.trang_thai,
          });
        } else {
          inv.chi_tiet_san_pham.forEach((detail) => {
            const product = data.San_pham.find((p) => p.id === (detail.id_sp || (detail as any).id_san_pham));
            exportData.push({
              "Số hóa đơn": inv.id,
              "Ngày giao dịch": new Date(inv.ngay_lap).toLocaleString("vi-VN"),
              "Mã sản phẩm": detail.id_sp || (detail as any).id_san_pham,
              "Tên sản phẩm": product ? product.ten_san_pham : "",
              "Số lượng": detail.so_luong,
              "Đơn giá": detail.don_gia,
              "Thành tiền": detail.thanh_tien,
              "Khách hàng": cust ? cust.ho_ten : "Khách lẻ",
              "Mã khách hàng": inv.id_khach_hang,
              "Phương thức thanh toán": inv.phuong_thuc_thanh_toan,
              "Trạng thái": inv.trang_thai,
            });
          });
        }
      });

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Chi tiết Hóa đơn");
      XLSX.writeFile(wb, "chi_tiet_hoa_don.xlsx");
    } catch (e) {
      console.error(e);
      alert("Xuất excel thất bại");
    }
  };

  // Import Invoices from Excel
  const handleImportInvoicesExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawData = XLSX.utils.sheet_to_json(ws) as any[];

        if (rawData.length === 0) {
          alert("File Excel trống!");
          return;
        }

        const invoicesMap: { [key: string]: any } = {};

        rawData.forEach((row: any) => {
          const id = String(row["Số hóa đơn"] || row["Số hoá đơn"] || row["id"] || row["Mã hóa đơn"] || row["Mã hoá đơn"] || `HD${Math.floor(100000 + Math.random() * 900000)}`).trim();
          
          if (!invoicesMap[id]) {
            const custName = row["Khách hàng"] || row["Khách Hàng"] || row["Tên khách hàng"] || "Khách lẻ";
            let custId = row["Mã khách hàng"] || row["Mã khách"] || "KL001";
            if (custId === "KL001" && custName !== "Khách lẻ") {
              const foundCust = data.Khach_hang.find(c => c.ho_ten.toLowerCase() === custName.toLowerCase() || c.id === custName);
              if (foundCust) {
                custId = foundCust.id;
              } else {
                custId = "KL001";
              }
            }

            let empId = row["Mã nhân viên"] || row["Nhân viên"] || "NV001";
            
            const rawDate = row["Ngày giao dịch"] || row["Ngày lập"] || row["ngay_lap"] || new Date().toISOString();
            let parsedDate = new Date(rawDate).toISOString();
            if (isNaN(new Date(rawDate).getTime())) {
              parsedDate = new Date().toISOString();
            }

            const paymentMethod = row["Phương thức thanh toán"] || row["Hình thức thanh toán"] || row["Hình thức"] || "Tiền mặt";
            const state = row["Trạng thái"] || "Đã hoàn thành";

            invoicesMap[id] = {
              id,
              ngay_lap: parsedDate,
              id_khach_hang: custId,
              id_nhan_vien: empId,
              chi_tiet_san_pham: [],
              tong_tien_hang: Number(row["Tổng tiền hàng"] || row["tong_tien_hang"] || 0),
              giam_gia: Number(row["Giảm giá"] || row["giam_gia"] || 0),
              khach_can_tra: Number(row["Khách cần trả"] || row["khach_can_tra"] || row["Thực thu"] || 0),
              khach_da_tra: Number(row["Khách đã trả"] || row["khach_da_tra"] || 0),
              phuong_thuc_thanh_toan: paymentMethod,
              trang_thai: state
            };
          }

          const prodId = row["Mã sản phẩm"] || row["id_san_pham"] || row["Mã hàng"] || "";
          if (prodId) {
            const qty = Number(row["Số lượng"] || row["so_luong"] || 1);
            const price = Number(row["Đơn giá"] || row["don_gia"] || row["Giá bán"] || 0);
            const total = Number(row["Thành tiền"] || row["thanh_tien"] || (qty * price));
            
            invoicesMap[id].chi_tiet_san_pham.push({
              id_sp: prodId,
              so_luong: qty,
              don_gia: price,
              thanh_tien: total
            });
          }
        });

        const importedInvoices = Object.values(invoicesMap);
        
        importedInvoices.forEach((inv: any) => {
          if (inv.chi_tiet_san_pham.length > 0) {
            const totalItemsSum = inv.chi_tiet_san_pham.reduce((acc: number, d: any) => acc + d.thanh_tien, 0);
            if (inv.tong_tien_hang === 0) {
              inv.tong_tien_hang = totalItemsSum;
              inv.khach_can_tra = Math.max(0, totalItemsSum - inv.giam_gia);
              inv.khach_da_tra = inv.khach_can_tra;
            }
          }
        });

        const updatedDb = { ...data };
        importedInvoices.forEach((inv: any) => {
          const idx = updatedDb.Hoa_don.findIndex(existing => existing.id === inv.id);
          if (idx >= 0) {
            updatedDb.Hoa_don[idx] = inv;
          } else {
            updatedDb.Hoa_don.push(inv);
          }
        });

        const res = await fetch("/api/data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedDb)
        });
        const result = await res.json();
        if (result.success) {
          alert(`Đã nhập thành công ${importedInvoices.length} hóa đơn từ file Excel!`);
          onRefreshData();
        } else {
          alert("Lưu dữ liệu hóa đơn Excel thất bại!");
        }
      } catch (err) {
        console.error(err);
        alert("Lỗi đọc file Excel. Vui lòng kiểm tra lại định dạng file.");
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200" id="hoadon_view">
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Main Table Area (takes 3 cols) */}
        <div className="xl:col-span-3 space-y-4">
          {/* Search box styled exactly like products page with Excel buttons */}
          <div className="bg-white rounded-xl shadow-xs border p-2 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="relative w-full sm:w-120">
              <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-gray-400">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                placeholder="Tìm hóa đơn theo mã số, tên khách hàng..."
                value={invoiceSearch}
                onChange={(e) => setInvoiceSearch(e.target.value)}
                className="w-full rounded-md border border-gray-300 py-1.5 pl-8 pr-3 text-xs focus:border-blue-500 focus:outline-hidden text-gray-800 bg-white animate-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-start lg:justify-end">
              {/* Nhập file Excel */}
              <label className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-bold px-2.5 py-1.5 rounded-lg border border-emerald-200 transition-all cursor-pointer shadow-xs select-none shrink-0">
                <FileSpreadsheet className="h-4 w-4" />
                <span>Nhập file Excel</span>
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  className="hidden"
                  onChange={handleImportInvoicesExcel}
                />
              </label>

              {/* Xuất file Excel */}
              <div className="relative">
                <button
                  onClick={() => setShowExportInvoiceMenu(!showExportInvoiceMenu)}
                  className="flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-bold px-2.5 py-1.5 rounded-lg border border-blue-200 transition-all cursor-pointer shadow-xs select-none shrink-0 animate-none"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  <span>Xuất file Excel</span>
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
                {showExportInvoiceMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowExportInvoiceMenu(false)} 
                    />
                    <div className="absolute right-0 mt-1.5 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50 text-left text-xs font-semibold text-gray-700 animate-in fade-in zoom-in-95 duration-100">
                      <button
                        onClick={() => {
                          setShowExportInvoiceMenu(false);
                          handleExportInvoicesOverview();
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                      >
                        Xuất tổng quan
                      </button>
                      <button
                        onClick={() => {
                          setShowExportInvoiceMenu(false);
                          handleExportInvoicesDetail();
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-blue-50 hover:text-blue-700 transition-colors border-t border-gray-100"
                      >
                        Xuất chi tiết
                      </button>
                    </div>
                  </>
                )}
              </div>
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
          <th className="py-2 px-4 w-24">Số hóa đơn</th>
          <th className="py-2 px-4 w-40">Ngày giao dịch</th>
          <th className="py-2 px-4">Khách hàng</th>
          <th className="py-2 px-4 text-right">Tổng tiền hàng</th>
          <th className="py-2 px-4 text-right">Giảm giá</th>
          <th className="py-2 px-4 text-right">Thực thu</th>
          <th className="py-2 px-4">Hình thức</th>
          <th className="py-2 px-4">Trạng thái</th>
          <th className="py-2 px-4 text-center w-28">Hành động</th>
        </tr>
      </thead>
      <tbody className="text-xs text-gray-700">
        {(() => {
          const filtered = data.Hoa_don.filter((inv) => {
            const q = invoiceSearch.toLowerCase().trim();
            const cust = data.Khach_hang.find(c => c.id === inv.id_khach_hang);
            const emp = data.Nhan_vien.find(e => e.id === inv.id_nhan_vien);
            
            const matchSearch = !q || 
              inv.id.toLowerCase().includes(q) || 
              (cust && cust.ho_ten.toLowerCase().includes(q)) || 
              (emp && emp.ho_ten.toLowerCase().includes(q));

            const matchDate = isWithinInvoiceDateFilter(inv.ngay_lap);
            
            const matchPayment = invoicePaymentMethodFilter === "all" || 
              inv.phuong_thuc_thanh_toan === invoicePaymentMethodFilter;

            return matchSearch && matchDate && matchPayment;
          });

          const totalInvoicePages = Math.ceil(filtered.length / invoicePageSize) || 1;
          const safeInvoiceCurrentPage = Math.min(invoiceCurrentPage, totalInvoicePages);
          const startIndex = (safeInvoiceCurrentPage - 1) * invoicePageSize;
          const paginated = filtered.slice(startIndex, startIndex + invoicePageSize);

          return (
            <>
              {paginated.map((inv) => {
                const cust = data.Khach_hang.find((c) => c.id === inv.id_khach_hang);
                return (
                  <tr key={inv.id} className="border-b last:border-0 text-base hover:bg-slate-100/50 transition-colors h-[42px]">
                    <td className="py-1 px-4 font-mono font-semibold text-blue-600 truncate">{inv.id}</td>
                    <td className="py-1 px-4 text-gray-500">{new Date(inv.ngay_lap).toLocaleString("vi-VN")}</td>
                    <td className="py-1 px-4 font-medium text-gray-900 truncate max-w-[150px]">{cust ? cust.ho_ten : "Khách lẻ"}</td>
                    <td className="py-1 px-4 text-right">{formatCurrency(inv.tong_tien_hang)}</td>
                    <td className="py-1 px-4 text-right text-rose-500">-{formatCurrency(inv.giam_gia)}</td>
                    <td className="py-1 px-4 text-right font-bold text-emerald-600">{formatCurrency(inv.khach_can_tra)}</td>
                    <td className="py-1 px-4 font-medium text-gray-600">{inv.phuong_thuc_thanh_toan}</td>
                    <td className="py-1 px-4">
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full font-semibold text-[10px]">
                        {inv.trang_thai}
                      </span>
                    </td>
                    <td className="py-1 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setViewingInvoice(inv)}
                          className="p-1 rounded-full text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                          title="Xem chi tiết"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingInvoice(JSON.parse(JSON.stringify(inv)))}
                          className="p-1 rounded-full text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                          title="Sửa hóa đơn"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteInvoice(inv.id)}
                          className="p-1 rounded-full text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Xóa hóa đơn"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {/* Bù các dòng trống không có border để giữ khung 15 dòng */}
              {paginated.length > 0 && paginated.length < 15 && (
                Array.from({ length: 15 - paginated.length }).map((_, index) => (
                  <tr key={`empty-${index}`} className="h-[42px] border-none">
                    <td colSpan={9}></td>
                  </tr>
                ))
              )}

              {/* Khung trống khi bộ lọc không có hóa đơn nào */}
              {filtered.length === 0 && (
                <tr className="h-[630px] border-none">
                  <td colSpan={9} className="text-center text-gray-400 font-medium vertical-middle">
                    <div className="flex flex-col items-center justify-center h-full gap-2">
                      <FileText className="h-8 w-8 text-gray-300" />
                      <span>Không tìm thấy hóa đơn nào khớp với bộ lọc</span>
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

  {/* Pagination & Row size selector: Cố định vị trí luôn ghim dưới đáy */}
  {(() => {
    const filtered = data.Hoa_don.filter((inv) => {
      const q = invoiceSearch.toLowerCase().trim();
      const cust = data.Khach_hang.find(c => c.id === inv.id_khach_hang);
      const emp = data.Nhan_vien.find(e => e.id === inv.id_nhan_vien);
      
      const matchSearch = !q || 
        inv.id.toLowerCase().includes(q) || 
        (cust && cust.ho_ten.toLowerCase().includes(q)) || 
        (emp && emp.ho_ten.toLowerCase().includes(q));

      const matchDate = isWithinInvoiceDateFilter(inv.ngay_lap);
      
      const matchPayment = invoicePaymentMethodFilter === "all" || 
        inv.phuong_thuc_thanh_toan === invoicePaymentMethodFilter;

      return matchSearch && matchDate && matchPayment;
    });

    const totalInvoicePages = Math.ceil(filtered.length / invoicePageSize) || 1;
    const safeInvoiceCurrentPage = Math.min(invoiceCurrentPage, totalInvoicePages);
    const totalItems = filtered.length;

    const getInvoicePageNumbers = () => {
      const pages = [];
      const maxVisible = 5;
      if (totalInvoicePages <= maxVisible) {
        for (let i = 1; i <= totalInvoicePages; i++) pages.push(i);
      } else {
        if (safeInvoiceCurrentPage <= 3) {
          pages.push(1, 2, 3, 4, "...", totalInvoicePages);
        } else if (safeInvoiceCurrentPage >= totalInvoicePages - 2) {
          pages.push(1, "...", totalInvoicePages - 3, totalInvoicePages - 2, totalInvoicePages - 1, totalInvoicePages);
        } else {
          pages.push(1, "...", safeInvoiceCurrentPage - 1, safeInvoiceCurrentPage, safeInvoiceCurrentPage + 1, "...", totalInvoicePages);
        }
      }
      return pages;
    };

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t bg-gray-50/50 text-xs text-gray-500 font-medium h-[62px]">
        <div className="flex items-center gap-2">
          <span>Hiển thị:</span>
          <select
            value={invoicePageSize}
            onChange={(e) => setInvoicePageSize(Number(e.target.value))}
            className="rounded-md border border-gray-300 bg-white px-2 py-1 focus:border-blue-500 focus:outline-hidden text-gray-700 cursor-pointer text-xs font-semibold"
          >
            <option value={15}>15 dòng</option>
            <option value={30}>30 dòng</option>
            <option value={50}>50 dòng</option>
            <option value={100}>100 dòng</option>
          </select>
          <span className="text-gray-400">|</span>
          <span>
            Hiển thị {totalItems > 0 ? (safeInvoiceCurrentPage - 1) * invoicePageSize + 1 : 0} - {Math.min(safeInvoiceCurrentPage * invoicePageSize, totalItems)} trong {totalItems} hóa đơn
          </span>
        </div>

        {totalInvoicePages > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setInvoiceCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={safeInvoiceCurrentPage === 1}
              className="p-1 rounded-md border border-gray-300 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-white transition-colors cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {getInvoicePageNumbers().map((pNum, idx) => {
              if (pNum === "...") {
                return (
                  <span key={`ellipsis-${idx}`} className="px-2 py-1 text-gray-400 select-none">
                    ...
                  </span>
                );
              }
              return (
                <button
                  key={`page-${pNum}`}
                  onClick={() => setInvoiceCurrentPage(Number(pNum))}
                  className={`px-2.5 py-1 rounded-md border text-xs transition-colors cursor-pointer font-semibold ${
                    safeInvoiceCurrentPage === pNum
                      ? "bg-blue-600 border-blue-600 text-white"
                      : "border-gray-300 bg-white text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {pNum}
                </button>
              );
            })}

            <button
              onClick={() => setInvoiceCurrentPage((prev) => Math.min(prev + 1, totalInvoicePages))}
              disabled={safeInvoiceCurrentPage === totalInvoicePages}
              className="p-1 rounded-md border border-gray-300 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-white transition-colors cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    );
  })()}
</div>
        </div>

        {/* Right Sidebar Filter Area (takes 1 col) */}
        <div className="space-y-6">
          {/* Moved Title here */}
          <div className="bg-[#ff9100] text-white rounded-xl p-3 shadow-sm flex items-center gap-3">
            <FileText className="h-5 w-5 text-blue-400 shrink-0 animate-none" />
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider">Hoá đơn giao dịch</h2>
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
                  name="invoiceDateFilterType"
                  checked={invoiceDateFilterType === "predefined"}
                  onChange={() => setInvoiceDateFilterType("predefined")}
                  className="text-blue-600 focus:ring-blue-500 mt-0.5 h-3.5 w-3.5 bg-white border-gray-300"
                />
                <div className="flex-1">
                  <span>Mốc thời gian có sẵn</span>
                  {invoiceDateFilterType === "predefined" && (
                    <select
                      value={invoicePredefinedDateRange}
                      onChange={(e) => setInvoicePredefinedDateRange(e.target.value)}
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
                  name="invoiceDateFilterType"
                  checked={invoiceDateFilterType === "range"}
                  onChange={() => setInvoiceDateFilterType("range")}
                  className="text-blue-600 focus:ring-blue-500 mt-0.5 h-3.5 w-3.5 bg-white border-gray-300"
                />
                <div className="flex-1">
                  <span>Chọn Từ ngày - Đến ngày</span>
                  {invoiceDateFilterType === "range" && (
                    <div className="mt-1.5 space-y-1.5 animate-in fade-in duration-100">
                      <div>
                        <span className="block text-[9px] text-gray-400 font-semibold uppercase">Từ ngày</span>
                        <input
                          type="date"
                          value={invoiceCustomStartDate}
                          onChange={(e) => setInvoiceCustomStartDate(e.target.value)}
                          className="w-full text-xs rounded-md border border-gray-300 py-1 px-2 focus:border-blue-500 focus:outline-hidden bg-white text-gray-700"
                        />
                      </div>
                      <div>
                        <span className="block text-[9px] text-gray-400 font-semibold uppercase">Đến ngày</span>
                        <input
                          type="date"
                          value={invoiceCustomEndDate}
                          onChange={(e) => setInvoiceCustomEndDate(e.target.value)}
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
                  name="invoiceDateFilterType"
                  checked={invoiceDateFilterType === "all"}
                  onChange={() => setInvoiceDateFilterType("all")}
                  className="text-blue-600 focus:ring-blue-500 h-3.5 w-3.5 bg-white border-gray-300"
                />
                <span>Tất cả thời gian tạo</span>
              </label>
            </div>
          </div>

          {/* Section 2: Phương thức thanh toán */}
          <div className="bg-white rounded-xl shadow-xs border p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 border-b pb-2">
              <CreditCard className="h-4 w-4 text-blue-500" />
              Phương thức thanh toán
            </h3>

            <div className="space-y-1.5">
              {[
                { val: "all", label: "Tất cả phương thức" },
                { val: "Tiền mặt", label: "Tiền mặt" },
                { val: "Chuyển khoản", label: "Chuyển khoản" },
                { val: "Ví", label: "Ví" },
                { val: "Điểm", label: "Điểm" },
                { val: "Voucher", label: "Voucher" }
              ].map((item) => (
                <label
                  key={item.val}
                  className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer hover:text-blue-600 transition-colors"
                >
                  <input
                    type="radio"
                    name="invoicePaymentMethodFilter"
                    checked={invoicePaymentMethodFilter === item.val}
                    onChange={() => setInvoicePaymentMethodFilter(item.val)}
                    className="text-blue-600 focus:ring-blue-500 h-3.5 w-3.5 bg-white border-gray-300"
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* VIEW INVOICE MODAL */}
      {viewingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl overflow-hidden animate-in zoom-in-95 duration-150 border border-slate-200 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between bg-slate-50 border-b border-slate-150 px-5 py-3.5 text-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-800">Chi tiết hóa đơn {viewingInvoice.id}</h3>
              </div>
              <button 
                onClick={() => setViewingInvoice(null)} 
                className="rounded-full p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto text-xs text-gray-700">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border">
                <div>
                  <p className="mb-1"><span className="font-semibold text-gray-500">Ngày lập:</span> {new Date(viewingInvoice.ngay_lap).toLocaleString("vi-VN")}</p>
                  <p className="mb-1">
                    <span className="font-semibold text-gray-500">Khách hàng:</span> {
                      data.Khach_hang.find(c => c.id === viewingInvoice.id_khach_hang)?.ho_ten || "Khách lẻ"
                    }
                  </p>
                  <p><span className="font-semibold text-gray-500">Mã khách hàng:</span> {viewingInvoice.id_khach_hang || "Không có"}</p>
                </div>
                <div>
                  <p className="mb-1">
                    <span className="font-semibold text-gray-500">Nhân viên lập:</span> {
                      data.Nhan_vien.find(e => e.id === viewingInvoice.id_nhan_vien)?.ho_ten || viewingInvoice.id_nhan_vien
                    }
                  </p>
                  <p className="mb-1"><span className="font-semibold text-gray-500">Phương thức thanh toán:</span> {viewingInvoice.phuong_thuc_thanh_toan}</p>
                  <p>
                    <span className="font-semibold text-gray-500">Trạng thái:</span> <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full font-bold text-[10px]">{viewingInvoice.trang_thai}</span>
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-gray-800 mb-2 border-b pb-1">Danh sách sản phẩm mua</h4>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b text-gray-500 font-semibold">
                        <th className="py-2 px-3 w-12 text-center">STT</th>
                        <th className="py-2 px-3">Mã hàng</th>
                        <th className="py-2 px-3">Tên sản phẩm</th>
                        <th className="py-2 px-3 text-right">Số lượng</th>
                        <th className="py-2 px-3 text-right">Đơn giá</th>
                        <th className="py-2 px-3 text-right">Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {viewingInvoice.chi_tiet_san_pham.map((detail, idx) => {
                        const prod = data.San_pham.find(p => p.id === (detail.id_sp || (detail as any).id_san_pham));
                        return (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="py-2 px-3 text-center text-gray-400">{idx + 1}</td>
                            <td className="py-2 px-3 font-mono font-medium">{detail.id_sp || (detail as any).id_san_pham}</td>
                            <td className="py-2 px-3 font-semibold text-slate-800">{prod ? prod.ten_san_pham : "Sản phẩm không tồn tại"}</td>
                            <td className="py-2 px-3 text-right font-semibold">{detail.so_luong}</td>
                            <td className="py-2 px-3 text-right">{formatCurrency(detail.don_gia)}</td>
                            <td className="py-2 px-3 text-right font-bold text-slate-900">{formatCurrency(detail.thanh_tien)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end">
                <div className="w-64 space-y-1.5 border-t pt-3 text-xs font-semibold text-gray-700">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Tổng tiền hàng:</span>
                    <span>{formatCurrency(viewingInvoice.tong_tien_hang)}</span>
                  </div>
                  <div className="flex justify-between text-rose-500">
                    <span>Giảm giá:</span>
                    <span>-{formatCurrency(viewingInvoice.giam_gia)}</span>
                  </div>
                  <div className="flex justify-between text-base font-bold text-emerald-600 border-t pt-1">
                    <span>Khách cần trả:</span>
                    <span>{formatCurrency(viewingInvoice.khach_can_tra)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 border-b pb-1">
                    <span>Khách đã trả:</span>
                    <span>{formatCurrency(viewingInvoice.khach_da_tra)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 border-t px-5 py-3.5 flex justify-end">
              <button 
                onClick={() => setViewingInvoice(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-bold text-xs cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT INVOICE MODAL */}
      {editingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <form onSubmit={handleSaveEditedInvoice} className="w-full max-w-3xl rounded-xl bg-white shadow-xl overflow-hidden animate-in zoom-in-95 duration-150 border border-slate-200 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between bg-slate-50 border-b border-slate-150 px-5 py-3.5 text-slate-800">
              <div className="flex items-center gap-2">
                <Edit className="h-5 w-5 text-amber-600" />
                <h3 className="text-sm font-bold text-slate-800">Chỉnh sửa hóa đơn {editingInvoice.id}</h3>
              </div>
              <button 
                type="button"
                onClick={() => setEditingInvoice(null)} 
                className="rounded-full p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto text-xs text-gray-700">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-gray-400 mb-1">Mã khách hàng</label>
                  <select
                    value={editingInvoice.id_khach_hang}
                    onChange={(e) => setEditingInvoice({ ...editingInvoice, id_khach_hang: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-2 py-1.5 focus:border-blue-500 bg-white"
                  >
                    <option value="KL001">Khách lẻ</option>
                    {data.Khach_hang.map(c => (
                      <option key={c.id} value={c.id}>{c.ho_ten} ({c.id})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-400 mb-1">Nhân viên lập</label>
                  <select
                    value={editingInvoice.id_nhan_vien}
                    onChange={(e) => setEditingInvoice({ ...editingInvoice, id_nhan_vien: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-2 py-1.5 focus:border-blue-500 bg-white"
                  >
                    {data.Nhan_vien.map(e => (
                      <option key={e.id} value={e.id}>{e.ho_ten}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-400 mb-1">Ngày lập</label>
                  <input
                    type="text"
                    value={editingInvoice.ngay_lap}
                    onChange={(e) => setEditingInvoice({ ...editingInvoice, ngay_lap: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-2 py-1.5 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-400 mb-1">Phương thức thanh toán</label>
                  <select
                    value={editingInvoice.phuong_thuc_thanh_toan}
                    onChange={(e) => setEditingInvoice({ ...editingInvoice, phuong_thuc_thanh_toan: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-2 py-1.5 focus:border-blue-500 bg-white"
                  >
                    <option value="Tiền mặt">Tiền mặt</option>
                    <option value="Chuyển khoản">Chuyển khoản</option>
                    <option value="Ví">Ví</option>
                    <option value="Điểm">Điểm</option>
                    <option value="Voucher">Voucher</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-400 mb-1">Trạng thái</label>
                  <select
                    value={editingInvoice.trang_thai}
                    onChange={(e) => setEditingInvoice({ ...editingInvoice, trang_thai: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-2 py-1.5 focus:border-blue-500 bg-white"
                  >
                    <option value="Đã hoàn thành">Đã hoàn thành</option>
                    <option value="Đã hủy">Đã hủy</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-400 mb-1">Giảm giá (VND)</label>
                  <input
                    type="number"
                    min="0"
                    value={editingInvoice.giam_gia}
                    onChange={(e) => {
                      const discount = Number(e.target.value);
                      const reqPay = Math.max(0, editingInvoice.tong_tien_hang - discount);
                      setEditingInvoice({ 
                        ...editingInvoice, 
                        giam_gia: discount, 
                        khach_can_tra: reqPay,
                        khach_da_tra: reqPay // default pay fully
                      });
                    }}
                    className="w-full rounded-md border border-gray-300 px-2 py-1 focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              {/* ITEM ADDITION LINE */}
              <div className="bg-slate-50 p-3 rounded-lg border flex flex-col sm:flex-row sm:items-end gap-3">
                <div className="flex-1">
                  <label className="block font-bold text-gray-500 mb-1">Thêm sản phẩm vào hóa đơn</label>
                  <select
                    value={selectedProductToAdd}
                    onChange={(e) => setSelectedProductToAdd(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-2.5 py-1.5 bg-white text-xs text-gray-800"
                  >
                    <option value="">-- Chọn sản phẩm cần thêm --</option>
                    {data.San_pham.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.ten_san_pham} - {formatCurrency(p.gia_ban)} (Kho: {p.ton_kho})
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={handleAddProductToEditInvoice}
                  disabled={!selectedProductToAdd}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs px-4 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-1 shrink-0 h-[34px]"
                >
                  <Plus className="h-4 w-4" /> Thêm hàng
                </button>
              </div>

              <div>
                <h4 className="font-bold text-gray-800 mb-2 border-b pb-1">Chi tiết hàng hóa và số lượng</h4>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b text-gray-500 font-semibold">
                        <th className="py-2 px-3">Sản phẩm</th>
                        <th className="py-2 px-3 w-28 text-right">Số lượng</th>
                        <th className="py-2 px-3 w-32 text-right">Đơn giá</th>
                        <th className="py-2 px-3 w-32 text-right">Thành tiền</th>
                        <th className="py-2 px-3 w-16 text-center">Xóa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y bg-white">
                      {editingInvoice.chi_tiet_san_pham.map((detail, idx) => {
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
                                    detail.thanh_tien = nextQty * detail.don_gia;
                                    setEditingInvoice({ ...editingInvoice });
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
                                    detail.thanh_tien = val * detail.don_gia;
                                    setEditingInvoice({ ...editingInvoice });
                                  }}
                                  className="w-12 text-center border rounded py-0.5 font-bold"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const nextQty = detail.so_luong + 1;
                                    detail.so_luong = nextQty;
                                    detail.thanh_tien = nextQty * detail.don_gia;
                                    setEditingInvoice({ ...editingInvoice });
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
                                value={detail.don_gia}
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  detail.don_gia = val;
                                  detail.thanh_tien = detail.so_luong * val;
                                  setEditingInvoice({ ...editingInvoice });
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
                                  editingInvoice.chi_tiet_san_pham = editingInvoice.chi_tiet_san_pham.filter((_, i) => i !== idx);
                                  setEditingInvoice({ ...editingInvoice });
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

              {/* Aggregated view */}
              <div className="flex justify-end pt-3">
                <div className="w-72 space-y-2 border-t pt-3 font-semibold text-gray-700">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Tạm tính tổng tiền hàng:</span>
                    <span>{formatCurrency(editingInvoice.chi_tiet_san_pham.reduce((acc, d) => acc + d.thanh_tien, 0))}</span>
                  </div>
                  <div className="flex justify-between text-xs text-rose-500">
                    <span>Khấu trừ giảm giá:</span>
                    <span>-{formatCurrency(editingInvoice.giam_gia)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-emerald-600 border-t pt-1">
                    <span>Thành tiền (Khách cần trả):</span>
                    <span>{formatCurrency(Math.max(0, editingInvoice.chi_tiet_san_pham.reduce((acc, d) => acc + d.thanh_tien, 0) - editingInvoice.giam_gia))}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Thực tế đã thanh toán:</span>
                    <input
                      type="number"
                      min="0"
                      value={editingInvoice.khach_da_tra}
                      onChange={(e) => setEditingInvoice({ ...editingInvoice, khach_da_tra: Number(e.target.value) })}
                      className="w-32 text-right border rounded py-0.5 font-mono px-1 font-bold text-emerald-600 bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 border-t px-5 py-3.5 flex justify-end gap-2 shrink-0">
              <button 
                type="button"
                onClick={() => setEditingInvoice(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-bold text-xs cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button 
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold text-xs cursor-pointer"
              >
                Lưu thay đổi
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
