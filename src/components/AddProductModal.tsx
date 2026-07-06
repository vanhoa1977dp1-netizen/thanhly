import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Package,
  DollarSign,
  Layers,
  Bookmark,
  Truck,
  ImagePlus,
  Check,
  Camera,
  Barcode,
  Plus,
  Loader2
} from "lucide-react";
import { Product, ProductCategory, Brand, Supplier } from "../types";

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Omit<Product, "id"> & { id?: string }) => void;
  categories: ProductCategory[];
  brands: Brand[];
  editingProduct?: Product | null;
  suppliers: Supplier[];
  onRefreshData?: () => void;
  products?: Product[];
}

const PRESET_UNITS = [
  "Cái",
  "Hộp",
  "Bộ",
  "Gói",
  "Kg",
  "Chai",
  "Lon",
  "Thùng",
  "Lốc",
  "Mét",
  "Cặp",
  "Sợi",
  "Tấm",
  "Chiếc",
  "Lít",
  "Bịch"
];

export default function AddProductModal({
  isOpen,
  onClose,
  onSave,
  categories,
  brands,
  editingProduct,
  suppliers,
  onRefreshData,
  products = []
}: AddProductModalProps) {
  const [tenSanPham, setTenSanPham] = useState("");
  const [idNhomHang, setIdNhomHang] = useState("");
  const [idSanPham, setIdSanPham] = useState("");
  const [idThuongHieu, setIdThuongHieu] = useState("");
  const [giaVon, setGiaVon] = useState<number | "">("");
  const [giaBan, setGiaBan] = useState<number | "">("");
  const [tonKho, setTonKho] = useState<number | "">("");
  const [donViTinh, setDonViTinh] = useState("Cái");
  const [barCode, setBarCode] = useState("");
  const [trangThai, setTrangThai] = useState("Đang kinh doanh");
  const [tichDiem, setTichDiem] = useState(true);
  const [banTrucTiep, setBanTrucTiep] = useState(true);
  const [idNhaCungCap, setIdNhaCungCap] = useState("");
  const [hinhAnh, setHinhAnh] = useState("");

  const [customUnits, setCustomUnits] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // States for Quick Add Popovers
  const [showQuickAddType, setShowQuickAddType] = useState<
    "category" | "brand" | "supplier" | "unit" | null
  >(null);

  // Quick category fields
  const [newCatName, setNewCatName] = useState("");
  const [newCatDesc, setNewCatDesc] = useState("");

  // Quick brand fields
  const [newBrandName, setNewBrandName] = useState("");
  const [newBrandOrigin, setNewBrandOrigin] = useState("");

  // Quick supplier fields
  const [newSupplierName, setNewSupplierName] = useState("");
  const [newSupplierContact, setNewSupplierContact] = useState("");
  const [newSupplierPhone, setNewSupplierPhone] = useState("");
  const [newSupplierAddress, setNewSupplierAddress] = useState("");

  // Quick unit fields
  const [newUnitName, setNewUnitName] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const allUnits = Array.from(new Set([...PRESET_UNITS, ...customUnits]));

  useEffect(() => {
    if (isOpen) {
      if (editingProduct) {
        setTenSanPham(editingProduct.ten_san_pham);
        setIdNhomHang(editingProduct.id_nhom_hang);
        setIdSanPham(editingProduct.id);
        setIdThuongHieu(editingProduct.id_thuong_hieu);
        setGiaVon(editingProduct.gia_von === 0 ? "" : editingProduct.gia_von);
        setGiaBan(editingProduct.gia_ban === 0 ? "" : editingProduct.gia_ban);
        setTonKho(editingProduct.ton_kho === 0 ? "" : editingProduct.ton_kho);
        setDonViTinh(editingProduct.don_vi_tinh);
        setBarCode(editingProduct.bar_code);
        setTrangThai(editingProduct.trang_thai || "Đang kinh doanh");
        setTichDiem(editingProduct.tich_diem !== undefined ? editingProduct.tich_diem : true);
        setBanTrucTiep(editingProduct.ban_truc_tiep !== undefined ? editingProduct.ban_truc_tiep : true);
        setIdNhaCungCap(
          editingProduct.id_nha_cung_cap || (suppliers.length > 0 ? suppliers[0].id : "")
        );
        setHinhAnh(editingProduct.hinh_anh || "");

        // Make sure existing custom unit is present in lists
        if (editingProduct.don_vi_tinh && !PRESET_UNITS.includes(editingProduct.don_vi_tinh)) {
          setCustomUnits((prev) => {
            if (!prev.includes(editingProduct.don_vi_tinh)) {
              return [...prev, editingProduct.don_vi_tinh];
            }
            return prev;
          });
        }
      } else {
        setTenSanPham("");
        setIdSanPham("");
        setIdNhomHang(categories.length > 0 ? categories[0].id : "");
        setIdThuongHieu(brands.length > 0 ? brands[0].id : "");
        setGiaVon("");
        setGiaBan("");
        setTonKho("");
        setDonViTinh("Cái");
        setBarCode("");
        setTrangThai("Đang kinh doanh");
        setTichDiem(true);
        setBanTrucTiep(true);
        setIdNhaCungCap(suppliers.length > 0 ? suppliers[0].id : "");
        setHinhAnh("");
      }
    }
  }, [isOpen, editingProduct, categories, brands, suppliers]);

  if (!isOpen) return null;

  // Helper to format raw number to string with dots e.g., 1000000 -> "1.000.000"
  const formatNumberWithDots = (val: number | ""): string => {
    if (val === "" || isNaN(val)) return "";
    return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const handlePriceChange = (value: string, setter: (val: number | "") => void) => {
    const rawVal = value.replace(/[^0-9]/g, "");
    setter(rawVal === "" ? "" : Number(rawVal));
  };

  // Handle image upload from computer, save to server's folder /image/
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Hình ảnh quá lớn! Vui lòng chọn ảnh dưới 5MB.");
        return;
      }

      setIsUploading(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        if (typeof reader.result === "string") {
          try {
            const response = await fetch("/api/upload-image", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: file.name,
                data: reader.result
              })
            });
            const res = await response.json();
            if (res.success) {
              setHinhAnh(res.url);
            } else {
              console.warn("Backend upload error, using base64 fallback:", res.message);
              setHinhAnh(reader.result);
            }
          } catch (err) {
            console.error("Upload fetch error, using base64 fallback:", err);
            setHinhAnh(reader.result);
          } finally {
            setIsUploading(false);
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBoxClick = () => {
    fileInputRef.current?.click();
  };

  const handleSaveQuickAdd = async () => {
    if (showQuickAddType === "category") {
      if (!newCatName.trim()) return alert("Vui lòng nhập tên nhóm hàng!");
      try {
        const res = await fetch("/api/groups", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ten_nhom: newCatName.trim(),
            mo_ta: newCatDesc.trim()
          })
        });
        const result = await res.json();
        if (result.success) {
          if (onRefreshData) onRefreshData();
          setIdNhomHang(result.data.id);
          setNewCatName("");
          setNewCatDesc("");
          setShowQuickAddType(null);
        } else {
          alert("Lỗi thêm nhóm hàng: " + result.message);
        }
      } catch (err) {
        console.error(err);
        alert("Lỗi kết nối khi thêm nhóm hàng!");
      }
    } else if (showQuickAddType === "brand") {
      if (!newBrandName.trim()) return alert("Vui lòng nhập tên thương hiệu!");
      try {
        const res = await fetch("/api/brands", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ten_thuong_hieu: newBrandName.trim(),
            xuat_xu: newBrandOrigin.trim()
          })
        });
        const result = await res.json();
        if (result.success) {
          if (onRefreshData) onRefreshData();
          setIdThuongHieu(result.data.id);
          setNewBrandName("");
          setNewBrandOrigin("");
          setShowQuickAddType(null);
        } else {
          alert("Lỗi thêm thương hiệu: " + result.message);
        }
      } catch (err) {
        console.error(err);
        alert("Lỗi kết nối khi thêm thương hiệu!");
      }
    } else if (showQuickAddType === "supplier") {
      if (!newSupplierName.trim()) return alert("Vui lòng nhập tên nhà cung cấp!");
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
        const result = await res.json();
        if (result.success) {
          if (onRefreshData) onRefreshData();
          setIdNhaCungCap(result.data.id);
          setNewSupplierName("");
          setNewSupplierContact("");
          setNewSupplierPhone("");
          setNewSupplierAddress("");
          setShowQuickAddType(null);
        } else {
          alert("Lỗi thêm nhà cung cấp: " + result.message);
        }
      } catch (err) {
        console.error(err);
        alert("Lỗi kết nối khi thêm nhà cung cấp!");
      }
    } else if (showQuickAddType === "unit") {
      if (!newUnitName.trim()) return alert("Vui lòng nhập tên đơn vị tính!");
      const unit = newUnitName.trim();
      setCustomUnits((prev) => {
        if (!prev.includes(unit)) {
          return [...prev, unit];
        }
        return prev;
      });
      setDonViTinh(unit);
      setNewUnitName("");
      setShowQuickAddType(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenSanPham.trim()) return alert("Vui lòng nhập tên sản phẩm!");

    const parsedGiaVon = Number(giaVon || 0);
    const parsedGiaBan = Number(giaBan || 0);
    const parsedTonKho = Number(tonKho || 0);

    if (parsedGiaVon < 0 || parsedGiaBan < 0) {
      return alert("Giá sản phẩm không được nhỏ hơn 0!");
    }

    // Check duplicate product name
    const nameExists = products.some(p => 
      p.ten_san_pham.trim().toLowerCase() === tenSanPham.trim().toLowerCase() && 
      (!editingProduct || p.id !== editingProduct.id)
    );
    if (nameExists) {
      return alert("Tên sản phẩm đã bị trùng, xin đặt tên khác!");
    }

    let finalBarCode = barCode.trim();
    let finalId = idSanPham.trim();

    if (!editingProduct) {
      // Creating a new product
      if (finalBarCode) {
        // If they entered custom ID, SKU or Barcode, set both ID and Barcode to it
        finalId = finalBarCode;

        // Check if this code/barcode is already used as id or bar_code in any existing product
        const codeExists = products.some(p => 
          (p.id && p.id.trim().toLowerCase() === finalBarCode.toLowerCase()) || 
          (p.bar_code && p.bar_code.trim().toLowerCase() === finalBarCode.toLowerCase())
        );
        if (codeExists) {
          return alert("Mã sản phẩm đã bị trùng!");
        }
      } else {
        // Leave empty for the backend to auto-generate a sequential "SPxxxxxx" code
        finalId = "";
        finalBarCode = "";
      }
    } else {
      // Editing existing product
      finalId = editingProduct.id;
      if (!finalBarCode) {
        finalBarCode = editingProduct.bar_code || editingProduct.id;
      } else {
        // Check if the modified barcode is used by another product
        const codeExists = products.some(p => 
          p.id !== editingProduct.id && (
            (p.id && p.id.trim().toLowerCase() === finalBarCode.toLowerCase()) || 
            (p.bar_code && p.bar_code.trim().toLowerCase() === finalBarCode.toLowerCase())
          )
        );
        if (codeExists) {
          return alert("Mã sản phẩm đã bị trùng!");
        }
      }
    }

    onSave({
      ten_san_pham: tenSanPham.trim(),
      id_nhom_hang: idNhomHang,
      id: finalId,
      id_thuong_hieu: idThuongHieu,
      gia_von: parsedGiaVon,
      gia_ban: parsedGiaBan,
      ton_kho: parsedTonKho,
      don_vi_tinh: donViTinh,
      bar_code: finalBarCode,
      trang_thai: trangThai,
      tich_diem: tichDiem,
      ban_truc_tiep: banTrucTiep,
      ngay_tao: editingProduct?.ngay_tao || new Date().toISOString(),
      id_nha_cung_cap: idNhaCungCap,
      hinh_anh: hinhAnh
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto select-none">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 border border-slate-200 flex flex-col my-8">
        {/* Spacious Beautiful Header */}
        <div className="flex items-center justify-between bg-slate-50 border-b border-slate-150 px-6 py-4 text-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                {editingProduct ? "Cập nhật sản phẩm" : "Thêm hàng hóa mới"}
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">
                Quản lý thông tin chi tiết và định giá bán lẻ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Content Form - Slightly larger controls */}
        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-5 overflow-y-auto max-h-[calc(100vh-160px)] no-scrollbar"
        >
          {/* Section 1: Basic Info & Image */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start pb-5 border-b border-slate-100">
            {/* Left Image box - Select from PC */}
            <div className="md:col-span-4 flex flex-col items-center justify-center space-y-2">
              <label className="text-xs font-bold text-slate-900 uppercase tracking-wider self-start">
                Hình ảnh sản phẩm
              </label>

              <div
                onClick={handleBoxClick}
                className={`relative group w-36 h-36 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all duration-200 ${
                  hinhAnh
                    ? "border-blue-500 bg-slate-50 hover:border-blue-600"
                    : "border-slate-300 bg-slate-50/50 hover:border-blue-500 hover:bg-slate-50"
                }`}
              >
                {isUploading ? (
                  <div className="text-center p-2.5 flex flex-col items-center justify-center">
                    <Loader2 className="h-6 w-6 text-blue-500 animate-spin mb-2" />
                    <span className="text-[10px] font-bold text-slate-500">
                      Đang upload ảnh...
                    </span>
                  </div>
                ) : hinhAnh ? (
                  <>
                    <img
                      src={hinhAnh}
                      alt="Product"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity duration-150">
                      <Camera className="h-5 w-5 mb-1" />
                      <span className="text-[10px] font-semibold">Đổi hình ảnh</span>
                    </div>
                  </>
                ) : (
                  <div className="text-center p-3 flex flex-col items-center justify-center">
                    <ImagePlus className="h-6 w-6 text-slate-400 mb-1.5" />
                    <span className="text-xs font-bold text-slate-600">Thêm ảnh từ PC</span>
                    <span className="text-[9px] text-slate-400 mt-1">Hỗ trợ JPG, PNG, WEBP</span>
                  </div>
                )}
              </div>

              {hinhAnh && !isUploading && (
                <button
                  type="button"
                  onClick={() => setHinhAnh("")}
                  className="text-xs font-bold text-rose-500 hover:text-rose-700 hover:underline cursor-pointer"
                >
                  Xóa hình ảnh
                </button>
              )}

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                className="hidden"
              />
            </div>

            {/* Right details */}
            <div className="md:col-span-8 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                  Tên sản phẩm *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nhập tên sản phẩm..."
                  value={tenSanPham}
                  onChange={(e) => setTenSanPham(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-blue-500 focus:outline-hidden text-slate-800 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                  Mã SKU / Barcode / Mã tự đặt
                </label>
                <div className="relative rounded-lg shadow-3xs">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Barcode className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    placeholder="Mã vạch, tự đặt tên hoặc để trống để hệ thống tự tạo mã..."
                    value={barCode}
                    onChange={(e) => setBarCode(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 pl-9 pr-3.5 py-2 text-sm focus:border-blue-500 focus:outline-hidden font-mono text-slate-800 font-medium"
                  />
                </div>
                <p className="text-[10px] text-slate-400 font-medium mt-1.5">
                  💡 Hệ thống tự động nhận diện Mã tự tạo / Mã vạch / Mã tự đặt tên khi lưu trữ.
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Pricing & Stock - Blank default for easy typing */}
          <div className="bg-slate-50 rounded-xl p-4.5 border border-slate-100 space-y-4">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Thông số nhập liệu & Giá bán
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">
                  Giá vốn (đ)
                </label>
                <div className="relative rounded-lg">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-slate-400">
                  </span>
                  <input
                    type="text"
                    placeholder="Nhập giá vốn..."
                    value={formatNumberWithDots(giaVon)}
                    onChange={(e) => handlePriceChange(e.target.value, setGiaVon)}
                    className="w-full rounded-lg border border-slate-300 py-2 pl-6 pr-2.5 text-sm focus:border-blue-500 focus:outline-hidden font-mono font-bold text-slate-800 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">
                  Giá bán (đ)
                </label>
                <div className="relative rounded-lg">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-slate-400">
                  </span>
                  <input
                    type="text"
                    placeholder="Nhập giá bán..."
                    value={formatNumberWithDots(giaBan)}
                    onChange={(e) => handlePriceChange(e.target.value, setGiaBan)}
                    className="w-full rounded-lg border border-slate-300 py-2 pl-6 pr-2.5 text-sm focus:border-blue-500 focus:outline-hidden font-mono font-extrabold text-blue-700 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">
                  Số lượng tồn
                </label>
                <input
                  type="text"
                  placeholder="Nhập tồn kho..."
                  value={formatNumberWithDots(tonKho)}
                  onChange={(e) => handlePriceChange(e.target.value, setTonKho)}
                  className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-hidden font-mono font-bold text-emerald-700 bg-white"
                />
              </div>

              <div className="flex items-end gap-1.5">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">
                    Đơn vị tính
                  </label>
                  <select
                    value={donViTinh}
                    onChange={(e) => setDonViTinh(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-hidden bg-white text-slate-800 font-medium cursor-pointer"
                  >
                    {allUnits.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => setShowQuickAddType("unit")}
                  className="rounded-lg bg-blue-50 hover:bg-blue-100 p-2 text-blue-600 transition-colors h-[38px] flex items-center justify-center border border-blue-200 cursor-pointer self-end"
                  title="Thêm mới đơn vị tính"
                >
                  <Plus className="h-4.5 w-4.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Section 3: Classification & Partners - WITH INLINE ADD */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4.5">
            <div className="flex items-end gap-1.5">
              <div className="flex-1">
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                  Nhóm hàng *
                </label>
                <select
                  value={idNhomHang}
                  onChange={(e) => setIdNhomHang(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-hidden bg-white text-slate-800 font-medium cursor-pointer"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.ten_nhom}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={() => setShowQuickAddType("category")}
                className="rounded-lg bg-blue-50 hover:bg-blue-100 p-2 text-blue-600 transition-colors h-[38px] flex items-center justify-center border border-blue-200 cursor-pointer self-end"
                title="Thêm mới nhóm hàng"
              >
                <Plus className="h-4.5 w-4.5" />
              </button>
            </div>

            <div className="flex items-end gap-1.5">
              <div className="flex-1">
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                  Thương hiệu *
                </label>
                <select
                  value={idThuongHieu}
                  onChange={(e) => setIdThuongHieu(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-hidden bg-white text-slate-800 font-medium cursor-pointer"
                >
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.ten_thuong_hieu}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={() => setShowQuickAddType("brand")}
                className="rounded-lg bg-blue-50 hover:bg-blue-100 p-2 text-blue-600 transition-colors h-[38px] flex items-center justify-center border border-blue-200 cursor-pointer self-end"
                title="Thêm mới thương hiệu"
              >
                <Plus className="h-4.5 w-4.5" />
              </button>
            </div>

            <div className="flex items-end gap-1.5">
              <div className="flex-1">
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                  Nhà cung cấp
                </label>
                <select
                  value={idNhaCungCap}
                  onChange={(e) => setIdNhaCungCap(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-hidden bg-white text-slate-800 font-medium cursor-pointer"
                >
                  <option value="">-- Chọn nhà cung cấp --</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.ten_nha_cung_cap}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={() => setShowQuickAddType("supplier")}
                className="rounded-lg bg-blue-50 hover:bg-blue-100 p-2 text-blue-600 transition-colors h-[38px] flex items-center justify-center border border-blue-200 cursor-pointer self-end"
                title="Thêm mới nhà cung cấp"
              >
                <Plus className="h-4.5 w-4.5" />
              </button>
            </div>
          </div>

          {/* Section 4: Advanced parameters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4.5 pt-1">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                Trạng thái kinh doanh
              </label>
              <select
                value={trangThai}
                onChange={(e) => setTrangThai(e.target.value)}
                className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-hidden bg-white text-slate-800 font-medium cursor-pointer"
              >
                <option value="Đang kinh doanh">Đang kinh doanh</option>
                <option value="Ngừng kinh doanh">Ngừng kinh doanh</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                Tích điểm khi bán
              </label>
              <select
                value={tichDiem ? "true" : "false"}
                onChange={(e) => setTichDiem(e.target.value === "true")}
                className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-hidden bg-white text-slate-800 font-medium cursor-pointer"
              >
                <option value="true">Có cho tích điểm</option>
                <option value="false">Không tích điểm</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                Bán trực tiếp tại POS
              </label>
              <select
                value={banTrucTiep ? "true" : "false"}
                onChange={(e) => setBanTrucTiep(e.target.value === "true")}
                className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-hidden bg-white text-slate-800 font-medium cursor-pointer"
              >
                <option value="true">Cho phép bán trực tiếp</option>
                <option value="false">Không bán trực tiếp</option>
              </select>
            </div>
          </div>

          {/* Footer actions */}
          <div className="flex gap-3 pt-4.5 justify-end border-t border-slate-100 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="rounded-xl bg-blue-600 hover:bg-blue-700 px-6 py-2.5 text-xs font-bold text-white transition-colors shadow-md flex items-center gap-1.5 cursor-pointer hover:shadow-lg"
            >
              <Check className="h-4.5 w-4.5" />
              <span>{editingProduct ? "Lưu thay đổi" : "Lưu sản phẩm"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Popovers / Micro Dialogs for Dynamic Addition */}
      {showQuickAddType && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-xl bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 border border-slate-200">
            {/* Header */}
            <div className="flex items-center justify-between bg-slate-50 border-b border-slate-150 px-5 py-3.5 text-slate-800">
              <h4 className="text-sm font-bold text-slate-800">
                {showQuickAddType === "category" && "Thêm nhóm hàng mới"}
                {showQuickAddType === "brand" && "Thêm thương hiệu mới"}
                {showQuickAddType === "supplier" && "Thêm nhà cung cấp mới"}
                {showQuickAddType === "unit" && "Thêm đơn vị tính mới"}
              </h4>
              <button
                type="button"
                onClick={() => setShowQuickAddType(null)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Form */}
            <div className="p-5 space-y-4 text-sm">
              {showQuickAddType === "category" && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">
                      Tên nhóm hàng *
                    </label>
                    <input
                      type="text"
                      placeholder="Nhập tên nhóm hàng..."
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-hidden text-slate-800 font-medium bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">
                      Mô tả
                    </label>
                    <textarea
                      placeholder="Nhập mô tả chi tiết..."
                      value={newCatDesc}
                      onChange={(e) => setNewCatDesc(e.target.value)}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-hidden text-slate-800 min-h-[60px] bg-white"
                    />
                  </div>
                </div>
              )}

              {showQuickAddType === "brand" && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">
                      Tên thương hiệu *
                    </label>
                    <input
                      type="text"
                      placeholder="Nhập tên thương hiệu..."
                      value={newBrandName}
                      onChange={(e) => setNewBrandName(e.target.value)}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-hidden text-slate-800 font-medium bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">
                      Xuất xứ / Quốc gia
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: Việt Nam, Mỹ, Nhật Bản..."
                      value={newBrandOrigin}
                      onChange={(e) => setNewBrandOrigin(e.target.value)}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-hidden text-slate-800 bg-white"
                    />
                  </div>
                </div>
              )}

              {showQuickAddType === "supplier" && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">
                      Tên nhà cung cấp *
                    </label>
                    <input
                      type="text"
                      placeholder="Nhập tên nhà cung cấp..."
                      value={newSupplierName}
                      onChange={(e) => setNewSupplierName(e.target.value)}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-hidden text-slate-800 font-medium bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">
                      Người liên hệ
                    </label>
                    <input
                      type="text"
                      placeholder="Nhập tên người đại diện liên hệ..."
                      value={newSupplierContact}
                      onChange={(e) => setNewSupplierContact(e.target.value)}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-hidden text-slate-800 bg-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">
                        Số điện thoại
                      </label>
                      <input
                        type="text"
                        placeholder="Số điện thoại..."
                        value={newSupplierPhone}
                        onChange={(e) => setNewSupplierPhone(e.target.value)}
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-hidden text-slate-800 font-mono bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">
                        Địa chỉ
                      </label>
                      <input
                        type="text"
                        placeholder="Địa chỉ nhà cung cấp..."
                        value={newSupplierAddress}
                        onChange={(e) => setNewSupplierAddress(e.target.value)}
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-hidden text-slate-800 bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {showQuickAddType === "unit" && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">
                      Tên đơn vị tính mới *
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: Lon, Thùng, Chai, Gói, Mét..."
                      value={newUnitName}
                      onChange={(e) => setNewUnitName(e.target.value)}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-hidden text-slate-800 font-medium bg-white"
                    />
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 justify-end pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowQuickAddType(null)}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={handleSaveQuickAdd}
                  className="rounded-lg bg-blue-600 hover:bg-blue-700 px-5 py-2 text-xs font-bold text-white transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Check className="h-4 w-4" />
                  Xác nhận thêm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
