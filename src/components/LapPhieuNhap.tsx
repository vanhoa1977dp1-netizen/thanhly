import React, { useState, useEffect } from "react";
import { 
  Search, 
  ShoppingBag, 
  Minus, 
  Plus, 
  Trash2, 
  ChevronDown, 
  X, 
  Save, 
  RotateCcw,
  CheckCircle,
  FileText
} from "lucide-react";
import { DatabaseSchema, Product } from "../types";

interface ImportItem {
  id_sp: string;
  so_luong: number;
  gian_nhap: number;
}

interface LapPhieuNhapProps {
  data: DatabaseSchema;
  onRefreshData: () => void;
  onFormClose?: () => void;
}

export default function LapPhieuNhap({ data, onRefreshData, onFormClose }: LapPhieuNhapProps) {
  const [importSupplierId, setImportSupplierId] = useState("");
  const [importItems, setImportItems] = useState<ImportItem[]>([]);
  const [importPaidAmount, setImportPaidAmount] = useState<number>(0);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [importPaymentMethod, setImportPaymentMethod] = useState("Tiền mặt");
  
  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [showProductSearchResults, setShowProductSearchResults] = useState(false);
  const [hasManuallySetPaid, setHasManuallySetPaid] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
  const [isDraftLoaded, setIsDraftLoaded] = useState(false);

  // Load draft on mount
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem("import_draft");
      if (savedDraft) {
        const draft = JSON.parse(savedDraft);
        setImportSupplierId(draft.importSupplierId || "");
        setImportItems(draft.importItems || []);
        setDiscountAmount(draft.discountAmount || 0);
        setImportPaidAmount(draft.importPaidAmount || 0);
        setImportPaymentMethod(draft.importPaymentMethod || "Tiền mặt");
        setHasManuallySetPaid(draft.hasManuallySetPaid || false);
        setIsDraftLoaded(true);
        setMessage({ type: "info", text: "Đã khôi phục bản nháp đã lưu tạm trước đó!" });
      }
    } catch (e) {
      console.error("Failed to load draft:", e);
    }
  }, []);

  // Save state as draft on changes (Auto-save)
  useEffect(() => {
    if (importItems.length > 0 || importSupplierId || discountAmount > 0) {
      const draft = {
        importSupplierId,
        importItems,
        discountAmount,
        importPaidAmount,
        importPaymentMethod,
        hasManuallySetPaid,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem("import_draft", JSON.stringify(draft));
    }
  }, [importSupplierId, importItems, discountAmount, importPaidAmount, importPaymentMethod, hasManuallySetPaid]);

  // Calculations
  const totalProductsQty = importItems.reduce((acc, item) => acc + item.so_luong, 0);
  const subTotalSum = importItems.reduce((acc, item) => acc + item.so_luong * item.gian_nhap, 0);
  const netDue = Math.max(0, subTotalSum - discountAmount);

  // Auto-sync paid amount with net due unless adjusted manually
  useEffect(() => {
    if (!hasManuallySetPaid) {
      setImportPaidAmount(netDue);
    }
  }, [netDue, hasManuallySetPaid]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val);
  };

  const handleSelectProduct = (product: Product) => {
    setImportItems((prev) => {
      const existing = prev.find((item) => item.id_sp === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id_sp === product.id ? { ...item, so_luong: item.so_luong + 1 } : item
        );
      } else {
        return [...prev, { id_sp: product.id, so_luong: 1, gian_nhap: product.gia_von }];
      }
    });
    setProductSearchQuery("");
    setShowProductSearchResults(false);
  };

  const updateItemQty = (id_sp: string, qty: number) => {
    if (qty < 1) {
      removeItem(id_sp);
      return;
    }
    setImportItems((prev) =>
      prev.map((item) => (item.id_sp === id_sp ? { ...item, so_luong: qty } : item))
    );
  };

  const updateItemPrice = (id_sp: string, price: number) => {
    setImportItems((prev) =>
      prev.map((item) => (item.id_sp === id_sp ? { ...item, gian_nhap: price } : item))
    );
  };

  const removeItem = (id_sp: string) => {
    setImportItems((prev) => prev.filter((item) => item.id_sp !== id_sp));
  };

  const handleSaveDraftManual = () => {
    const draft = {
      importSupplierId,
      importItems,
      discountAmount,
      importPaidAmount,
      importPaymentMethod,
      hasManuallySetPaid,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem("import_draft", JSON.stringify(draft));
    setMessage({ type: "success", text: "Đã lưu tạm bản nháp thành công!" });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleClearDraft = () => {
    localStorage.removeItem("import_draft");
    setImportSupplierId("");
    setImportItems([]);
    setDiscountAmount(0);
    setImportPaidAmount(0);
    setImportPaymentMethod("Tiền mặt");
    setHasManuallySetPaid(false);
    setIsDraftLoaded(false);
    setMessage({ type: "info", text: "Đã xóa bản nháp và đặt lại phiếu!" });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleCreateImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importSupplierId) {
      setMessage({ type: "error", text: "Vui lòng chọn Nhà cung cấp!" });
      return;
    }
    if (importItems.length === 0) {
      setMessage({ type: "error", text: "Chưa chọn sản phẩm nào để nhập!" });
      return;
    }

    const validItems = importItems.filter((item) => item.so_luong > 0 && item.gian_nhap >= 0);
    if (validItems.length === 0) {
      setMessage({ type: "error", text: "Danh sách sản phẩm nhập không hợp lệ!" });
      return;
    }

    const payload = {
      id_nha_cung_cap: importSupplierId,
      chi_tiet_nhap: validItems,
      tong_tien_nhap: netDue,
      da_thanh_toan: importPaidAmount,
      phuong_thuc_thanh_toan: importPaymentMethod,
      id_nhan_vien: "NV001" // Default employee
    };

    try {
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      if (result.success) {
        localStorage.removeItem("import_draft");
        onRefreshData();
        if (onFormClose) {
          onFormClose();
        }
      } else {
        setMessage({ type: "error", text: result.message || "Gửi phiếu nhập kho thất bại!" });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Lỗi kết nối máy chủ!" });
    }
  };

  return (
    <div className="bg-[#eef2f5] flex flex-col font-sans animate-in fade-in duration-150 rounded-xl border border-gray-200 overflow-hidden shadow-xs h-[calc(100vh-175px)] mb-6">
      {/* Header Bar */}
      <div className="bg-[#0284c7] text-white px-6 py-3.5 flex items-center justify-between shadow-md select-none shrink-0">
        <div className="flex items-center gap-3">
          <FileText className="h-5 w-5 text-sky-200" />
          <h1 className="text-base font-bold uppercase tracking-wider">
            Lập phiếu nhập hàng & tăng tồn kho
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {importItems.length > 0 && (
            <button
              onClick={handleSaveDraftManual}
              className="flex items-center gap-1.5 bg-sky-700/60 hover:bg-sky-700 text-white text-xs font-bold py-1.5 px-3 rounded-md transition-all cursor-pointer"
              title="Lưu tạm vào trình duyệt"
            >
              <Save className="h-3.5 w-3.5" />
              Lưu tạm
            </button>
          )}
          {isDraftLoaded && (
            <button
              onClick={handleClearDraft}
              className="flex items-center gap-1.5 bg-red-700/60 hover:bg-red-700 text-white text-xs font-bold py-1.5 px-3 rounded-md transition-all cursor-pointer"
              title="Xóa nháp hiện tại"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Xóa bản nháp
            </button>
          )}
          {onFormClose && (
            <button
              onClick={onFormClose}
              className="text-white hover:text-sky-100 transition-colors p-1 rounded-full hover:bg-sky-700/50 cursor-pointer"
            >
              <X className="h-5.5 w-5.5" />
            </button>
          )}
        </div>
      </div>

      {/* Messages banner */}
      {message && (
        <div className={`px-6 py-2.5 text-xs font-semibold flex items-center justify-between shrink-0 transition-all ${
          message.type === "success" ? "bg-emerald-50 text-emerald-700 border-b border-emerald-150" : 
          message.type === "error" ? "bg-red-50 text-red-700 border-b border-red-150" : 
          "bg-blue-50 text-blue-700 border-b border-blue-150"
        }`}>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-gray-400 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Main 2-Column workspace */}
      <div className="flex-1 overflow-hidden p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Column 1: CHỌN SẢN PHẨM NHẬP HÀNG (70% width on lg) */}
        <div className="lg:col-span-8 flex flex-col space-y-3.5 h-full overflow-hidden">
          <div className="flex items-center justify-between shrink-0">
            <h2 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
              1. CHỌN SẢN PHẨM NHẬP HÀNG
            </h2>
            <span className="text-[10px] text-gray-400 font-semibold italic">
              Bản nháp tự động lưu liên tục
            </span>
          </div>

          {/* Search Box */}
          <div className="relative shrink-0">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <Search className="h-4.5 w-4.5" />
            </div>
            <input
              type="text"
              placeholder="Gõ mã hoặc tên sản phẩm để thêm vào phiếu nhập..."
              value={productSearchQuery}
              onChange={(e) => {
                const val = e.target.value;
                setProductSearchQuery(val);
                setShowProductSearchResults(true);

                // Auto add on exact match of ID or Barcode
                const cleanVal = val.trim();
                if (cleanVal) {
                  const matchedProduct = data.San_pham.find(p => 
                    p.id.toLowerCase() === cleanVal.toLowerCase() || 
                    (p.bar_code && p.bar_code.toLowerCase() === cleanVal.toLowerCase())
                  );
                  if (matchedProduct) {
                    handleSelectProduct(matchedProduct);
                  }
                }
              }}
              onFocus={() => setShowProductSearchResults(true)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const cleanVal = productSearchQuery.trim();
                  if (cleanVal) {
                    const matchedProduct = data.San_pham.find(p => 
                      p.id.toLowerCase() === cleanVal.toLowerCase() || 
                      (p.bar_code && p.bar_code.toLowerCase() === cleanVal.toLowerCase())
                    );
                    if (matchedProduct) {
                      handleSelectProduct(matchedProduct);
                    } else {
                      const query = cleanVal.toLowerCase();
                      const matches = data.San_pham.filter(
                        (p) =>
                          p.ten_san_pham.toLowerCase().includes(query) ||
                          p.id.toLowerCase().includes(query) ||
                          (p.bar_code && p.bar_code.toLowerCase().includes(query))
                      );
                      if (matches.length > 0) {
                        handleSelectProduct(matches[0]);
                      }
                    }
                  }
                }
              }}
              className="w-full bg-white border border-gray-300 rounded-lg py-2.5 pl-11 pr-4 text-xs font-semibold text-slate-800 placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-[#0284c7]/20 focus:border-[#0284c7] shadow-xs"
            />

            {/* Search Dropdown Results */}
            {showProductSearchResults && productSearchQuery.trim() !== "" && (
              <div className="absolute z-50 mt-1.5 w-full bg-white rounded-lg border border-gray-200 shadow-lg max-h-64 overflow-y-auto divide-y divide-gray-100 animate-in fade-in duration-100">
                {(() => {
                  const query = productSearchQuery.toLowerCase().trim();
                  const matches = data.San_pham.filter(
                    (p) =>
                      p.ten_san_pham.toLowerCase().includes(query) ||
                      p.id.toLowerCase().includes(query) ||
                      (p.bar_code && p.bar_code.toLowerCase().includes(query))
                  );

                  if (matches.length === 0) {
                    return (
                      <div className="py-4 text-center text-gray-400 font-medium text-xs">
                        Không tìm thấy hàng hóa nào khớp từ khóa
                      </div>
                    );
                  }

                  return matches.map((p) => {
                    const alreadySelected = importItems.find(itm => itm.id_sp === p.id);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleSelectProduct(p)}
                        className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-center justify-between text-xs transition-colors cursor-pointer"
                      >
                        <div>
                          <div className="font-bold text-slate-800">{p.ten_san_pham}</div>
                          <div className="text-[10px] text-gray-400 mt-0.5 font-semibold font-mono">
                            Mã: {p.id} {p.bar_code ? `| Barcode: ${p.bar_code}` : ""}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-emerald-600">
                            Giá vốn: {formatCurrency(p.gia_von)}
                          </div>
                          <div className="text-[10px] text-gray-500 font-medium mt-0.5">
                            Tồn: <span className="font-bold text-gray-700">{p.ton_kho}</span> {p.don_vi_tinh}
                            {alreadySelected && (
                              <span className="ml-2 bg-blue-50 text-blue-600 font-bold px-1.5 py-0.5 rounded-full border border-blue-100 text-[9px]">
                                Đã chọn: {alreadySelected.so_luong}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  });
                })()}
              </div>
            )}
          </div>

          {/* Selected items sheet */}
          <div className="flex-1 bg-white border border-gray-200 rounded-lg shadow-xs overflow-hidden flex flex-col min-h-0">
            {importItems.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-12 text-center select-none">
                <div className="bg-slate-50 p-4 rounded-full border border-dashed border-slate-200 mb-4 text-slate-300">
                  <ShoppingBag className="h-10 w-10 text-slate-300 stroke-[1.2]" />
                </div>
                <h3 className="text-sm font-bold text-slate-500">
                  Chưa có sản phẩm nào được chọn.
                </h3>
                <p className="text-[11px] text-gray-400 font-medium mt-1">
                  Sử dụng ô tìm kiếm ở trên để thêm nhanh hàng hóa.
                </p>
              </div>
            ) : (
              <div className="flex-1 overflow-auto">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 z-10 bg-slate-50 text-slate-500 border-b border-gray-200">
                    <tr className="font-bold uppercase tracking-wider text-[10px] text-gray-500">
                      <th className="py-3.5 px-4 w-12 text-center">#</th>
                      <th className="py-3.5 px-4 w-28 font-mono">Mã hàng</th>
                      <th className="py-3.5 px-4">Tên sản phẩm</th>
                      <th className="py-3.5 px-4 w-28 text-center">Số lượng</th>
                      <th className="py-3.5 px-4 w-32 text-right">Đơn giá nhập</th>
                      <th className="py-3.5 px-4 w-32 text-right">Thành tiền</th>
                      <th className="py-3.5 px-4 w-12 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700 bg-white">
                    {importItems.map((item, index) => {
                      const p = data.San_pham.find((prod) => prod.id === item.id_sp);
                      if (!p) return null;
                      const subTotal = item.so_luong * item.gian_nhap;
                      return (
                        <tr key={item.id_sp} className="hover:bg-slate-50/30 transition-colors">
                          <td className="py-3.5 px-4 text-center font-bold text-gray-400">{index + 1}</td>
                          <td className="py-3.5 px-4 font-mono font-bold text-blue-600">{p.id}</td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-800">{p.ten_san_pham}</div>
                            <div className="text-[10px] text-gray-400 font-semibold mt-0.5">
                              Tồn hiện tại: <span className="font-bold text-slate-600">{p.ton_kho}</span> {p.don_vi_tinh}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => updateItemQty(item.id_sp, item.so_luong - 1)}
                                className="p-1 border border-gray-300 rounded-md hover:bg-slate-100 text-gray-500 cursor-pointer active:scale-95 transition-transform"
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <input
                                type="number"
                                min="1"
                                value={item.so_luong}
                                onChange={(e) => {
                                  const val = Math.max(1, parseInt(e.target.value) || 1);
                                  updateItemQty(item.id_sp, val);
                                }}
                                className="w-12 text-center border border-gray-300 rounded-md py-1 bg-white text-gray-800 font-bold focus:outline-hidden focus:border-[#0284c7]"
                              />
                              <button
                                type="button"
                                onClick={() => updateItemQty(item.id_sp, item.so_luong + 1)}
                                className="p-1 border border-gray-300 rounded-md hover:bg-slate-100 text-gray-500 cursor-pointer active:scale-95 transition-transform"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <input
                              type="text"
                              inputMode="numeric"
                              value={item.gian_nhap === 0 ? "" : new Intl.NumberFormat("vi-VN").format(item.gian_nhap)}
                              onChange={(e) => {
                                const rawValue = e.target.value.replace(/\D/g, "");
                                const val = rawValue ? parseInt(rawValue, 10) : 0;
                                updateItemPrice(item.id_sp, val);
                              }}
                              className="w-24 text-right border border-gray-300 rounded-md py-1 px-1.5 bg-white text-gray-800 font-mono font-bold focus:outline-hidden focus:border-[#0284c7]"
                            />
                          </td>
                          <td className="py-3.5 px-4 text-right font-bold text-slate-800 font-mono">
                            {formatCurrency(subTotal)}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => removeItem(item.id_sp)}
                              className="text-gray-400 hover:text-red-600 transition-colors cursor-pointer p-1 rounded-md hover:bg-red-50"
                              title="Xóa hàng"
                            >
                              <Trash2 className="h-4.5 w-4.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Column 2: TÍNH TOÁN & THANH TOÁN (30% width on lg) */}
        <div className="lg:col-span-4 flex flex-col space-y-3.5 h-full overflow-y-auto">
          <h2 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
            2. TÍNH TOÁN & THANH TOÁN
          </h2>

          <div className="bg-white rounded-lg border border-gray-200 shadow-xs p-5 space-y-5">
            
            {/* Supplier selection dropdown */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                Nhà cung cấp đối tác:
              </label>
              <div className="relative">
                <select
                  value={importSupplierId}
                  onChange={(e) => setImportSupplierId(e.target.value)}
                  className="w-full rounded-md border border-gray-300 py-2 pl-3 pr-8 bg-white text-gray-800 font-bold focus:border-[#0284c7] focus:outline-hidden appearance-none cursor-pointer text-xs shadow-xs"
                  required
                >
                  <option value="">-- Chọn nhà cung cấp --</option>
                  {data.Nha_cung_cap.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.ten_nha_cung_cap}
                    </option>
                  ))}
                </select>
                <span className="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none text-gray-400">
                  <ChevronDown className="h-4 w-4" />
                </span>
              </div>
            </div>

            {/* Calculation Fields Card */}
            <div className="border-t border-gray-100 pt-4 space-y-4 text-xs font-bold text-slate-700">
              
              {/* Total Items count */}
              <div className="flex justify-between items-center py-0.5">
                <span className="font-medium text-slate-500">Tổng vật dụng:</span>
                <span className="text-slate-800">{totalProductsQty} sản phẩm</span>
              </div>

              {/* Subtotal before discount */}
              <div className="flex justify-between items-center py-0.5">
                <span className="font-medium text-slate-500">Cộng tiền hàng:</span>
                <span className="text-slate-800 font-mono">{formatCurrency(subTotalSum)}</span>
              </div>

              {/* Discount input */}
              <div className="flex justify-between items-center">
                <span className="font-medium text-slate-500">Chiết khấu (VND):</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={discountAmount === 0 ? "" : new Intl.NumberFormat("vi-VN").format(discountAmount)}
                  placeholder="0"
                  onChange={(e) => {
                    const rawValue = e.target.value.replace(/\D/g, "");
                    const val = rawValue ? parseInt(rawValue, 10) : 0;
                    setDiscountAmount(val);
                  }}
                  className="w-32 text-right border border-gray-300 rounded-md py-1.5 px-2 bg-white text-gray-800 font-mono font-bold focus:outline-hidden focus:border-[#0284c7]"
                />
              </div>

              {/* Net Due - CẦN THANH TOÁN */}
              <div className="flex justify-between items-center border-t border-dashed border-gray-200 pt-4">
                <span className="font-extrabold text-[#0284c7] uppercase">Cần thanh toán:</span>
                <span className="font-extrabold text-[#0284c7] text-base font-mono">{formatCurrency(netDue)}</span>
              </div>

              {/* Payment Method Selector */}
              <div className="flex justify-between items-center py-1">
                <span className="font-bold text-slate-800">Hình thức trả:</span>
                <div className="flex bg-slate-100 p-0.5 rounded-lg border border-gray-200">
                  <button
                    type="button"
                    onClick={() => setImportPaymentMethod("Tiền mặt")}
                    className={`px-3 py-1 text-[11px] font-extrabold rounded-md cursor-pointer transition-all ${
                      importPaymentMethod === "Tiền mặt"
                        ? "bg-white text-blue-600 shadow-xs"
                        : "text-gray-500 hover:text-slate-700"
                    }`}
                  >
                    Tiền mặt
                  </button>
                  <button
                    type="button"
                    onClick={() => setImportPaymentMethod("Chuyển khoản")}
                    className={`px-3 py-1 text-[11px] font-extrabold rounded-md cursor-pointer transition-all ${
                      importPaymentMethod === "Chuyển khoản"
                        ? "bg-white text-blue-600 shadow-xs"
                        : "text-gray-500 hover:text-slate-700"
                    }`}
                  >
                    Chuyển khoản
                  </button>
                </div>
              </div>

              {/* Actual Paid Input - Thực tế đã trả NCC */}
              <div className="flex justify-between items-center pt-1">
                <span className="font-bold text-slate-800">Thực tế đã trả NCC:</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={importPaidAmount === 0 ? "0" : new Intl.NumberFormat("vi-VN").format(importPaidAmount)}
                  onChange={(e) => {
                    const rawValue = e.target.value.replace(/\D/g, "");
                    const val = rawValue ? parseInt(rawValue, 10) : 0;
                    setImportPaidAmount(val);
                    setHasManuallySetPaid(true);
                  }}
                  className="w-32 text-right border-2 border-emerald-500 rounded-md py-1.5 px-2 bg-white text-emerald-600 font-mono font-extrabold focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Note about supplier debt addition */}
              <p className="text-[10px] text-gray-400 font-medium italic leading-relaxed pt-1 border-t border-gray-50">
                Còn lại sẽ tự động cộng dồn vào Công Nợ của Nhà Cung Cấp.
              </p>
            </div>
          </div>

          {/* Action and Close Buttons */}
          <div className="pt-4 space-y-3 shrink-0">
            <button
              onClick={handleCreateImport}
              className="w-full flex items-center justify-center bg-[#00a65a] hover:bg-[#008d4c] text-white text-xs font-bold py-3 px-4 rounded-md transition-all shadow-md uppercase tracking-wider hover:shadow-lg cursor-pointer active:scale-99"
            >
              Xác nhận Nhập Kho & Hoàn Tất
            </button>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleSaveDraftManual}
                className="w-full flex items-center justify-center bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-bold py-3 px-4 rounded-md transition-all border border-sky-200 cursor-pointer active:scale-99"
              >
                <Save className="h-4 w-4 mr-1" />
                Lưu tạm
              </button>
              <button
                type="button"
                onClick={onFormClose}
                className="w-full flex items-center justify-center bg-[#e7ebee] hover:bg-gray-200 text-gray-700 text-xs font-bold py-3 px-4 rounded-md transition-all border border-gray-300 cursor-pointer active:scale-99"
              >
                Trở về
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
