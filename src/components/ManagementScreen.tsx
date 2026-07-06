import React, { useState, useEffect, useRef } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import {
  LayoutDashboard,
  Package,
  FileText,
  Users,
  Truck,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Search,
  Plus,
  Trash2,
  Edit2,
  TrendingUp,
  ShoppingCart,
  DollarSign,
  Layers,
  Store,
  CreditCard,
  Briefcase,
  AlertTriangle,
  RotateCcw,
  RefreshCw,
  PlusCircle,
  FileSpreadsheet,
  X,
  Calendar,
  Bookmark,
  Shield
} from "lucide-react";
import * as XLSX from "xlsx";
import {
  DatabaseSchema,
  Product,
  Customer,
  Supplier,
  Invoice,
  Employee,
  BankAccount,
  ProductCategory,
  Brand,
  ImportOrder,
  ReturnOrder,
  ReturnSupplierOrder
} from "../types";
import AddProductModal from "./AddProductModal";
import Tongquan from "./Tongquan";
import Sanpham from "./Sanpham";
import Hoadon from "./Hoadon";
import Khachhang from "./khachhang";
import Nhacungcap from "./Nhacungcap";
import Trahang from "./Trahang";
import Nhaphang from "./Nhaphang";
import Trahangncc from "./Trahangncc";
import LapPhieuNhap from "./LapPhieuNhap";
import LapPhieuTraNCC from "./LapPhieuTraNCC";
import Nhanvien from "./Nhanvien";
import Admin from "./Admin";
import Baocaocuoingay from "./Baocaocuoingay";
import Baocaobanhang from "./Baocaobanhang";
import Baocaohanghoa from "./Baocaohanghoa";

interface ManagementScreenProps {
  data: DatabaseSchema;
  onRefreshData: () => void;
  onToggleScreen: () => void; // Switch to POS Sales
}

type ActiveTab =
  | "overview"
  | "products"
  | "sales"
  | "reports"
  | "customers"
  | "suppliers"
  | "imports"
  | "create_import"
  | "supplier_returns"
  | "create_supplier_return"
  | "staff"
  | "settings";

export default function ManagementScreen({ data, onRefreshData, onToggleScreen }: ManagementScreenProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    return (localStorage.getItem("admin_active_tab") as ActiveTab) || "overview";
  });

  useEffect(() => {
    localStorage.setItem("admin_active_tab", activeTab);
  }, [activeTab]);

  const [salesSubTab, setSalesSubTab] = useState<"invoices" | "returns">("invoices");

  const [reportsSubTab, setReportsSubTab] = useState<"cuoi_ngay" | "ban_hang" | "hang_hoa">("cuoi_ngay");

  // Dropdown states
  const [showOrderMenu, setShowOrderMenu] = useState(false);
  const [showManagementMenu, setShowManagementMenu] = useState(false);
  const [showPurchaseMenu, setShowPurchaseMenu] = useState(false);
  
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

  const [customerSearch, setCustomerSearch] = useState("");
  const [customerDateFilterType, setCustomerDateFilterType] = useState<"all" | "predefined" | "range">("all");
  const [customerPredefinedDateRange, setCustomerPredefinedDateRange] = useState<string>("all");
  const [customerCustomStartDate, setCustomerCustomStartDate] = useState<string>("");
  const [customerCustomEndDate, setCustomerCustomEndDate] = useState<string>("");
  const [customerMinTotalSpent, setCustomerMinTotalSpent] = useState<string>("");
  const [customerMaxTotalSpent, setCustomerMaxTotalSpent] = useState<string>("");
  const [customerMinDebt, setCustomerMinDebt] = useState<string>("");
  const [customerMaxDebt, setCustomerMaxDebt] = useState<string>("");
  const [showCustomerQuickAdd, setShowCustomerQuickAdd] = useState<boolean>(false);
  const [supplierSearch, setSupplierSearch] = useState("");

  // Overview Tab Date Range Filters
  const [overviewDateFilterType, setOverviewDateFilterType] = useState<"all" | "predefined" | "range">("predefined");
  const [overviewPredefinedRange, setOverviewPredefinedRange] = useState<string>("this_month");
  const [overviewCustomStartDate, setOverviewCustomStartDate] = useState<string>("");
  const [overviewCustomEndDate, setOverviewCustomEndDate] = useState<string>("");

  // Reports Tab Date Range Filters
  const [reportsDateFilterType, setReportsDateFilterType] = useState<"all" | "predefined" | "range">("predefined");
  const [reportsPredefinedRange, setReportsPredefinedRange] = useState<string>("today");
  const [reportsCustomStartDate, setReportsCustomStartDate] = useState<string>("");
  const [reportsCustomEndDate, setReportsCustomEndDate] = useState<string>("");
  
  // Modals / Creators state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Quick Inline Creators
  const [showQuickAddType, setShowQuickAddType] = useState<"category" | "brand" | null>(null);
  const [newCatName, setNewCatName] = useState("");
  const [newCatDesc, setNewCatDesc] = useState("");
  const [newBrandName, setNewBrandName] = useState("");
  const [newBrandOrigin, setNewBrandOrigin] = useState("");
  
  // New Supplier Creation States
  const [newSupName, setNewSupName] = useState("");
  const [newSupContact, setNewSupContact] = useState("");
  const [newSupPhone, setNewSupPhone] = useState("");
  const [newSupEmail, setNewSupEmail] = useState("");
  const [newSupAddress, setNewSupAddress] = useState("");
  const [newSupDebt, setNewSupDebt] = useState("");
  const [supplierMinDebtFilter, setSupplierMinDebtFilter] = useState("");
  const [supplierMaxDebtFilter, setSupplierMaxDebtFilter] = useState("");

  // New Imports & Returns Filter States
  const [importSearch, setImportSearch] = useState("");
  const [importDebtFilter, setImportDebtFilter] = useState<"all" | "has_debt" | "no_debt">("all");
  const [supplierReturnSearch, setSupplierReturnSearch] = useState("");

  // New Employee Creation States
  const [newEmpName, setNewEmpName] = useState("");
  const [newEmpRole, setNewEmpRole] = useState("Nhân viên");
  const [newEmpPhone, setNewEmpPhone] = useState("");
  const [newEmpEmail, setNewEmpEmail] = useState("");
  const [newEmpUsername, setNewEmpUsername] = useState("");
  const [newEmpPermission, setNewEmpPermission] = useState<"ADMIN" | "STAFF">("STAFF");
  const [newEmpPassword, setNewEmpPassword] = useState("");
  const [newEmpStatus, setNewEmpStatus] = useState("Đang hoạt động");
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  
  // Supplier Restocking Creator
  const [isImportFormOpen, setIsImportFormOpen] = useState(false);
  const [importSupplierId, setImportSupplierId] = useState("");
  const [importItems, setImportItems] = useState<{ id_sp: string; so_luong: number; gian_nhap: number }[]>([]);
  const [importPaidAmount, setImportPaidAmount] = useState<number>(0);

  // Currency formater
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val);
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
          // Monday is start of week
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

  // Check customer last transaction date filters
  const isWithinCustomerDateFilter = (lastTxDateStr?: string | null) => {
    if (!lastTxDateStr) {
      if (customerDateFilterType === "all") return true;
      if (customerDateFilterType === "predefined" && customerPredefinedDateRange === "all") return true;
      return false;
    }
    const txDate = new Date(lastTxDateStr);
    if (isNaN(txDate.getTime())) return false;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);

    if (customerDateFilterType === "all") {
      return true;
    }

    if (customerDateFilterType === "predefined") {
      switch (customerPredefinedDateRange) {
        case "today": {
          return txDate >= startOfToday;
        }
        case "yesterday": {
          const endOfYesterday = new Date(startOfToday);
          return txDate >= startOfYesterday && txDate < endOfYesterday;
        }
        case "this_week": {
          const day = startOfToday.getDay();
          const diff = startOfToday.getDate() - day + (day === 0 ? -6 : 1);
          const startOfWeek = new Date(startOfToday);
          startOfWeek.setDate(diff);
          startOfWeek.setHours(0, 0, 0, 0);
          return txDate >= startOfWeek;
        }
        case "last_week": {
          const day = startOfToday.getDay();
          const diff = startOfToday.getDate() - day + (day === 0 ? -6 : 1);
          const startOfWeek = new Date(startOfToday);
          startOfWeek.setDate(diff);
          startOfWeek.setHours(0, 0, 0, 0);
          const startOfLastWeek = new Date(startOfWeek);
          startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);
          return txDate >= startOfLastWeek && txDate < startOfWeek;
        }
        case "last_7_days": {
          const limit = new Date(startOfToday);
          limit.setDate(limit.getDate() - 7);
          return txDate >= limit;
        }
        case "this_month": {
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          return txDate >= startOfMonth;
        }
        case "last_month": {
          const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          return txDate >= startOfLastMonth && txDate < endOfLastMonth;
        }
        case "this_quarter": {
          const currentQuarter = Math.floor(now.getMonth() / 3);
          const startOfQuarter = new Date(now.getFullYear(), currentQuarter * 3, 1);
          return txDate >= startOfQuarter;
        }
        case "last_quarter": {
          const currentQuarter = Math.floor(now.getMonth() / 3);
          const startOfLastQuarter = new Date(now.getFullYear(), (currentQuarter - 1) * 3, 1);
          const endOfLastQuarter = new Date(now.getFullYear(), currentQuarter * 3, 1);
          return txDate >= startOfLastQuarter && txDate < endOfLastQuarter;
        }
        case "this_year": {
          const startOfYear = new Date(now.getFullYear(), 0, 1);
          return txDate >= startOfYear;
        }
        case "last_year": {
          const startOfLastYear = new Date(now.getFullYear() - 1, 0, 1);
          const endOfLastYear = new Date(now.getFullYear(), 0, 1);
          return txDate >= startOfLastYear && txDate < endOfLastYear;
        }
        case "all":
        default:
          return true;
      }
    }

    if (customerDateFilterType === "range") {
      if (customerCustomStartDate) {
        const start = new Date(customerCustomStartDate);
        start.setHours(0, 0, 0, 0);
        if (txDate < start) return false;
      }
      if (customerCustomEndDate) {
        const end = new Date(customerCustomEndDate);
        end.setHours(23, 59, 59, 999);
        if (txDate > end) return false;
      }
      return true;
    }

    return true;
  };

  // Safe delete handler
  const handleDeleteItem = async (type: string, id: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa mục này (${id}) khỏi hệ thống?`)) return;
    
    // Create copy of entire data
    const updated = { ...data };
    
    if (type === "product") {
      updated.San_pham = updated.San_pham.filter(p => p.id !== id);
    } else if (type === "customer") {
      updated.Khach_hang = updated.Khach_hang.filter(c => c.id !== id);
    } else if (type === "supplier") {
      updated.Nha_cung_cap = updated.Nha_cung_cap.filter(s => s.id !== id);
    } else if (type === "employee") {
      updated.Nhan_vien = updated.Nhan_vien.filter(e => e.id !== id);
    } else if (type === "bank") {
      updated.Ngan_hang = updated.Ngan_hang.filter(b => b.id !== id);
    }

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

  // Add / Edit employee handler
  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmpName.trim()) return;
    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingEmployee ? editingEmployee.id : undefined,
          ho_ten: newEmpName.trim(),
          chuc_vu: newEmpRole.trim() || "Nhân viên",
          so_dien_thoai: newEmpPhone.trim(),
          email: newEmpEmail.trim(),
          tai_khoan: newEmpUsername.trim(),
          quyen_han: newEmpPermission,
          trang_thai: editingEmployee ? newEmpStatus : "Đang hoạt động",
          mat_khau: newEmpPassword.trim() || undefined
        })
      });
      if ((await res.json()).success) {
        setNewEmpName("");
        setNewEmpRole("Nhân viên");
        setNewEmpPhone("");
        setNewEmpEmail("");
        setNewEmpUsername("");
        setNewEmpPermission("STAFF");
        setNewEmpPassword("");
        setNewEmpStatus("Đang hoạt động");
        setEditingEmployee(null);
        onRefreshData();
      }
    } catch (e) {
      console.error(e);
      alert(editingEmployee ? "Lỗi khi cập nhật nhân viên" : "Lỗi khi thêm nhân viên");
    }
  };

  // Supplier stock import submit
  const handleCreateImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importSupplierId) return alert("Vui lòng chọn Nhà cung cấp!");
    if (importItems.length === 0) return alert("Chưa chọn sản phẩm nào để nhập!");

    const validItems = importItems.filter(item => item.so_luong > 0 && item.gian_nhap >= 0);
    if (validItems.length === 0) return alert("Sản phẩm nhập không hợp lệ!");

    const totalImportCost = validItems.reduce((sum, item) => sum + (item.gian_nhap * item.so_luong), 0);

    const payload = {
      id_nha_cung_cap: importSupplierId,
      id_nhan_vien: "NV001",
      chi_tiet_nhap: validItems,
      tong_tien_nhap: totalImportCost,
      da_thanh_toan: importPaidAmount
    };

    try {
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if ((await res.json()).success) {
        setIsImportFormOpen(false);
        setImportItems([]);
        setImportPaidAmount(0);
        onRefreshData();
      } else {
        alert("Gửi phiếu nhập kho thất bại!");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Quick Customer Add (direct form in tab)
  const [custName, setCustName] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [custEmail, setCustEmail] = useState("");
  const [custAddress, setCustAddress] = useState("");
  const handleQuickAddCustomerDirect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName.trim() || !custPhone.trim()) return alert("Vui lòng nhập họ tên và SĐT!");
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ho_ten: custName.trim(),
          so_dien_thoai: custPhone.trim(),
          email: custEmail.trim() || "chua_cap_nhat@gmail.com",
          dia_chi: custAddress.trim() || "Chưa cập nhật",
          loai_khach: "Thành viên"
        })
      });
      if ((await res.json()).success) {
        setCustName("");
        setCustPhone("");
        setCustEmail("");
        setCustAddress("");
        setShowCustomerQuickAdd(false);
        onRefreshData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Overview date checking helper
  const isWithinOverviewDateRange = (dateStr?: string | null) => {
    if (!dateStr) return false;
    const testDate = new Date(dateStr);
    if (isNaN(testDate.getTime())) return false;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);

    if (overviewDateFilterType === "all") {
      return true;
    }

    if (overviewDateFilterType === "predefined") {
      switch (overviewPredefinedRange) {
        case "today": {
          return testDate >= startOfToday;
        }
        case "yesterday": {
          const endOfYesterday = new Date(startOfToday);
          return testDate >= startOfYesterday && testDate < endOfYesterday;
        }
        case "this_week": {
          const day = startOfToday.getDay();
          const diff = startOfToday.getDate() - day + (day === 0 ? -6 : 1);
          const startOfWeek = new Date(startOfToday);
          startOfWeek.setDate(diff);
          startOfWeek.setHours(0, 0, 0, 0);
          return testDate >= startOfWeek;
        }
        case "last_7_days": {
          const limit = new Date(startOfToday);
          limit.setDate(limit.getDate() - 7);
          return testDate >= limit;
        }
        case "this_month": {
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          return testDate >= startOfMonth;
        }
        case "last_month": {
          const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          return testDate >= startOfLastMonth && testDate < endOfLastMonth;
        }
        case "this_quarter": {
          const currentQuarter = Math.floor(now.getMonth() / 3);
          const startOfQuarter = new Date(now.getFullYear(), currentQuarter * 3, 1);
          return testDate >= startOfQuarter;
        }
        case "this_year": {
          const startOfYear = new Date(now.getFullYear(), 0, 1);
          return testDate >= startOfYear;
        }
        case "all":
        default:
          return true;
      }
    }

    if (overviewDateFilterType === "range") {
      if (overviewCustomStartDate) {
        const start = new Date(overviewCustomStartDate);
        start.setHours(0, 0, 0, 0);
        if (testDate < start) return false;
      }
      if (overviewCustomEndDate) {
        const end = new Date(overviewCustomEndDate);
        end.setHours(23, 59, 59, 999);
        if (testDate > end) return false;
      }
      return true;
    }

    return true;
  };

  // Filtered collections for overview
  const filteredInvoicesForOverview = (data.Hoa_don || []).filter(inv => isWithinOverviewDateRange(inv.ngay_lap));
  const filteredReturnsForOverview = (data.Tra_hang || []).filter(ret => isWithinOverviewDateRange(ret.ngay_tra));
  const filteredImportsForOverview = (data.Nhap_hang || []).filter(imp => isWithinOverviewDateRange(imp.ngay_nhap));

  // Reports date checking helper
  const isWithinReportsDateRange = (dateStr?: string | null) => {
    if (!dateStr) return false;
    const testDate = new Date(dateStr);
    if (isNaN(testDate.getTime())) return false;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);

    if (reportsDateFilterType === "all") {
      return true;
    }

    if (reportsDateFilterType === "predefined") {
      switch (reportsPredefinedRange) {
        case "today": {
          return testDate >= startOfToday;
        }
        case "yesterday": {
          const endOfYesterday = new Date(startOfToday);
          return testDate >= startOfYesterday && testDate < endOfYesterday;
        }
        case "this_week": {
          const day = startOfToday.getDay();
          const diff = startOfToday.getDate() - day + (day === 0 ? -6 : 1);
          const startOfWeek = new Date(startOfToday);
          startOfWeek.setDate(diff);
          startOfWeek.setHours(0, 0, 0, 0);
          return testDate >= startOfWeek;
        }
        case "last_7_days": {
          const limit = new Date(startOfToday);
          limit.setDate(limit.getDate() - 7);
          return testDate >= limit;
        }
        case "this_month": {
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          return testDate >= startOfMonth;
        }
        case "last_month": {
          const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          return testDate >= startOfLastMonth && testDate < endOfLastMonth;
        }
        case "this_quarter": {
          const currentQuarter = Math.floor(now.getMonth() / 3);
          const startOfQuarter = new Date(now.getFullYear(), currentQuarter * 3, 1);
          return testDate >= startOfQuarter;
        }
        case "this_year": {
          const startOfYear = new Date(now.getFullYear(), 0, 1);
          return testDate >= startOfYear;
        }
        case "all":
        default:
          return true;
      }
    }

    if (reportsDateFilterType === "range") {
      if (reportsCustomStartDate) {
        const start = new Date(reportsCustomStartDate);
        start.setHours(0, 0, 0, 0);
        if (testDate < start) return false;
      }
      if (reportsCustomEndDate) {
        const end = new Date(reportsCustomEndDate);
        end.setHours(23, 59, 59, 999);
        if (testDate > end) return false;
      }
      return true;
    }

    return true;
  };

  // Filtered collections for reports
  const filteredInvoicesForReports = (data.Hoa_don || []).filter(inv => isWithinReportsDateRange(inv.ngay_lap));
  const filteredReturnsForReports = (data.Tra_hang || []).filter(ret => isWithinReportsDateRange(ret.ngay_tra));

  // Reports calculations
  const rPeriodRevenue = filteredInvoicesForReports.reduce((sum, inv) => sum + inv.khach_can_tra, 0);
  const rPeriodOrderCount = filteredInvoicesForReports.length;
  const rPeriodReturnAmount = filteredReturnsForReports.reduce((sum, ret) => sum + ret.tong_tien_tra, 0);
  const rPeriodNetRevenue = rPeriodRevenue - rPeriodReturnAmount;

  // Revenue by Payment method
  const rCashRevenue = filteredInvoicesForReports
    .filter(inv => inv.phuong_thuc_thanh_toan === "Tiền mặt")
    .reduce((sum, inv) => sum + inv.khach_can_tra, 0);
  const rBankRevenue = filteredInvoicesForReports
    .filter(inv => inv.phuong_thuc_thanh_toan === "Chuyển khoản")
    .reduce((sum, inv) => sum + inv.khach_can_tra, 0);

  // Profit calculations
  const rPeriodCOGS = filteredInvoicesForReports.reduce((sum, inv) => {
    return sum + inv.chi_tiet_san_pham.reduce((itemSum, item) => {
      const prod = (data.San_pham || []).find(p => p.id === (item.id_sp || (item as any).id_san_pham));
      const cost = prod ? prod.gia_von : 0;
      return itemSum + (item.so_luong * cost);
    }, 0);
  }, 0);
  const rPeriodGrossProfit = rPeriodRevenue - rPeriodCOGS;

  // Top Products sold in Reports period
  const rProductSalesMap: { [id: string]: { qty: number; revenue: number; name: string; categoryId: string } } = {};
  filteredInvoicesForReports.forEach((inv) => {
    inv.chi_tiet_san_pham.forEach((item) => {
      const prodId = item.id_sp || (item as any).id_san_pham;
      const prod = (data.San_pham || []).find(p => p.id === prodId);
      const name = prod ? prod.ten_san_pham : prodId;
      const catId = prod ? prod.id_nhom_hang : "";
      if (!rProductSalesMap[prodId]) {
        rProductSalesMap[prodId] = { qty: 0, revenue: 0, name, categoryId: catId };
      }
      rProductSalesMap[prodId].qty += item.so_luong;
      rProductSalesMap[prodId].revenue += item.so_luong * item.don_gia;
    });
  });

  const rTopProducts = Object.entries(rProductSalesMap)
    .map(([id, val]) => ({ id, ...val }))
    .sort((a, b) => b.qty - a.qty);

  // Top spending customers in Reports period
  const rCustomerSpendMap: { [id: string]: { count: number; spend: number; name: string } } = {};
  filteredInvoicesForReports.forEach((inv) => {
    const custId = inv.id_khach_hang || "vang_lai";
    const cust = (data.Khach_hang || []).find(c => c.id === custId);
    const name = cust ? cust.ho_ten : "Vãng lai / Khách lẻ";
    if (!rCustomerSpendMap[custId]) {
      rCustomerSpendMap[custId] = { count: 0, spend: 0, name };
    }
    rCustomerSpendMap[custId].count += 1;
    rCustomerSpendMap[custId].spend += inv.khach_can_tra;
  });

  const rTopCustomers = Object.entries(rCustomerSpendMap)
    .map(([id, val]) => ({ id, ...val }))
    .sort((a, b) => b.spend - a.spend);

  // Revenue contribution by staff in Reports period
  const rStaffRevenueMap: { [id: string]: { revenue: number; name: string } } = {};
  filteredInvoicesForReports.forEach((inv) => {
    const staffId = inv.id_nhan_vien || "he_thong";
    const staff = (data.Nhan_vien || []).find(s => s.id === staffId);
    const name = staff ? staff.ho_ten : "Hệ thống";
    if (!rStaffRevenueMap[staffId]) {
      rStaffRevenueMap[staffId] = { revenue: 0, name };
    }
    rStaffRevenueMap[staffId].revenue += inv.khach_can_tra;
  });

  const rStaffRevenueData = Object.entries(rStaffRevenueMap).map(([id, val]) => ({
    name: val.name,
    revenue: val.revenue
  }));

  // Dynamic KPI Metrics for Overview Period
  const periodRevenue = filteredInvoicesForOverview.reduce((sum, inv) => sum + inv.khach_can_tra, 0);
  const periodOrderCount = filteredInvoicesForOverview.length;
  const periodReturnAmount = filteredReturnsForOverview.reduce((sum, ret) => sum + ret.tong_tien_tra, 0);
  const periodImportAmount = filteredImportsForOverview.reduce((sum, imp) => sum + imp.tong_tien_nhap, 0);
  const periodGrossProfit = filteredInvoicesForOverview.reduce((sum, inv) => {
    const cogs = inv.chi_tiet_san_pham.reduce((itemSum, item) => {
      const prod = (data.San_pham || []).find(p => p.id === (item.id_sp || (item as any).id_san_pham));
      const cost = prod ? prod.gia_von : 0;
      return itemSum + (item.so_luong * cost);
    }, 0);
    return sum + (inv.khach_can_tra - cogs);
  }, 0);

  // Charts prep data
  const revenueData = filteredInvoicesForOverview.map((inv) => ({
    name: inv.id,
    date: new Date(inv.ngay_lap).toLocaleDateString("vi-VN"),
    revenue: inv.khach_can_tra
  }));

  // Categories distribution for PieChart
  const catDistribution = (data.Nhom_hang || []).map((cat) => {
    const prodsCount = (data.San_pham || []).filter(p => p.id_nhom_hang === cat.id).length;
    return { name: cat.ten_nhom, value: prodsCount };
  });
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

  return (
    <div className="flex flex-col h-screen bg-[#f3f4f6] text-gray-800 select-none overflow-hidden admin-container">
      
      {/* CSS Styles to support short/narrow viewports in Admin Screen */}
      <style>{`
        @media (max-height: 740px) {
          .admin-container {
            height: auto !important;
            min-height: 740px;
            overflow: auto !important;
          }
          .admin-workspace {
            height: auto !important;
            overflow: visible !important;
          }
        }
        @media (max-width: 1024px) {
          .admin-container {
            width: auto !important;
            min-width: 1024px;
            overflow-x: auto !important;
          }
          .admin-workspace {
            overflow: visible !important;
          }
        }
      `}</style>
      
      {/* Top Admin Header */}
      <header className="flex items-center justify-between bg-[#ffB900] text-white px-5 py-3.5 shrink-0 shadow-lg">
        <div className="flex items-center gap-2">
          <Store className="h-6 w-6 text-blue-400" />
          <div>
            <h1 className="text-base text-[#4A2E18] font-bold uppercase tracking-wider">{data.Thong_tin_shop.ten_shop}</h1>
            <p className="text-[12px] text-gray-400 font-semibold">{data.Thong_tin_shop.slogan}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onToggleScreen}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-all shadow-md uppercase tracking-wide"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Màn hình Bán Hàng (POS)</span>
          </button>
        </div>
      </header>

      {/* Horizontal Navigation Menu (Danh mục chính) */}
      <nav className="bg-slate-800 text-slate-300 px-5 py-2.5 flex items-center justify-between gap-4 shrink-0 shadow-md border-t border-slate-700 select-none">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto py-0.5">
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-widest border-r border-slate-700 pr-3.5 hidden xl:block shrink-0">
            Danh mục chính
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setActiveTab("overview")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                activeTab === "overview" ? "bg-blue-600 text-white shadow-md scale-102" : "hover:bg-slate-700 text-slate-300"
              }`}
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              Tổng quan
            </button>

            <button
              onClick={() => setActiveTab("products")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                activeTab === "products" ? "bg-blue-600 text-white shadow-md scale-102" : "hover:bg-slate-700 text-slate-300"
              }`}
            >
              <Package className="h-3.5 w-3.5" />
              Danh sách hàng hoá
            </button>

            {/* Dropdown: Tạo Đơn hàng */}
            <div
              className="relative"
              onMouseEnter={() => setShowOrderMenu(true)}
              onMouseLeave={() => setShowOrderMenu(false)}
            >
              <button
                type="button"
                onClick={() => {
                  setShowOrderMenu(!showOrderMenu);
                }}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
                  activeTab === "sales"
                    ? "bg-blue-600 text-white shadow-md"
                    : "hover:bg-slate-700 text-slate-300"
                }`}
              >
                <PlusCircle className="h-3.5 w-3.5 text-blue-400" />
                <span>Đơn hàng</span>
                <ChevronDown className={`h-3 w-3 transition-transform duration-150 ${showOrderMenu ? "rotate-180" : ""}`} />
              </button>

              {showOrderMenu && (
                <div className="absolute left-0 pt-1.5 w-48 z-30">
                  <div className="rounded-lg bg-slate-800 border border-slate-700 shadow-xl py-1 overflow-hidden">
                    <button
                      onClick={() => {
                        setActiveTab("sales");
                        setSalesSubTab("invoices");
                        setShowOrderMenu(false);
                      }}
                      className={`relative w-full flex items-center gap-2.5 pl-5 pr-4 py-2 text-left text-xs font-semibold hover:bg-slate-750/70 transition-all duration-150 group ${
                        activeTab === "sales" && salesSubTab === "invoices" ? "text-blue-400 bg-slate-700/60" : "text-slate-300"
                      }`}
                    >
                      <span className="absolute left-0 top-1 bottom-1 w-1 rounded-r-md bg-blue-400 shadow-[0_0_8px_#3b82f6] opacity-0 group-hover:opacity-100 scale-y-50 group-hover:scale-y-100 transition-all duration-200" />
                      <FileText className="h-3.5 w-3.5 text-blue-400 group-hover:scale-110 transition-transform duration-150" />
                      <span>Hóa đơn</span>
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab("sales");
                        setSalesSubTab("returns");
                        setShowOrderMenu(false);
                      }}
                      className={`relative w-full flex items-center gap-2.5 pl-5 pr-4 py-2 text-left text-xs font-semibold hover:bg-slate-750/70 transition-all duration-150 group ${
                        activeTab === "sales" && salesSubTab === "returns" ? "text-amber-400 bg-slate-700/60" : "text-slate-300"
                      }`}
                    >
                      <span className="absolute left-0 top-1 bottom-1 w-1 rounded-r-md bg-amber-400 shadow-[0_0_8px_#f59e0b] opacity-0 group-hover:opacity-100 scale-y-50 group-hover:scale-y-100 transition-all duration-200" />
                      <RotateCcw className="h-3.5 w-3.5 text-amber-500 group-hover:scale-110 transition-transform duration-150" />
                      <span>Khách trả hàng</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Dropdown: Mua hàng */}
            <div
              className="relative"
              onMouseEnter={() => setShowPurchaseMenu(true)}
              onMouseLeave={() => setShowPurchaseMenu(false)}
            >
              <button
                type="button"
                onClick={() => {
                  setShowPurchaseMenu(!showPurchaseMenu);
                }}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
                  activeTab === "suppliers" || activeTab === "imports" || activeTab === "create_import" || activeTab === "supplier_returns" || activeTab === "create_supplier_return"
                    ? "bg-blue-600 text-white shadow-md"
                    : "hover:bg-slate-700 text-slate-300"
                }`}
              >
                <ShoppingCart className="h-3.5 w-3.5 text-sky-400" />
                <span>Mua hàng</span>
                <ChevronDown className={`h-3 w-3 transition-transform duration-150 ${showPurchaseMenu ? "rotate-180" : ""}`} />
              </button>

              {showPurchaseMenu && (
                <div className="absolute left-0 pt-1.5 w-56 z-30">
                  <div className="rounded-lg bg-slate-800 border border-slate-700 shadow-xl py-1.5 divide-y divide-slate-700/50 overflow-hidden">
                    <div className="py-1">
                      <div className="px-4 py-1 text-[9px] font-bold text-slate-400 uppercase tracking-wider">Nhập hàng kho</div>
                      <button
                        onClick={() => {
                          setActiveTab("imports");
                          setShowPurchaseMenu(false);
                        }}
                        className={`relative w-full flex items-center gap-2.5 pl-5 pr-4 py-2 text-left text-xs font-semibold hover:bg-slate-750/70 transition-all duration-150 group ${
                          activeTab === "imports" ? "text-blue-400 bg-slate-700/60" : "text-slate-300"
                        }`}
                      >
                        <span className="absolute left-0 top-1 bottom-1 w-1 rounded-r-md bg-blue-400 shadow-[0_0_8px_#3b82f6] opacity-0 group-hover:opacity-100 scale-y-50 group-hover:scale-y-100 transition-all duration-200" />
                        <FileSpreadsheet className="h-3.5 w-3.5 text-blue-400 group-hover:scale-110 transition-transform duration-150" />
                        <span>Nhập hàng</span>
                      </button>
                    </div>

                    <div className="py-1">
                      <div className="px-4 py-1 text-[9px] font-bold text-slate-400 uppercase tracking-wider">Nhà cung cấp</div>
                      <button
                        onClick={() => {
                          setActiveTab("suppliers");
                          setShowPurchaseMenu(false);
                        }}
                        className={`relative w-full flex items-center gap-2.5 pl-5 pr-4 py-2 text-left text-xs font-semibold hover:bg-slate-750/70 transition-all duration-150 group ${
                          activeTab === "suppliers" ? "text-emerald-400 bg-slate-700/60" : "text-slate-300"
                        }`}
                      >
                        <span className="absolute left-0 top-1 bottom-1 w-1 rounded-r-md bg-emerald-400 shadow-[0_0_8px_#10b981] opacity-0 group-hover:opacity-100 scale-y-50 group-hover:scale-y-100 transition-all duration-200" />
                        <Truck className="h-3.5 w-3.5 text-emerald-400 group-hover:scale-110 transition-transform duration-150" />
                        <span>Nhà cung cấp</span>
                      </button>
                    </div>

                    <div className="py-1">
                      <div className="px-4 py-1 text-[9px] font-bold text-slate-400 uppercase tracking-wider">Trả hàng NCC</div>
                      <button
                        onClick={() => {
                          setActiveTab("supplier_returns");
                          setShowPurchaseMenu(false);
                        }}
                        className={`relative w-full flex items-center gap-2.5 pl-5 pr-4 py-2 text-left text-xs font-semibold hover:bg-slate-750/70 transition-all duration-150 group ${
                          activeTab === "supplier_returns" ? "text-rose-400 bg-slate-700/60" : "text-slate-300"
                        }`}
                      >
                        <span className="absolute left-0 top-1 bottom-1 w-1 rounded-r-md bg-rose-400 shadow-[0_0_8px_#f43f5e] opacity-0 group-hover:opacity-100 scale-y-50 group-hover:scale-y-100 transition-all duration-200" />
                        <FileText className="h-3.5 w-3.5 text-rose-400 group-hover:scale-110 transition-transform duration-150" />
                        <span>Trả hàng NCC</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => {
                setActiveTab("reports");
                setReportsSubTab("cuoi_ngay");
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
                activeTab === "reports"
                  ? "bg-blue-600 text-white shadow-md scale-102"
                  : "hover:bg-slate-700 text-slate-300"
              }`}
            >
              <Calendar className="h-3.5 w-3.5 text-emerald-400" />
              <span>Báo cáo</span>
            </button>

            {/* <button
              onClick={() => {
                setActiveTab("reports");
                setReportsSubTab("ban_hang");
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
                activeTab === "reports" && reportsSubTab === "ban_hang"
                  ? "bg-blue-600 text-white shadow-md scale-102"
                  : "hover:bg-slate-700 text-slate-300"
              }`}
            >
              <DollarSign className="h-3.5 w-3.5 text-blue-400" />
              <span>Báo cáo Bán hàng</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("reports");
                setReportsSubTab("hang_hoa");
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
                activeTab === "reports" && reportsSubTab === "hang_hoa"
                  ? "bg-blue-600 text-white shadow-md scale-102"
                  : "hover:bg-slate-700 text-slate-300"
              }`}
            >
              <Layers className="h-3.5 w-3.5 text-indigo-400" />
              <span>Báo cáo Hàng hóa</span>
            </button> */}

            {/* Dropdown: Quản lý */}
            <div
              className="relative"
              onMouseEnter={() => setShowManagementMenu(true)}
              onMouseLeave={() => setShowManagementMenu(false)}
            >
              <button
                type="button"
                onClick={() => {
                  setShowManagementMenu(!showManagementMenu);
                }}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
                  activeTab === "customers" || activeTab === "staff" || activeTab === "settings"
                    ? "bg-blue-600 text-white shadow-md"
                    : "hover:bg-slate-700 text-slate-300"
                }`}
              >
                <Users className="h-3.5 w-3.5 text-emerald-400" />
                <span>Quản lý</span>
                <ChevronDown className={`h-3 w-3 transition-transform duration-150 ${showManagementMenu ? "rotate-180" : ""}`} />
              </button>

              {showManagementMenu && (
                <div className="absolute left-0 pt-1.5 w-48 z-30">
                  <div className="rounded-lg bg-slate-800 border border-slate-700 shadow-xl py-1 overflow-hidden">
                    <button
                      onClick={() => {
                        setActiveTab("customers");
                        setShowManagementMenu(false);
                      }}
                      className={`relative w-full flex items-center gap-2.5 pl-5 pr-4 py-2 text-left text-xs font-semibold hover:bg-slate-750/70 transition-all duration-150 group ${
                        activeTab === "customers" ? "text-emerald-400 bg-slate-700/60" : "text-slate-300"
                      }`}
                    >
                      <span className="absolute left-0 top-1 bottom-1 w-1 rounded-r-md bg-emerald-400 shadow-[0_0_8px_#10b981] opacity-0 group-hover:opacity-100 scale-y-50 group-hover:scale-y-100 transition-all duration-200" />
                      <Users className="h-3.5 w-3.5 text-emerald-400 group-hover:scale-110 transition-transform duration-150" />
                      <span>Khách hàng</span>
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab("staff");
                        setShowManagementMenu(false);
                      }}
                      className={`relative w-full flex items-center gap-2.5 pl-5 pr-4 py-2 text-left text-xs font-semibold hover:bg-slate-750/70 transition-all duration-150 group ${
                        activeTab === "staff" ? "text-purple-400 bg-slate-700/60" : "text-slate-300"
                      }`}
                    >
                      <span className="absolute left-0 top-1 bottom-1 w-1 rounded-r-md bg-purple-400 shadow-[0_0_8px_#a855f7] opacity-0 group-hover:opacity-100 scale-y-50 group-hover:scale-y-100 transition-all duration-200" />
                      <Briefcase className="h-3.5 w-3.5 text-purple-400 group-hover:scale-110 transition-transform duration-150" />
                      <span>Nhân viên</span>
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab("settings");
                        setShowManagementMenu(false);
                      }}
                      className={`relative w-full flex items-center gap-2.5 pl-5 pr-4 py-2 text-left text-xs font-semibold hover:bg-slate-750/70 transition-all duration-150 group ${
                        activeTab === "settings" ? "text-blue-400 bg-slate-700/60" : "text-slate-300"
                      }`}
                    >
                      <span className="absolute left-0 top-1 bottom-1 w-1 rounded-r-md bg-blue-400 shadow-[0_0_8px_#3b82f6] opacity-0 group-hover:opacity-100 scale-y-50 group-hover:scale-y-100 transition-all duration-200" />
                      <Settings className="h-3.5 w-3.5 text-blue-400 group-hover:scale-110 transition-transform duration-150" />
                      <span>Cửa hàng</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            

            {/* <button
              onClick={() => setActiveTab("staff")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                activeTab === "staff" ? "bg-blue-600 text-white shadow-md scale-102" : "hover:bg-slate-700 text-slate-300"
              }`}
            >
              <Briefcase className="h-3.5 w-3.5" />
              Nhân viên
            </button>

            <button
              onClick={() => setActiveTab("settings")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                activeTab === "settings" ? "bg-blue-600 text-white shadow-md scale-102" : "hover:bg-slate-700 text-slate-300"
              }`}
            >
              <Settings className="h-3.5 w-3.5" />
              Cửa hàng
            </button> */}
          </div>
        </div>

        {/* <div className="text-[10px] text-slate-400 font-semibold hidden lg:block uppercase tracking-wider shrink-0">
          Slogan: {data.Thong_tin_shop.slogan}
        </div> */}
      </nav>

      {/* Main Workspace with content panel */}
      <div className="flex flex-1 overflow-hidden admin-workspace">
        
        {/* Content Panel Area */}
        <main className="flex-1 overflow-y-auto p-6 bg-[#f8fafc]">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <Tongquan data={data} />
          )}

          {/* TAB 2: PRODUCTS */}
          {activeTab === "products" && (
            <Sanpham data={data} onRefreshData={onRefreshData} />
          )}

          {/* TAB 3: BÁN HÀNG */}
          {activeTab === "sales" && (
            <div className="space-y-6">
              {/* Sub tab contents */}
              {salesSubTab === "invoices" && (
                <Hoadon data={data} onRefreshData={onRefreshData} />
              )}

              {salesSubTab === "returns" && (
                <Trahang data={data} onRefreshData={onRefreshData} />
              )}
        </div>
      )}

          {/* TAB: BÁO CÁO */}
          {activeTab === "reports" && (
            <div className="space-y-6">
              {/* Secondary Navigation Header */}
              <div className="bg-white p-4 rounded-xl border shadow-xs flex flex-col xl:flex-row xl:items-center justify-between gap-4 transition-all">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Báo cáo</h2>
                    <p className="text-[10px] text-gray-400 font-medium">Phân tích hoạt động cuối ngày, hiệu suất bán hàng và biến động kho hàng</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg border shrink-0 self-start xl:self-auto">
                  <button
                    onClick={() => setReportsSubTab("cuoi_ngay")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold transition-all duration-150 cursor-pointer ${
                      reportsSubTab === "cuoi_ngay"
                        ? "bg-emerald-600 text-white shadow-xs scale-102"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200"
                    }`}
                  >
                    <Calendar className="h-3.5 w-3.5" />
                    Cuối ngày
                  </button>
                  <button
                    onClick={() => setReportsSubTab("ban_hang")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold transition-all duration-150 cursor-pointer ${
                      reportsSubTab === "ban_hang"
                        ? "bg-emerald-600 text-white shadow-xs scale-102"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200"
                    }`}
                  >
                    <DollarSign className="h-3.5 w-3.5" />
                    Bán hàng
                  </button>
                  <button
                    onClick={() => setReportsSubTab("hang_hoa")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold transition-all duration-150 cursor-pointer ${
                      reportsSubTab === "hang_hoa"
                        ? "bg-emerald-600 text-white shadow-xs scale-102"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200"
                    }`}
                  >
                    <Layers className="h-3.5 w-3.5" />
                    Hàng hóa
                  </button>
                </div>
              </div>

              {/* Date Filters for Reports */}
              <div className="bg-white p-4 rounded-xl border shadow-xs flex flex-col xl:flex-row xl:items-center justify-between gap-4 transition-all">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-slate-700 block">Thời gian xem báo cáo</span>
                    <span className="text-[10px] text-slate-400">Lọc phạm vi dữ liệu báo cáo</span>
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  {[
                    { id: "today", label: "Hôm nay" },
                    { id: "yesterday", label: "Hôm qua" },
                    { id: "this_week", label: "Tuần này" },
                    { id: "last_7_days", label: "7 ngày qua" },
                    { id: "this_month", label: "Tháng này" },
                    { id: "last_month", label: "Tháng trước" },
                    { id: "this_quarter", label: "Quý này" },
                    { id: "this_year", label: "Năm nay" },
                    { id: "all", label: "Tất cả" },
                    { id: "custom", label: "Tự chọn khoảng" }
                  ].map((range) => {
                    const isActive = 
                      (reportsDateFilterType === "range" && range.id === "custom") ||
                      (reportsDateFilterType === "all" && range.id === "all") ||
                      (reportsDateFilterType === "predefined" && reportsPredefinedRange === range.id);
                    return (
                      <button
                        key={range.id}
                        onClick={() => {
                          if (range.id === "custom") {
                            setReportsDateFilterType("range");
                          } else if (range.id === "all") {
                            setReportsDateFilterType("all");
                          } else {
                            setReportsDateFilterType("predefined");
                            setReportsPredefinedRange(range.id);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-lg font-semibold transition-all duration-150 cursor-pointer ${
                          isActive
                            ? "bg-emerald-600 text-white shadow-xs scale-102"
                            : "bg-slate-100 hover:bg-slate-200 text-slate-600 active:scale-98"
                        }`}
                      >
                        {range.label}
                      </button>
                    );
                  })}
                </div>

                {reportsDateFilterType === "range" && (
                  <div className="flex items-center gap-2 text-xs border-t xl:border-t-0 xl:border-l pt-3 xl:pt-0 xl:pl-4 transition-all">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400 text-[11px] font-medium">Từ ngày</span>
                      <input
                        type="date"
                        value={reportsCustomStartDate}
                        onChange={(e) => setReportsCustomStartDate(e.target.value)}
                        className="rounded-lg border border-gray-300 py-1.5 px-2.5 bg-white text-gray-800 focus:border-emerald-500 focus:outline-hidden font-medium"
                      />
                    </div>
                    <span className="text-gray-400">—</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400 text-[11px] font-medium">Đến ngày</span>
                      <input
                        type="date"
                        value={reportsCustomEndDate}
                        onChange={(e) => setReportsCustomEndDate(e.target.value)}
                        className="rounded-lg border border-gray-300 py-1.5 px-2.5 bg-white text-gray-800 focus:border-emerald-500 focus:outline-hidden font-medium"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Sub tab contents */}
              {reportsSubTab === "cuoi_ngay" && (
                <Baocaocuoingay
                  data={data}
                  filteredInvoicesForReports={filteredInvoicesForReports}
                  filteredReturnsForReports={filteredReturnsForReports}
                  rPeriodRevenue={rPeriodRevenue}
                  rPeriodOrderCount={rPeriodOrderCount}
                  rPeriodReturnAmount={rPeriodReturnAmount}
                  rPeriodNetRevenue={rPeriodNetRevenue}
                  rCashRevenue={rCashRevenue}
                  rBankRevenue={rBankRevenue}
                />
              )}

              {reportsSubTab === "ban_hang" && (
                <Baocaobanhang
                  data={data}
                  filteredInvoicesForReports={filteredInvoicesForReports}
                  rPeriodRevenue={rPeriodRevenue}
                  rPeriodOrderCount={rPeriodOrderCount}
                  rPeriodGrossProfit={rPeriodGrossProfit}
                  rTopCustomers={rTopCustomers}
                  rStaffRevenueData={rStaffRevenueData}
                />
              )}

              {reportsSubTab === "hang_hoa" && (
                <Baocaohanghoa data={data} rTopProducts={rTopProducts} />
              )}
            </div>
          )}

          {/* TAB 4: CUSTOMERS */}
          {activeTab === "customers" && (
            <Khachhang data={data} onRefreshData={onRefreshData} />
          )}

          {/* TAB 5: SUPPLIERS */}
          {activeTab === "suppliers" && (
            <Nhacungcap data={data} onRefreshData={onRefreshData} />
          )}

          {/* TAB 5.2: IMPORTS */}
          {activeTab === "imports" && (
            <Nhaphang
              data={data}
              onRefreshData={onRefreshData}
              onCreateNewClick={() => setActiveTab("create_import")}
            />
          )}

          {activeTab === "create_import" && (
            <LapPhieuNhap
              data={data}
              onRefreshData={onRefreshData}
              onFormClose={() => setActiveTab("imports")}
            />
          )}

          {/* TAB 6.2: SUPPLIER RETURNS */}
          {activeTab === "supplier_returns" && (
            <Trahangncc
              data={data}
              onRefreshData={onRefreshData}
              onCreateNewClick={() => setActiveTab("create_supplier_return")}
            />
          )}

          {activeTab === "create_supplier_return" && (
            <LapPhieuTraNCC
              data={data}
              onRefreshData={onRefreshData}
              onFormClose={() => setActiveTab("supplier_returns")}
            />
          )}

          {/* TAB 7: STAFF */}
          {activeTab === "staff" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-blue-500" />
                    Đội ngũ nhân sự & Thu ngân
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">Quản lý hồ sơ nhân viên, phân quyền hạn ADMIN/STAFF và trạng thái hoạt động.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                
                {/* Left Side: Staff List */}
                <div className="xl:col-span-3 bg-white rounded-xl shadow-xs border overflow-hidden">
                  <div className="p-4 border-b bg-gray-50/50">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Danh sách nhân sự ({data.Nhan_vien.length})</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b text-gray-500 font-semibold bg-gray-50/50">
                          <th className="py-2.5 px-4 w-20">Mã NV</th>
                          <th className="py-2.5 px-4">Họ và Tên</th>
                          <th className="py-2.5 px-4">Chức vụ & Tài khoản</th>
                          <th className="py-2.5 px-4">Mật khẩu</th>
                          <th className="py-2.5 px-4">Liên hệ</th>
                          <th className="py-2.5 px-4 text-center">Quyền hạn</th>
                          <th className="py-2.5 px-4 text-center">Trạng thái</th>
                          <th className="py-2.5 px-4 text-center">Hành động</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y text-gray-700">
                        {data.Nhan_vien.map((emp) => (
                          <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-2.5 px-4 font-mono font-bold text-blue-600">{emp.id}</td>
                            <td className="py-2.5 px-4 font-bold text-gray-900">{emp.ho_ten}</td>
                            <td className="py-2.5 px-4">
                              <div className="space-y-0.5">
                                <span className="block font-medium text-slate-700">{emp.chuc_vu}</span>
                                <span className="block font-mono text-[10px] text-gray-400">ID: {emp.tai_khoan}</span>
                              </div>
                            </td>
                            <td className="py-2.5 px-4">
                              <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-gray-600 text-[11px] font-bold">
                                {emp.mat_khau || "123456"}
                              </span>
                            </td>
                            <td className="py-2.5 px-4">
                              <div className="space-y-0.5 font-mono text-[11px]">
                                <span className="block text-gray-600">{emp.so_dien_thoai}</span>
                                {emp.email && <span className="block text-gray-400 font-sans text-[10px]">{emp.email}</span>}
                              </div>
                            </td>
                            <td className="py-2.5 px-4 text-center">
                              <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                                emp.quyen_han === "ADMIN" ? "bg-red-50 text-red-600 border border-red-100" : "bg-blue-50 text-blue-600 border border-blue-100"
                              }`}>
                                {emp.quyen_han}
                              </span>
                            </td>
                            <td className="py-2.5 px-4 text-center">
                              <span className={`px-2 py-0.5 rounded-full font-semibold text-[10px] border ${
                                emp.trang_thai === "Đang hoạt động" 
                                  ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                                  : "bg-amber-50 text-amber-600 border-amber-100"
                              }`}>
                                {emp.trang_thai}
                              </span>
                            </td>
                            <td className="py-2.5 px-4 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingEmployee(emp);
                                    setNewEmpName(emp.ho_ten);
                                    setNewEmpRole(emp.chuc_vu);
                                    setNewEmpPhone(emp.so_dien_thoai);
                                    setNewEmpEmail(emp.email || "");
                                    setNewEmpUsername(emp.tai_khoan);
                                    setNewEmpPermission(emp.quyen_han);
                                    setNewEmpPassword(emp.mat_khau || "123456");
                                    setNewEmpStatus(emp.trang_thai);
                                  }}
                                  className="p-1 rounded-full text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                                  title="Sửa thông tin & Mật khẩu"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteItem("employee", emp.id)}
                                  className="p-1 rounded-full text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                                  title="Xóa nhân viên"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Right Side: Create and Role Permissions */}
                <div className="space-y-6">
                  {/* Form Tạo Mới / Cập nhật */}
                  <div className="bg-white rounded-xl shadow-xs border p-4 space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 border-b pb-2">
                      {editingEmployee ? <Edit2 className="h-4 w-4 text-amber-500" /> : <Plus className="h-4 w-4 text-blue-500" />}
                      {editingEmployee ? `Cập nhật NV: ${editingEmployee.id}` : "Tạo nhân sự mới"}
                    </h3>
                    <form onSubmit={handleAddEmployee} className="space-y-3 text-xs">
                      <div>
                        <label className="block text-gray-500 mb-1 font-medium">Họ và tên nhân viên *</label>
                        <input
                          type="text"
                          required
                          placeholder="Ví dụ: Nguyễn Thị B..."
                          value={newEmpName}
                          onChange={(e) => setNewEmpName(e.target.value)}
                          className="w-full rounded-md border border-gray-300 py-1.5 px-2.5 focus:border-blue-500 focus:outline-hidden bg-white text-gray-800"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-gray-500 mb-1 font-medium">Chức vụ</label>
                          <input
                            type="text"
                            placeholder="Thu ngân, Kho..."
                            value={newEmpRole}
                            onChange={(e) => setNewEmpRole(e.target.value)}
                            className="w-full rounded-md border border-gray-300 py-1.5 px-2.5 focus:border-blue-500 focus:outline-hidden bg-white text-gray-800"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-500 mb-1 font-medium">Tên tài khoản</label>
                          <input
                            type="text"
                            placeholder="Username..."
                            required
                            value={newEmpUsername}
                            onChange={(e) => setNewEmpUsername(e.target.value)}
                            className="w-full rounded-md border border-gray-300 py-1.5 px-2.5 focus:border-blue-500 focus:outline-hidden bg-white text-gray-800 font-mono"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-gray-500 mb-1 font-medium">Số điện thoại</label>
                          <input
                            type="text"
                            placeholder="SĐT..."
                            value={newEmpPhone}
                            onChange={(e) => setNewEmpPhone(e.target.value)}
                            className="w-full rounded-md border border-gray-300 py-1.5 px-2.5 focus:border-blue-500 focus:outline-hidden bg-white text-gray-800"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-500 mb-1 font-medium">Phân quyền</label>
                          <select
                            value={newEmpPermission}
                            onChange={(e) => setNewEmpPermission(e.target.value as any)}
                            className="w-full rounded-md border border-gray-300 py-1.5 px-2 bg-white text-gray-800 focus:border-blue-500"
                          >
                            <option value="STAFF">STAFF (Nhân viên)</option>
                            <option value="ADMIN">ADMIN (Quản trị)</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-gray-500 mb-1 font-medium">Mật khẩu *</label>
                          <input
                            type="text"
                            required
                            placeholder="Mật khẩu đăng nhập"
                            value={newEmpPassword}
                            onChange={(e) => setNewEmpPassword(e.target.value)}
                            className="w-full rounded-md border border-gray-300 py-1.5 px-2.5 focus:border-blue-500 focus:outline-hidden bg-white text-gray-800 font-mono font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-500 mb-1 font-medium">Email liên hệ</label>
                          <input
                            type="email"
                            placeholder="Email..."
                            value={newEmpEmail}
                            onChange={(e) => setNewEmpEmail(e.target.value)}
                            className="w-full rounded-md border border-gray-300 py-1.5 px-2.5 focus:border-blue-500 focus:outline-hidden bg-white text-gray-800"
                          />
                        </div>
                      </div>
                      
                      {editingEmployee && (
                        <div>
                          <label className="block text-gray-500 mb-1 font-medium">Trạng thái làm việc</label>
                          <select
                            value={newEmpStatus}
                            onChange={(e) => setNewEmpStatus(e.target.value)}
                            className="w-full rounded-md border border-gray-300 py-1.5 px-2 bg-white text-gray-800 focus:border-blue-500"
                          >
                            <option value="Đang hoạt động">Đang hoạt động</option>
                            <option value="Đã nghỉ việc">Đã nghỉ việc</option>
                          </select>
                        </div>
                      )}

                      <div className="flex gap-2 pt-1">
                        <button
                          type="submit"
                          className={`flex-1 font-bold py-2 rounded-lg shadow-sm cursor-pointer transition-colors uppercase tracking-wider text-[10px] text-white ${
                            editingEmployee ? "bg-emerald-600 hover:bg-emerald-700" : "bg-blue-600 hover:bg-blue-700"
                          }`}
                        >
                          {editingEmployee ? "Cập nhật nhân viên" : "Thêm nhân viên mới"}
                        </button>
                        {editingEmployee && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingEmployee(null);
                              setNewEmpName("");
                              setNewEmpRole("Nhân viên");
                              setNewEmpPhone("");
                              setNewEmpEmail("");
                              setNewEmpUsername("");
                              setNewEmpPermission("STAFF");
                              setNewEmpPassword("");
                              setNewEmpStatus("Đang hoạt động");
                            }}
                            className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-3 rounded-lg shadow-sm cursor-pointer transition-colors uppercase tracking-wider text-[10px]"
                          >
                            Hủy
                          </button>
                        )}
                      </div>
                    </form>
                  </div>

                  {/* Phân Quyền hạn */}
                  <div className="bg-white rounded-xl shadow-xs border p-4 space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 border-b pb-2">
                      <Shield className="h-4 w-4 text-emerald-500" />
                      Chi tiết Phân Quyền Hạn
                    </h3>
                    <div className="space-y-3 text-xs text-gray-600">
                      <div className="space-y-1">
                        <span className="font-bold text-red-600 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> ADMIN (Quản lý)
                        </span>
                        <p className="text-[10.5px] leading-relaxed text-gray-500 pl-2.5">
                          Có toàn quyền truy cập toàn bộ hệ thống: xem doanh thu báo cáo, quản lý nhân sự, thiết lập cửa hàng, sửa đổi đơn giá hàng hóa.
                        </p>
                      </div>
                      <div className="space-y-1">
                        <span className="font-bold text-blue-600 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> STAFF (Thu ngân/Kho)
                        </span>
                        <p className="text-[10.5px] leading-relaxed text-gray-500 pl-2.5">
                          Được sử dụng giao diện Màn hình Bán hàng (POS), xem danh mục sản phẩm, tạo phiếu nhập hàng, lập hóa đơn thanh toán cho khách lẻ.
                        </p>
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            </div>
          )}

          {activeTab === "settings" && (
            <Admin data={data} onRefreshData={onRefreshData} />
          )}

        </main>
      </div>

      {/* Product Add/Edit Modal */}
      <AddProductModal
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false);
          setEditingProduct(null);
        }}
        onSave={handleSaveProduct}
        categories={data.Nhom_hang}
        brands={data.Thuong_hieu}
        editingProduct={editingProduct}
        suppliers={data.Nha_cung_cap}
        onRefreshData={onRefreshData}
        products={data.San_pham}
      />

    </div>
  );
}
