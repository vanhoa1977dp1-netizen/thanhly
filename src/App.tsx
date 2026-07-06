import React, { useState, useEffect } from "react";
import { Sparkles, RefreshCw, ShoppingCart, Loader2, Lock } from "lucide-react";
import POSScreen from "./components/POSScreen";
import ManagementScreen from "./components/ManagementScreen";
import { ReceiptModal, ReturnReceiptModal } from "./components/Inbill";
import { DatabaseSchema, Invoice, Customer, ReturnOrder } from "./types";

export default function App() {
  const [data, setData] = useState<DatabaseSchema | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeScreen, setActiveScreen] = useState<"pos" | "admin">(() => {
    return (localStorage.getItem("pos_active_screen") as "pos" | "admin") || "pos";
  });

  useEffect(() => {
    localStorage.setItem("pos_active_screen", activeScreen);
  }, [activeScreen]);
  const [activeReceipt, setActiveReceipt] = useState<Invoice | null>(null);
  const [activeReturnReceipt, setActiveReturnReceipt] = useState<ReturnOrder | null>(null);

  // Admin Login States
  const [showAdminLoginModal, setShowAdminLoginModal] = useState(false);
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminLoginError, setAdminLoginError] = useState("");

  const handleToggleScreen = () => {
    if (activeScreen === "pos") {
      const isAuthed = sessionStorage.getItem("is_admin_authenticated") === "true";
      if (isAuthed) {
        setActiveScreen("admin");
      } else {
        setAdminUsername("");
        setAdminPassword("");
        setAdminLoginError("");
        setShowAdminLoginModal(true);
      }
    } else {
      setActiveScreen("pos");
    }
  };

  const handleAdminLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!data || !data.Nhan_vien) {
      setAdminLoginError("Không tìm thấy dữ liệu nhân viên!");
      return;
    }

    const matchedEmp = data.Nhan_vien.find(
      (emp) =>
        emp.tai_khoan.toLowerCase().trim() === adminUsername.toLowerCase().trim() &&
        (emp.mat_khau || "123456") === adminPassword
    );

    if (!matchedEmp) {
      setAdminLoginError("Sai tên tài khoản hoặc mật khẩu!");
      return;
    }

    if (matchedEmp.quyen_han !== "ADMIN") {
      setAdminLoginError("Tài khoản này không có quyền quản trị (ADMIN)!");
      return;
    }

    // Authenticated successfully
    sessionStorage.setItem("is_admin_authenticated", "true");
    setShowAdminLoginModal(false);
    setActiveScreen("admin");
  };

  // Fetch all initial data
  const loadData = async () => {
    try {
      const res = await fetch("/api/data");
      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Received non-JSON response from server (HTML or other)");
      }
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error("Error loading server data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Sync / Reload callback
  const handleRefreshData = async () => {
    if (!data) {
      setLoading(true);
    }
    await loadData();
  };

  // Add customer callback
  const handleAddCustomer = async (
    customerFields: Omit<Customer, "id" | "diem_tich_luy" | "tong_chi_tieu">
  ): Promise<Customer> => {
    const res = await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(customerFields)
    });
    if (!res.ok) {
      throw new Error(`Server returned status ${res.status}`);
    }
    const contentType = res.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("Received non-JSON response from server");
    }
    const result = await res.json();
    if (result.success) {
      // Reload updated data
      await loadData();
      return result.data as Customer;
    } else {
      throw new Error(result.message || "Failed to create customer");
    }
  };

  // Active check out receipt handler
  const handleCheckoutSuccess = (invoice: Invoice) => {
    setActiveReceipt(invoice);
    loadData(); // pull updated product stocks and overview metrics
  };

  // Render elegant loading spinner on boot
  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-900 text-white font-sans select-none">
        <Loader2 className="h-10 w-10 text-blue-500 animate-spin mb-4" />
        <h2 className="text-sm font-bold tracking-wider uppercase text-gray-400">Đang đồng bộ cơ sở dữ liệu...</h2>
        <p className="text-[11px] text-gray-500 mt-1">Vui lòng chờ trong giây lát</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-900 text-white font-sans select-none">
        <h2 className="text-sm font-bold text-rose-500 uppercase tracking-wider">Lỗi Kết Nối Máy Chủ</h2>
        <p className="text-xs text-gray-400 mt-2">Không thể tải dữ liệu bán hàng. Đảm bảo server.ts đang hoạt động.</p>
        <button
          onClick={handleRefreshData}
          className="mt-4 flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-all"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Thử lại</span>
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f3f4f6]">
      
      {/* Switch Screen Views */}
      {activeScreen === "pos" ? (
        <POSScreen
          data={data}
          onCheckoutSuccess={handleCheckoutSuccess}
          onReturnSuccess={(returnOrder) => {
            setActiveReturnReceipt(returnOrder);
            loadData();
          }}
          onAddCustomer={handleAddCustomer}
          onRefreshData={handleRefreshData}
          onToggleScreen={handleToggleScreen}
        />
      ) : (
        <ManagementScreen
          data={data}
          onRefreshData={handleRefreshData}
          onToggleScreen={handleToggleScreen}
        />
      )}

      {/* Dynamic Thermal Receipt Printer Popup */}
      {activeReceipt && (
        <ReceiptModal
          isOpen={activeReceipt !== null}
          onClose={() => setActiveReceipt(null)}
          invoice={activeReceipt}
          shopInfo={data.Thong_tin_shop}
          products={data.San_pham}
          customers={data.Khach_hang}
          employees={data.Nhan_vien}
          bankAccounts={data.Ngan_hang}
        />
      )}

      {/* Return Thermal Receipt Popup */}
      {activeReturnReceipt && (
        <ReturnReceiptModal
          isOpen={activeReturnReceipt !== null}
          onClose={() => setActiveReturnReceipt(null)}
          returnOrder={activeReturnReceipt}
          shopInfo={data.Thong_tin_shop}
          products={data.San_pham}
          customers={data.Khach_hang}
          employees={data.Nhan_vien}
        />
      )}

      {/* Admin Panel Access Login Modal */}
      {showAdminLoginModal && (
        <div className="fixed inset-0 bg-slate-900/65 flex items-center justify-center z-[150] p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 p-6 space-y-4 relative">
            
            <button
              onClick={() => setShowAdminLoginModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100 cursor-pointer"
            >
              ✕
            </button>

            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-2 font-bold text-lg">
                <Lock className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-800 uppercase tracking-wider">
                Đăng nhập quản trị viên
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Yêu cầu tài khoản quyền <strong className="text-amber-600 font-bold">ADMIN</strong> mới được truy cập Quản Lý & Cài Đặt.
              </p>
            </div>

            <form onSubmit={handleAdminLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Tên tài khoản</label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="Nhập tài khoản admin..."
                  value={adminUsername}
                  onChange={(e) => {
                    setAdminUsername(e.target.value);
                    if (adminLoginError) setAdminLoginError("");
                  }}
                  className="w-full rounded-lg border border-gray-300 py-2.5 px-3 focus:border-amber-500 focus:outline-hidden bg-white text-gray-800 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Mật khẩu</label>
                <input
                  type="password"
                  required
                  placeholder="Nhập mật khẩu..."
                  value={adminPassword}
                  onChange={(e) => {
                    setAdminPassword(e.target.value);
                    if (adminLoginError) setAdminLoginError("");
                  }}
                  className="w-full rounded-lg border border-gray-300 py-2.5 px-3 focus:border-amber-500 focus:outline-hidden bg-white text-gray-800 text-xs font-mono"
                />
              </div>

              {adminLoginError && (
                <div className="text-[11px] text-red-600 bg-red-50 py-1.5 px-2.5 rounded-lg text-center font-medium">
                  ⚠️ {adminLoginError}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdminLoginModal(false)}
                  className="flex-1 rounded-lg border border-gray-300 bg-white py-2.5 text-center text-xs font-semibold text-gray-700 hover:bg-gray-50 focus:outline-hidden cursor-pointer"
                >
                  Quay lại POS
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white py-2.5 text-center text-xs font-bold focus:outline-hidden cursor-pointer uppercase tracking-wider shadow-sm transition-all"
                >
                  Đăng nhập
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
