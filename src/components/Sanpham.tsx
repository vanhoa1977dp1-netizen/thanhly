import React, { useState } from "react";
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  Layers,
  Calendar,
  Truck,
  Bookmark,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import * as XLSX from "xlsx";
import { DatabaseSchema, Product } from "../types";
import AddProductModal from "./AddProductModal";

interface SanphamProps {
  data: DatabaseSchema;
  onRefreshData: () => void;
}

export default function Sanpham({ data, onRefreshData }: SanphamProps) {
  // Search and Filter States
  const [productSearch, setProductSearch] = useState("");
  const [productCatFilter, setProductCatFilter] = useState("");
  const [productBrandFilter, setProductBrandFilter] = useState("");
  const [productStockFilter, setProductStockFilter] = useState<"all" | "instock" | "outstock" | "custom">("all");
  const [customStockMin, setCustomStockMin] = useState<number>(0);
  const [customStockMax, setCustomStockMax] = useState<number>(100);
  const [productDateFilterType, setProductDateFilterType] = useState<"all" | "predefined" | "range">("all");
  const [predefinedDateRange, setPredefinedDateRange] = useState<string>("all");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");
  const [productSupplierFilter, setProductSupplierFilter] = useState("");
  const [productTichDiemFilter, setProductTichDiemFilter] = useState<"all" | "yes" | "no">("all");
  const [productBanTrucTiepFilter, setProductBanTrucTiepFilter] = useState<"all" | "yes" | "no">("all");
  const [productKinhDoanhFilter, setProductKinhDoanhFilter] = useState<"all" | "active" | "stopped">("all");

  // Pagination states
  const [pageSize, setPageSize] = useState<number>(15);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Reset page to 1 when filters or page size change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [
    productSearch,
    productCatFilter,
    productBrandFilter,
    productStockFilter,
    customStockMin,
    customStockMax,
    productDateFilterType,
    predefinedDateRange,
    customStartDate,
    customEndDate,
    productSupplierFilter,
    productTichDiemFilter,
    productBanTrucTiepFilter,
    productKinhDoanhFilter,
    pageSize
  ]);

  // Modals state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Quick Inline Creators
  const [showQuickAddType, setShowQuickAddType] = useState<"category" | "brand" | "supplier" | null>(null);
  const [newCatName, setNewCatName] = useState("");
  const [newCatDesc, setNewCatDesc] = useState("");
  const [newBrandName, setNewBrandName] = useState("");
  const [newBrandOrigin, setNewBrandOrigin] = useState("");
  const [newSupplierName, setNewSupplierName] = useState("");
  const [newSupplierContact, setNewSupplierContact] = useState("");
  const [newSupplierPhone, setNewSupplierPhone] = useState("");
  const [newSupplierAddress, setNewSupplierAddress] = useState("");

  // Export products to standard Excel file
  const handleExportExcel = () => {
    try {
      const exportData = data.San_pham.map((p) => ({
        "Mã hàng": p.id,
        "tên hàng hoá": p.ten_san_pham,
        "Giá bán": p.gia_ban,
        "Tồn kho": p.ton_kho,
        "Giá vốn": p.gia_von,
        "link hình ảnh sản phẩm": p.hinh_anh || "",
      }));
      
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Danh sách Sản phẩm");
      XLSX.writeFile(wb, "danh_sach_san_pham.xlsx");
    } catch (e) {
      console.error(e);
      alert("Xuất excel thất bại");
    }
  };

  // Import products from standard Excel file
  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
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

        const importedProducts = rawData.map((row: any) => {
          const sku = row["Mã hàng"] || row["Mã SKU"] || row["id"] || row["sku"] || `SP${Math.floor(100000 + Math.random() * 900000)}`;
          const ten = row["tên hàng hoá"] || row["Tên sản phẩm"] || row["ten_san_pham"] || row["Tên hàng hóa"] || "Sản phẩm mới nhập";
          const ban = Number(row["Giá bán"] || row["gia_ban"] || 0);
          const ton = Number(row["Tồn kho"] || row["ton_kho"] || 0);
          const von = Number(row["Giá vốn"] || row["gia_von"] || 0);
          const linkAnh = row["link hình ảnh sản phẩm"] || row["hinh_anh"] || "";

          // Preserving other existing fields if editing an existing product
          const existingProd = data.San_pham.find(p => p.id === sku);

          return {
            id: sku,
            ten_san_pham: ten,
            id_nhom_hang: existingProd?.id_nhom_hang || data.Nhom_hang[0]?.id || "DM001",
            id_thuong_hieu: existingProd?.id_thuong_hieu || data.Thuong_hieu[0]?.id || "TH001",
            gia_von: von,
            gia_ban: ban,
            ton_kho: ton,
            don_vi_tinh: existingProd?.don_vi_tinh || "Cái",
            bar_code: existingProd?.bar_code || sku,
            trang_thai: existingProd?.trang_thai || "Đang kinh doanh",
            tich_diem: existingProd?.tich_diem !== undefined ? existingProd.tich_diem : true,
            ban_truc_tiep: existingProd?.ban_truc_tiep !== undefined ? existingProd.ban_truc_tiep : true,
            ngay_tao: existingProd?.ngay_tao || new Date().toISOString(),
            id_nha_cung_cap: existingProd?.id_nha_cung_cap || "NCC00001",
            hinh_anh: linkAnh
          };
        });

        const updatedDb = { ...data };
        importedProducts.forEach((p: any) => {
          const idx = updatedDb.San_pham.findIndex(existing => existing.id === p.id);
          if (idx >= 0) {
            updatedDb.San_pham[idx] = p;
          } else {
            updatedDb.San_pham.push(p);
          }
        });

        const res = await fetch("/api/data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedDb)
        });
        const result = await res.json();
        if (result.success) {
          alert(`Đã nhập thành công ${importedProducts.length} sản phẩm từ file Excel!`);
          onRefreshData();
        } else {
          alert("Lưu dữ liệu Excel thất bại!");
        }
      } catch (err) {
        console.error(err);
        alert("Lỗi đọc file Excel. Vui lòng kiểm tra lại định dạng file.");
      }
    };
    reader.readAsBinaryString(file);
  };

  // Currency formatter
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("vi-VN").format(val);
  };

  // Check product creation date filters
  const isWithinDateFilter = (productDateStr?: string) => {
    if (!productDateStr) return true;
    const prodDate = new Date(productDateStr);
    if (isNaN(prodDate.getTime())) return true;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);

    if (productDateFilterType === "all") {
      return true;
    }

    if (productDateFilterType === "predefined") {
      switch (predefinedDateRange) {
        case "today": {
          return prodDate >= startOfToday;
        }
        case "yesterday": {
          const endOfYesterday = new Date(startOfToday);
          return prodDate >= startOfYesterday && prodDate < endOfYesterday;
        }
        case "this_week": {
          const day = startOfToday.getDay();
          const diff = startOfToday.getDate() - day + (day === 0 ? -6 : 1);
          const startOfWeek = new Date(startOfToday);
          startOfWeek.setDate(diff);
          startOfWeek.setHours(0, 0, 0, 0);
          return prodDate >= startOfWeek;
        }
        case "last_week": {
          const day = startOfToday.getDay();
          const diff = startOfToday.getDate() - day + (day === 0 ? -6 : 1);
          const startOfWeek = new Date(startOfToday);
          startOfWeek.setDate(diff);
          startOfWeek.setHours(0, 0, 0, 0);
          const startOfLastWeek = new Date(startOfWeek);
          startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);
          return prodDate >= startOfLastWeek && prodDate < startOfWeek;
        }
        case "last_7_days": {
          const limit = new Date(startOfToday);
          limit.setDate(limit.getDate() - 7);
          return prodDate >= limit;
        }
        case "this_month": {
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          return prodDate >= startOfMonth;
        }
        case "last_month": {
          const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          return prodDate >= startOfLastMonth && prodDate < endOfLastMonth;
        }
        case "this_quarter": {
          const currentQuarter = Math.floor(now.getMonth() / 3);
          const startOfQuarter = new Date(now.getFullYear(), currentQuarter * 3, 1);
          return prodDate >= startOfQuarter;
        }
        case "last_quarter": {
          const currentQuarter = Math.floor(now.getMonth() / 3);
          const startOfLastQuarter = new Date(now.getFullYear(), (currentQuarter - 1) * 3, 1);
          const endOfLastQuarter = new Date(now.getFullYear(), currentQuarter * 3, 1);
          return prodDate >= startOfLastQuarter && prodDate < endOfLastQuarter;
        }
        case "this_year": {
          const startOfYear = new Date(now.getFullYear(), 0, 1);
          return prodDate >= startOfYear;
        }
        case "last_year": {
          const startOfLastYear = new Date(now.getFullYear() - 1, 0, 1);
          const endOfLastYear = new Date(now.getFullYear(), 0, 1);
          return prodDate >= startOfLastYear && prodDate < endOfLastYear;
        }
        case "all":
        default:
          return true;
      }
    }

    if (productDateFilterType === "range") {
      if (customStartDate) {
        const start = new Date(customStartDate);
        start.setHours(0, 0, 0, 0);
        if (prodDate < start) return false;
      }
      if (customEndDate) {
        const end = new Date(customEndDate);
        end.setHours(23, 59, 59, 999);
        if (prodDate > end) return false;
      }
      return true;
    }

    return true;
  };

  // Add / Edit Product Submit
  const handleSaveProduct = async (productFields: Omit<Product, "id">) => {
    const payload = editingProduct 
      ? { ...productFields, id: editingProduct.id }
      : productFields;

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      if (result.success) {
        setIsProductModalOpen(false);
        setEditingProduct(null);
        onRefreshData();
      } else {
        alert("Lưu sản phẩm thất bại!");
      }
    } catch (e) {
      console.error(e);
      alert("Lỗi kết nối máy chủ");
    }
  };

  // Safe delete handler
  const handleDeleteProduct = async (id: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa sản phẩm này (${id}) khỏi hệ thống?`)) return;
    
    const updated = { ...data };
    updated.San_pham = updated.San_pham.filter(p => p.id !== id);

    try {
      const res = await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated)
      });
      const result = await res.json();
      if (result.success) {
        onRefreshData();
      } else {
        alert("Xóa thất bại!");
      }
    } catch (e) {
      console.error(e);
      alert("Lỗi kết nối máy chủ");
    }
  };

  // Add category handler
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ten_nhom: newCatName.trim(), mo_ta: newCatDesc.trim() })
      });
      if ((await res.json()).success) {
        setNewCatName("");
        setNewCatDesc("");
        setShowQuickAddType(null);
        onRefreshData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Add brand handler
  const handleAddBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrandName.trim()) return;
    try {
      const res = await fetch("/api/brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ten_thuong_hieu: newBrandName.trim(), quoc_gia: newBrandOrigin.trim() })
      });
      if ((await res.json()).success) {
        setNewBrandName("");
        setNewBrandOrigin("");
        setShowQuickAddType(null);
        onRefreshData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Add supplier handler
  const handleAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupplierName.trim()) return;
    try {
      const res = await fetch("/api/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ten_nha_cung_cap: newSupplierName.trim(),
          nguoi_lien_he: newSupplierContact.trim(),
          so_dien_thoai: newSupplierPhone.trim(),
          dia_chi: newSupplierAddress.trim(),
          cong_no_hien_tai: 0
        })
      });
      if ((await res.json()).success) {
        setNewSupplierName("");
        setNewSupplierContact("");
        setNewSupplierPhone("");
        setNewSupplierAddress("");
        setShowQuickAddType(null);
        onRefreshData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Filter products and perform pagination
  const filteredProducts = data.San_pham.filter((p) => {
    const q = productSearch.toLowerCase().trim();
    const matchesSearch = !q || p.ten_san_pham.toLowerCase().includes(q) || p.id.toLowerCase().includes(q) || (p.bar_code && p.bar_code.includes(q));
    const matchesCat = !productCatFilter || p.id_nhom_hang === productCatFilter;
    const matchesBrand = !productBrandFilter || p.id_thuong_hieu === productBrandFilter;
    
    // Stock level filter
    let matchesStock = true;
    if (productStockFilter === "instock") {
      matchesStock = p.ton_kho > 0;
    } else if (productStockFilter === "outstock") {
      matchesStock = p.ton_kho <= 0;
    } else if (productStockFilter === "custom") {
      matchesStock = p.ton_kho >= customStockMin && p.ton_kho <= customStockMax;
    }

    // Date filter
    const matchesDate = isWithinDateFilter(p.ngay_tao);

    // Supplier filter
    const matchesSupplier = !productSupplierFilter || p.id_nha_cung_cap === productSupplierFilter;

    // Point reward eligibility
    const matchesTichDiem = productTichDiemFilter === "all" ||
      (productTichDiemFilter === "yes" && p.tich_diem === true) ||
      (productTichDiemFilter === "no" && p.tich_diem === false);

    // Direct sale eligibility
    const matchesBanTrucTiep = productBanTrucTiepFilter === "all" ||
      (productBanTrucTiepFilter === "yes" && p.ban_truc_tiep === true) ||
      (productBanTrucTiepFilter === "no" && p.ban_truc_tiep === false);

    // Business state
    const matchesKinhDoanh = productKinhDoanhFilter === "all" ||
      (productKinhDoanhFilter === "active" && p.trang_thai === "Đang kinh doanh") ||
      (productKinhDoanhFilter === "stopped" && p.trang_thai === "Ngừng kinh doanh");

    return matchesSearch && matchesCat && matchesBrand && matchesStock && matchesDate && matchesSupplier && matchesTichDiem && matchesBanTrucTiep && matchesKinhDoanh;
  });

  const totalItems = filteredProducts.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const activePage = Math.min(currentPage, totalPages || 1);
  const displayedProducts = filteredProducts.slice((activePage - 1) * pageSize, activePage * pageSize);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (activePage <= 3) {
        pages.push(1, 2, 3, 4, "...", totalPages);
      } else if (activePage >= totalPages - 2) {
        pages.push(1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, "...", activePage - 1, activePage, activePage + 1, "...", totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="space-y-6">
      {/* Sub grid layout for category and brand shortcuts */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        {/* Main Product Table Area (takes 3 cols) */}
        <div className="xl:col-span-3 space-y-4">
          <div className="bg-white rounded-xl shadow-xs border p-2 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Search box (Number 2 - shortened) */}
            <div className="relative w-full sm:w-120">
              <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-gray-400">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                placeholder="Tìm sản phẩm theo tên, mã hàng, barcode..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full rounded-md border border-gray-300 py-1.5 pl-8 pr-3 text-xs focus:border-blue-500 focus:outline-hidden text-gray-800 bg-white animate-none"
              />
            </div>

            {/* Actions (Add product first, followed by Excel import/export on the right) */}
            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-start lg:justify-end">
              {/* "+ Thêm sản phẩm mới" button (Number 3) */}
              <button
                onClick={() => {
                  setEditingProduct(null);
                  setIsProductModalOpen(true);
                }}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold px-4 py-2 rounded-lg transition-all shadow-md cursor-pointer shrink-0"
              >
                <Plus className="h-4 w-4" />
                Thêm sản phẩm mới
              </button>

              {/* Nhập file Excel */}
              <label className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-bold px-2.5 py-1.5 rounded-lg border border-emerald-200 transition-all cursor-pointer shadow-xs select-none shrink-0">
                <FileSpreadsheet className="h-4 w-4" />
                <span>Nhập file Excel</span>
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  className="hidden"
                  onChange={handleImportExcel}
                />
              </label>

              {/* Xuất file Excel */}
              <button
                onClick={handleExportExcel}
                className="flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-bold px-2.5 py-1.5 rounded-lg border border-blue-200 transition-all cursor-pointer shadow-xs select-none shrink-0"
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span>Xuất file Excel</span>
              </button>
            </div>
          </div>

          {/* Main Product grid */}
          <div className="bg-white rounded-xl shadow-xs border overflow-hidden flex flex-col h-[812px]"> 
  {/* Chiều cao tổng cố định 812px chuẩn khít cho 15 dòng, header và pagination */}
  
  {/* Thêm style và tinh chỉnh class để ẩn scrollbar hoàn toàn trên mọi trình duyệt */}
  <div 
    className="overflow-x-auto flex-1 [&::-webkit-scrollbar]:hidden" 
    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
  >
    <table className="w-full text-left table-layout-fixed">
      <thead>
        <tr className="border-b text-gray-500 text-xs font-semibold bg-gray-50/50 h-[40px]">
          <th className="py-2 px-4 w-14 text-center"></th>
          <th className="py-2 px-4 w-28">Mã hàng</th>
          <th className="py-2 px-4">Tên hàng hóa</th>
          <th className="py-2 px-4 text-right">Giá bán</th>
          <th className="py-2 pl-20 text-center">Tồn kho</th>
          <th className="py-2 px-4 text-right">Giá vốn</th>
          <th className="py-2 px-4 text-center">Hành động</th>
        </tr>
      </thead>
      
      <tbody className="text-xs text-gray-700">
        {displayedProducts.map((p) => (
          <tr key={p.id} className="border-b last:border-0 hover:bg-slate-100/50 transition-colors h-[48px]">
            <td className="py-1 px-4 text-center">
              {p.hinh_anh ? (
                <img
                  src={p.hinh_anh}
                  alt={p.ten_san_pham}
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 object-cover rounded-md border border-gray-100 shadow-2xs mx-auto"
                  onError={(e) => {
                    e.currentTarget.src = "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=100&q=80";
                  }}
                />
              ) : (
                <div className="w-8 h-8 bg-slate-50 border border-slate-100 rounded-md flex items-center justify-center text-slate-400 mx-auto">
                  <Package className="h-4 w-4" />
                </div>
              )}
            </td>
            <td className="py-1 px-4 font-medium text-base text-gray-900">{p.id}</td>
            <td className="py-1 px-4 font-medium text-base text-gray-900 truncate max-w-[200px]">{p.ten_san_pham}</td>
            <td className="py-1 px-4 text-right font-medium text-base text-blue-600">{formatCurrency(p.gia_ban)}</td>
            <td className="py-1 pl-20 text-center font-medium text-base">
              <span className={p.ton_kho > 5 ? "text-emerald-600" : "text-rose-500"}>
                {p.ton_kho}
              </span>
            </td>
            <td className="py-1 px-4 text-right text-base text-gray-500">{formatCurrency(p.gia_von)}</td>
            <td className="py-1 px-4">
              <div className="flex items-center justify-center gap-1">
                <button
                  onClick={() => {
                    setEditingProduct(p);
                    setIsProductModalOpen(true);
                  }}
                  className="p-1 rounded-full text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                  title="Sửa"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => handleDeleteProduct(p.id)}
                  className="p-1 rounded-full text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Xóa"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </td>
          </tr>
        ))}

        {/* Các dòng trống bù vào cho đủ 15 dòng: Không có border kẻ dòng */}
        {displayedProducts.length > 0 && displayedProducts.length < 15 && (
          Array.from({ length: 15 - displayedProducts.length }).map((_, index) => (
            <tr key={`empty-${index}`} className="h-[48px] border-none">
              <td colSpan={7}></td>
            </tr>
          ))
        )}

        {/* Khi hoàn toàn không có dữ liệu: Giữ khung sạch và hiện text thông báo ở giữa */}
        {displayedProducts.length === 0 && (
          <tr className="h-[720px] border-none">
            <td colSpan={7} className="text-center text-gray-400 font-medium vertical-middle">
              <div className="flex flex-col items-center justify-center h-full gap-2">
                <Package className="h-8 w-8 text-gray-300" />
                <span>Không tìm thấy sản phẩm nào khớp với bộ lọc</span>
              </div>
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>

  {/* Pagination: Cố định 52px ở đáy */}
  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t bg-gray-50/50 text-xs text-gray-500 font-medium h-[52px]">
    <div className="flex items-center gap-2">
      <span>Hiển thị:</span>
      <select
        value={pageSize}
        onChange={(e) => setPageSize(Number(e.target.value))}
        className="rounded-md border border-gray-300 bg-white px-2 py-1 focus:border-blue-500 focus:outline-hidden text-gray-700 cursor-pointer text-xs font-semibold"
      >
        <option value={15}>15 dòng</option>
        <option value={30}>30 dòng</option>
        <option value={50}>50 dòng</option>
        <option value={100}>100 dòng</option>
      </select>
      <span className="text-gray-400">|</span>
      <span>
        Hiển thị {totalItems > 0 ? (activePage - 1) * pageSize + 1 : 0} - {Math.min(activePage * pageSize, totalItems)} trong {totalItems} hàng hóa
      </span>
    </div>

    {totalPages > 1 && (
      <div className="flex items-center gap-1">
        <button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={activePage === 1}
          className="p-1 rounded-md border border-gray-300 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-white transition-colors cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {getPageNumbers().map((pNum, idx) => {
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
              onClick={() => setCurrentPage(Number(pNum))}
              className={`px-2.5 py-1 rounded-md border text-xs transition-colors cursor-pointer font-semibold ${
                activePage === pNum
                  ? "bg-blue-600 border-blue-600 text-white"
                  : "border-gray-300 bg-white text-gray-600 hover:bg-gray-100"
              }`}
            >
              {pNum}
            </button>
          );
        })}

        <button
          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
          disabled={activePage === totalPages}
          className="p-1 rounded-md border border-gray-300 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-white transition-colors cursor-pointer"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    )}
  </div>
</div>
        </div>

        <div className="space-y-6">
          {/* Moved Title here */}
          <div className="bg-[#ff9100] text-white rounded-xl p-2 shadow-sm flex items-center gap-2.5">
            <Package className="h-5.5 w-5.5 text-blue-400 shrink-0 animate-pulse" />
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider">Quản lý Sản phẩm</h2>
              <p className="text-[10px] text-slate-300 font-medium">Danh mục & Tồn kho hệ thống</p>
            </div>
          </div>
          
          {/* Section 1: Nhóm ngành hàng / Thương hiệu (có Tạo mới) */}
          <div className="bg-white rounded-xl shadow-xs border p-4 space-y-3">
            <div className="border-b pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Layers className="h-4 w-4 text-blue-500" />
                Nhóm ngành hàng & Thương hiệu
              </h3>
            </div>
            
            {/* Filter Category with individual Create button */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-[10px] uppercase font-bold text-gray-400">Nhóm ngành hàng</label>
                <button
                  onClick={() => setShowQuickAddType(showQuickAddType === "category" ? null : "category")}
                  className={`text-[9px] font-bold px-2 py-0.5 rounded-full transition-all flex items-center gap-0.5 border cursor-pointer ${
                    showQuickAddType === "category"
                      ? "bg-blue-600 border-blue-600 text-white"
                      : "bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100"
                  }`}
                  title="Tạo nhanh nhóm ngành hàng mới"
                >
                  <Plus className="h-2.5 w-2.5" />
                  Tạo mới
                </button>
              </div>
              <select
                value={productCatFilter}
                onChange={(e) => setProductCatFilter(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-xs focus:border-blue-500 focus:outline-hidden text-gray-700 bg-white"
              >
                <option value="">Tất cả nhóm hàng</option>
                {data.Nhom_hang.map((c) => (
                  <option key={c.id} value={c.id}>{c.ten_nhom}</option>
                ))}
              </select>
            </div>

            {/* Quick Add Category Form */}
            {showQuickAddType === "category" && (
              <div className="rounded-lg bg-blue-50/50 p-2.5 border border-blue-100 space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="text-[11px] font-bold text-blue-800 flex items-center gap-1">
                  <Plus className="h-3 w-3" />
                  <span>Tạo Nhóm Ngành Hàng Mới</span>
                </div>
                <form onSubmit={handleAddCategory} className="space-y-1.5">
                  <input
                    type="text"
                    placeholder="Tên nhóm mới..."
                    required
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="w-full text-xs rounded-md border border-gray-300 py-1 px-2 focus:border-blue-500 focus:outline-hidden bg-white text-gray-800"
                  />
                  <input
                    type="text"
                    placeholder="Mô tả nhóm..."
                    value={newCatDesc}
                    onChange={(e) => setNewCatDesc(e.target.value)}
                    className="w-full text-xs rounded-md border border-gray-300 py-1 px-2 focus:border-blue-500 focus:outline-hidden bg-white text-gray-800"
                  />
                  <div className="flex gap-1.5">
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[10px] py-1 rounded transition-colors uppercase tracking-wider cursor-pointer"
                    >
                      Lưu nhóm hàng
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowQuickAddType(null)}
                      className="px-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-[10px] py-1 rounded transition-colors cursor-pointer"
                    >
                      Hủy
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Filter Brand with individual Create button */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-[10px] uppercase font-bold text-gray-400">Thương hiệu</label>
                <button
                  onClick={() => setShowQuickAddType(showQuickAddType === "brand" ? null : "brand")}
                  className={`text-[9px] font-bold px-2 py-0.5 rounded-full transition-all flex items-center gap-0.5 border cursor-pointer ${
                    showQuickAddType === "brand"
                      ? "bg-emerald-600 border-emerald-600 text-white"
                      : "bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100"
                  }`}
                  title="Tạo nhanh thương hiệu mới"
                >
                  <Plus className="h-2.5 w-2.5" />
                  Tạo mới
                </button>
              </div>
              <select
                value={productBrandFilter}
                onChange={(e) => setProductBrandFilter(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-xs focus:border-blue-500 focus:outline-hidden text-gray-700 bg-white"
              >
                <option value="">Tất cả thương hiệu</option>
                {data.Thuong_hieu.map((b) => (
                  <option key={b.id} value={b.id}>{b.ten_thuong_hieu}</option>
                ))}
              </select>
            </div>

            {/* Quick Add Brand Form */}
            {showQuickAddType === "brand" && (
              <div className="rounded-lg bg-emerald-50/50 p-2.5 border border-emerald-100 space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="text-[11px] font-bold text-emerald-800 flex items-center gap-1">
                  <Plus className="h-3 w-3" />
                  <span>Tạo Thương Hiệu Mới</span>
                </div>
                <form onSubmit={handleAddBrand} className="space-y-1.5">
                  <input
                    type="text"
                    placeholder="Tên hãng mới..."
                    required
                    value={newBrandName}
                    onChange={(e) => setNewBrandName(e.target.value)}
                    className="w-full text-xs rounded-md border border-gray-300 py-1 px-2 focus:border-blue-500 focus:outline-hidden bg-white text-gray-800"
                  />
                  <input
                    type="text"
                    placeholder="Xuất xứ (ví dụ: Mỹ, Nhật)..."
                    value={newBrandOrigin}
                    onChange={(e) => setNewBrandOrigin(e.target.value)}
                    className="w-full text-xs rounded-md border border-gray-300 py-1 px-2 focus:border-blue-500 focus:outline-hidden bg-white text-gray-800"
                  />
                  <div className="flex gap-1.5">
                    <button
                      type="submit"
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[10px] py-1 rounded transition-colors uppercase tracking-wider cursor-pointer"
                    >
                      Lưu thương hiệu
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowQuickAddType(null)}
                      className="px-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-[10px] py-1 rounded transition-colors cursor-pointer"
                    >
                      Hủy
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Section 2: Tồn kho ( Còn hàng/Hết hàng/Tuỳ chỉnh giá trị tồn) */}
          <div className="bg-white rounded-xl shadow-xs border p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 border-b pb-2">
              <Package className="h-4 w-4 text-orange-500" />
              Lọc theo Tồn Kho
            </h3>
            
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer">
                <input
                  type="radio"
                  name="stockFilter"
                  checked={productStockFilter === "all"}
                  onChange={() => setProductStockFilter("all")}
                  className="text-blue-600 focus:ring-blue-500 h-3.5 w-3.5 bg-white border-gray-300"
                />
                <span>Tất cả lượng tồn</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer">
                <input
                  type="radio"
                  name="stockFilter"
                  checked={productStockFilter === "instock"}
                  onChange={() => setProductStockFilter("instock")}
                  className="text-blue-600 focus:ring-blue-500 h-3.5 w-3.5 bg-white border-gray-300"
                />
                <span className="text-emerald-600 font-semibold">Còn hàng trong kho (&gt; 0)</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer">
                <input
                  type="radio"
                  name="stockFilter"
                  checked={productStockFilter === "outstock"}
                  onChange={() => setProductStockFilter("outstock")}
                  className="text-blue-600 focus:ring-blue-500 h-3.5 w-3.5 bg-white border-gray-300"
                />
                <span className="text-rose-600 font-semibold">Hết hàng trong kho (≤ 0)</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer">
                <input
                  type="radio"
                  name="stockFilter"
                  checked={productStockFilter === "custom"}
                  onChange={() => setProductStockFilter("custom")}
                  className="text-blue-600 focus:ring-blue-500 h-3.5 w-3.5 bg-white border-gray-300"
                />
                <span>Tùy chỉnh giá trị tồn</span>
              </label>
            </div>

            {productStockFilter === "custom" && (
              <div className="pt-2 grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-gray-500 mb-1">Tối thiểu</label>
                  <input
                    type="number"
                    min="0"
                    value={customStockMin}
                    onChange={(e) => setCustomStockMin(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full text-xs rounded-md border border-gray-300 py-1 px-2 focus:border-blue-500 focus:outline-hidden bg-white text-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-500 mb-1">Tối đa</label>
                  <input
                    type="number"
                    min="0"
                    value={customStockMax}
                    onChange={(e) => setCustomStockMax(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full text-xs rounded-md border border-gray-300 py-1 px-2 focus:border-blue-500 focus:outline-hidden bg-white text-gray-800"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Tìm theo thời gian tạo */}
          <div className="bg-white rounded-xl shadow-xs border p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 border-b pb-2">
              <Calendar className="h-4 w-4 text-purple-500" />
              Thời gian tạo hàng hóa
            </h3>
            
            <div className="space-y-2.5">
              {/* Radio 1: Predefined ranges */}
              <label className="flex items-start gap-2 text-xs font-medium text-gray-700 cursor-pointer">
                <input
                  type="radio"
                  name="dateFilterType"
                  checked={productDateFilterType === "predefined"}
                  onChange={() => {
                    setProductDateFilterType("predefined");
                    if (predefinedDateRange === "all" || predefinedDateRange === "") {
                      setPredefinedDateRange("today");
                    }
                  }}
                  className="text-blue-600 focus:ring-blue-500 mt-0.5 h-3.5 w-3.5 bg-white border-gray-300"
                />
                <div className="flex-1">
                  <span>Khoảng thời gian định sẵn</span>
                  {productDateFilterType === "predefined" && (
                    <select
                      value={predefinedDateRange}
                      onChange={(e) => setPredefinedDateRange(e.target.value)}
                      className="mt-1.5 w-full rounded-md border border-gray-300 px-2 py-1 text-xs focus:border-blue-500 focus:outline-hidden text-gray-700 bg-white"
                    >
                      <option value="today">Hôm nay</option>
                      <option value="yesterday">Hôm qua</option>
                      <option value="this_week">Tuần này</option>
                      <option value="last_week">Tuần trước</option>
                      <option value="last_7_days">7 ngày qua</option>
                      <option value="this_month">Tháng này</option>
                      <option value="last_month">Tháng trước</option>
                      <option value="this_quarter">Quý này</option>
                      <option value="last_quarter">Quý trước</option>
                      <option value="this_year">Năm nay</option>
                      <option value="last_year">Năm trước</option>
                      <option value="all">Toàn thời gian</option>
                    </select>
                  )}
                </div>
              </label>

              {/* Radio 2: Custom date range */}
              <label className="flex items-start gap-2 text-xs font-medium text-gray-700 cursor-pointer">
                <input
                  type="radio"
                  name="dateFilterType"
                  checked={productDateFilterType === "range"}
                  onChange={() => setProductDateFilterType("range")}
                  className="text-blue-600 focus:ring-blue-500 mt-0.5 h-3.5 w-3.5 bg-white border-gray-300"
                />
                <div className="flex-1">
                  <span>Chọn Từ ngày - Đến ngày</span>
                  {productDateFilterType === "range" && (
                    <div className="mt-1.5 space-y-1.5">
                      <div>
                        <span className="block text-[9px] text-gray-400 font-semibold uppercase">Từ ngày</span>
                        <input
                          type="date"
                          value={customStartDate}
                          onChange={(e) => setCustomStartDate(e.target.value)}
                          className="w-full text-xs rounded-md border border-gray-300 py-1 px-2 focus:border-blue-500 focus:outline-hidden bg-white text-gray-800"
                        />
                      </div>
                      <div>
                        <span className="block text-[9px] text-gray-400 font-semibold uppercase">Đến ngày</span>
                        <input
                          type="date"
                          value={customEndDate}
                          onChange={(e) => setCustomEndDate(e.target.value)}
                          className="w-full text-xs rounded-md border border-gray-300 py-1 px-2 focus:border-blue-500 focus:outline-hidden bg-white text-gray-800"
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
                  name="dateFilterType"
                  checked={productDateFilterType === "all"}
                  onChange={() => setProductDateFilterType("all")}
                  className="text-blue-600 focus:ring-blue-500 h-3.5 w-3.5 bg-white border-gray-300"
                />
                <span>Tất cả thời gian tạo</span>
              </label>
            </div>
          </div>

          {/* Section 4: Nhà cung cấp */}
          <div className="bg-white rounded-xl shadow-xs border p-4 space-y-3">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Truck className="h-4 w-4 text-blue-500" />
                Nhà cung cấp
              </h3>
              <button
                onClick={() => setShowQuickAddType(showQuickAddType === "supplier" ? null : "supplier")}
                className={`text-[9px] font-bold px-2 py-0.5 rounded-full transition-all flex items-center gap-0.5 border cursor-pointer ${
                  showQuickAddType === "supplier"
                    ? "bg-blue-600 border-blue-600 text-white"
                    : "bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100"
                }`}
                title="Tạo nhanh nhà cung cấp mới"
              >
                <Plus className="h-2.5 w-2.5" />
                Tạo mới
              </button>
            </div>
            
            <div>
              <select
                value={productSupplierFilter}
                onChange={(e) => setProductSupplierFilter(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-xs focus:border-blue-500 focus:outline-hidden text-gray-700 bg-white"
              >
                <option value="">Tất cả nhà cung cấp</option>
                {data.Nha_cung_cap.map((s) => (
                  <option key={s.id} value={s.id}>{s.ten_nha_cung_cap}</option>
                ))}
              </select>
            </div>

            {/* Quick Add Supplier Form */}
            {showQuickAddType === "supplier" && (
              <div className="rounded-lg bg-blue-50/50 p-2.5 border border-blue-100 space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="text-[11px] font-bold text-blue-800 flex items-center gap-1">
                  <Plus className="h-3 w-3" />
                  <span>Tạo Nhà Cung Cấp Mới</span>
                </div>
                <form onSubmit={handleAddSupplier} className="space-y-1.5 text-xs">
                  <div>
                    <input
                      type="text"
                      placeholder="Tên nhà cung cấp *"
                      required
                      value={newSupplierName}
                      onChange={(e) => setNewSupplierName(e.target.value)}
                      className="w-full text-xs rounded-md border border-gray-300 py-1 px-2 focus:border-blue-500 focus:outline-hidden bg-white text-gray-800"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Người liên hệ..."
                      value={newSupplierContact}
                      onChange={(e) => setNewSupplierContact(e.target.value)}
                      className="w-full text-xs rounded-md border border-gray-300 py-1 px-2 focus:border-blue-500 focus:outline-hidden bg-white text-gray-800"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Số điện thoại..."
                      value={newSupplierPhone}
                      onChange={(e) => setNewSupplierPhone(e.target.value)}
                      className="w-full text-xs rounded-md border border-gray-300 py-1 px-2 focus:border-blue-500 focus:outline-hidden bg-white text-gray-800"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Địa chỉ..."
                      value={newSupplierAddress}
                      onChange={(e) => setNewSupplierAddress(e.target.value)}
                      className="w-full text-xs rounded-md border border-gray-300 py-1 px-2 focus:border-blue-500 focus:outline-hidden bg-white text-gray-800"
                    />
                  </div>
                  <div className="flex gap-1.5 pt-1">
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[10px] py-1 rounded transition-colors uppercase tracking-wider cursor-pointer"
                    >
                      Lưu NCC
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowQuickAddType(null)}
                      className="px-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-[10px] py-1 rounded transition-colors cursor-pointer"
                    >
                      Hủy
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Section 5: Trạng thái hàng hoá */}
          <div className="bg-white rounded-xl shadow-xs border p-4 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 border-b pb-2">
              <Bookmark className="h-4 w-4 text-teal-500" />
              Trạng thái hàng hóa
            </h3>
            
            {/* Tích điểm (có/không) */}
            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Cơ chế tích lũy điểm</label>
              <select
                value={productTichDiemFilter}
                onChange={(e) => setProductTichDiemFilter(e.target.value as any)}
                className="w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-xs focus:border-blue-500 focus:outline-hidden text-gray-700 bg-white"
              >
                <option value="all">Tất cả sản phẩm</option>
                <option value="yes">Có tích lũy điểm</option>
                <option value="no">Không tích lũy điểm</option>
              </select>
            </div>

            {/* Bán trực tiếp (có/không) */}
            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Bán trực tiếp tại POS</label>
              <select
                value={productBanTrucTiepFilter}
                onChange={(e) => setProductBanTrucTiepFilter(e.target.value as any)}
                className="w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-xs focus:border-blue-500 focus:outline-hidden text-gray-700 bg-white"
              >
                <option value="all">Tất cả sản phẩm</option>
                <option value="yes">Có cho phép bán trực tiếp</option>
                <option value="no">Không bán trực tiếp</option>
              </select>
            </div>

            {/* Hàng đang kinh doanh/hàng ngừng kinh doanh */}
            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Trạng thái kinh doanh</label>
              <select
                value={productKinhDoanhFilter}
                onChange={(e) => setProductKinhDoanhFilter(e.target.value as any)}
                className="w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-xs focus:border-blue-500 focus:outline-hidden text-gray-700 bg-white"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="active">Hàng đang kinh doanh</option>
                <option value="stopped">Hàng ngừng kinh doanh</option>
              </select>
            </div>
          </div>

        </div>

      </div>

      {isProductModalOpen && (
        <AddProductModal
          isOpen={isProductModalOpen}
          onClose={() => {
            setIsProductModalOpen(false);
            setEditingProduct(null);
          }}
          onSave={handleSaveProduct}
          editingProduct={editingProduct}
          categories={data.Nhom_hang}
          brands={data.Thuong_hieu}
          suppliers={data.Nha_cung_cap}
          onRefreshData={onRefreshData}
          products={data.San_pham}
        />
      )}

    </div>
  );
}
