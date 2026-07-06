import React, { useState, useEffect } from "react";
import {
  Users,
  Search,
  Plus,
  Calendar,
  TrendingUp,
  DollarSign,
  Trash2,
  Edit,
  CreditCard,
  Check,
  X,
  User,
  Phone,
  Mail,
  MapPin,
  Award,
  Wallet,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { DatabaseSchema } from "../types";

interface KhachhangProps {
  data: DatabaseSchema;
  onRefreshData: () => void;
}

export default function Khachhang({ data, onRefreshData }: KhachhangProps) {
  const [customerSearch, setCustomerSearch] = useState("");

  const getCustomerTier = (points: number) => {
    if (points >= 200) {
      return { name: "Kim Cương", colorClass: "bg-cyan-50 text-cyan-700 border-cyan-200" };
    } else if (points >= 100) {
      return { name: "Hạng Vàng", colorClass: "bg-amber-100 text-amber-800 border-amber-300" };
    } else if (points >= 50) {
      return { name: "Hạng Bạc", colorClass: "bg-slate-100 text-slate-800 border-slate-300" };
    } else {
      return { name: "Thành viên", colorClass: "bg-blue-50 text-blue-700 border-blue-200" };
    }
  };
  const [customerDateFilterType, setCustomerDateFilterType] = useState<"all" | "predefined" | "range">("all");
  const [customerPredefinedDateRange, setCustomerPredefinedDateRange] = useState("all");
  const [customerCustomStartDate, setCustomerCustomStartDate] = useState("");
  const [customerCustomEndDate, setCustomerCustomEndDate] = useState("");
  const [customerMinTotalSpent, setCustomerMinTotalSpent] = useState("");
  const [customerMaxTotalSpent, setCustomerMaxTotalSpent] = useState("");
  const [customerMinDebt, setCustomerMinDebt] = useState("");
  const [customerMaxDebt, setCustomerMaxDebt] = useState("");

  const [showCustomerQuickAdd, setShowCustomerQuickAdd] = useState(false);
  const [custName, setCustName] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [custEmail, setCustEmail] = useState("");
  const [custAddress, setCustAddress] = useState("");

  const [customerPageSize, setCustomerPageSize] = useState<number>(15);
  const [customerCurrentPage, setCustomerCurrentPage] = useState<number>(1);

  // Reset page when search or size changes
  React.useEffect(() => {
    setCustomerCurrentPage(1);
  }, [
    customerSearch,
    customerDateFilterType,
    customerPredefinedDateRange,
    customerCustomStartDate,
    customerCustomEndDate,
    customerMinTotalSpent,
    customerMaxTotalSpent,
    customerMinDebt,
    customerMaxDebt,
    customerPageSize
  ]);

  // Modals & New States for Edit Customer and Debt Payment
  const [editingCust, setEditingCust] = useState<any>(null);
  const [payingDebtCust, setPayingDebtCust] = useState<any>(null);
  const [debtPayAmount, setDebtPayAmount] = useState<number | "">("");

  const handleEditCustomerSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCust) return;
    const updated = { ...data };
    updated.Khach_hang = updated.Khach_hang.map(c => 
      c.id === editingCust.id ? {
        ...c,
        ho_ten: editingCust.ho_ten.trim(),
        so_dien_thoai: editingCust.so_dien_thoai.trim(),
        email: editingCust.email.trim() || "chua_cap_nhat@gmail.com",
        dia_chi: editingCust.dia_chi.trim() || "Chưa cập nhật",
        loai_khach: editingCust.loai_khach,
        diem_tich_luy: Number(editingCust.diem_tich_luy || 0),
        tong_chi_tieu: Number(editingCust.tong_chi_tieu || 0)
      } : c
    );

    try {
      const res = await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated)
      });
      if ((await res.json()).success) {
        onRefreshData();
        setEditingCust(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const formatNumberWithDots = (val: number) => {
    return new Intl.NumberFormat("vi-VN").format(val);
  };

  const handleDebtPayAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, ""); // Remove all non-digit characters
    if (rawValue === "") {
      setDebtPayAmount("");
    } else {
      setDebtPayAmount(parseInt(rawValue, 10));
    }
  };

  const handleDebtPaymentSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingDebtCust) return;
    const amountToPay = Number(debtPayAmount || 0);
    if (amountToPay <= 0) {
      alert("Số tiền thanh toán phải lớn hơn 0!");
      return;
    }

    const updated = { ...data };
    let remainingPay = amountToPay;

    // Get this customer's invoices sorted by date
    const customerInvoices = updated.Hoa_don
      .filter(inv => inv.id_khach_hang === payingDebtCust.id && inv.khach_can_tra > inv.khach_da_tra)
      .sort((a, b) => new Date(a.ngay_lap).getTime() - new Date(b.ngay_lap).getTime());

    if (customerInvoices.length === 0) {
      alert("Khách hàng không có nợ cần thanh toán!");
      return;
    }

    for (let inv of customerInvoices) {
      const unpaid = inv.khach_can_tra - inv.khach_da_tra;
      if (remainingPay >= unpaid) {
        inv.khach_da_tra += unpaid;
        remainingPay -= unpaid;
      } else {
        inv.khach_da_tra += remainingPay;
        remainingPay = 0;
      }
      if (remainingPay <= 0) break;
    }

    const customer = updated.Khach_hang.find(c => c.id === payingDebtCust.id);
    if (customer) {
      const actuallyPaid = amountToPay - remainingPay;
      customer.cong_no = Math.max(0, (customer.cong_no || 0) - actuallyPaid);
    }

    try {
      const res = await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated)
      });
      if ((await res.json()).success) {
        onRefreshData();
        setPayingDebtCust(null);
        setDebtPayAmount("");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val);
  };

  const isWithinCustomerDateFilter = (lastTxDateStr?: string | null) => {
    if (!lastTxDateStr) {
      return customerDateFilterType === "all" || customerPredefinedDateRange === "all";
    }
    const txDate = new Date(lastTxDateStr);
    if (isNaN(txDate.getTime())) return true;

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

  const handleDeleteCustomer = async (id: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa khách hàng này (${id})?`)) return;
    const updated = { ...data };
    updated.Khach_hang = updated.Khach_hang.filter(c => c.id !== id);

    try {
      const res = await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated)
      });
      if ((await res.json()).success) {
        onRefreshData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredCustomers = data.Khach_hang.filter((c) => {
    const q = customerSearch.toLowerCase().trim();
    const matchSearch =
      !q ||
      c.ho_ten.toLowerCase().includes(q) ||
      c.so_dien_thoai.includes(q) ||
      c.id.toLowerCase().includes(q);

    const customerInvoices = data.Hoa_don.filter((inv) => inv.id_khach_hang === c.id);
    const lastInv =
      customerInvoices.length > 0
        ? [...customerInvoices].sort(
            (a, b) => new Date(b.ngay_lap).getTime() - new Date(a.ngay_lap).getTime()
          )[0]
        : null;
    const lastTxDate = lastInv ? lastInv.ngay_lap : null;

    const currentDebt = customerInvoices.reduce((acc, inv) => {
      const diff = inv.khach_can_tra - inv.khach_da_tra;
      return acc + (diff > 0 ? diff : 0);
    }, 0);

    const matchDate = isWithinCustomerDateFilter(lastTxDate);

    const minSpentVal = customerMinTotalSpent !== "" ? parseFloat(customerMinTotalSpent) : null;
    const maxSpentVal = customerMaxTotalSpent !== "" ? parseFloat(customerMaxTotalSpent) : null;
    const matchTotalSpent =
      (minSpentVal === null || c.tong_chi_tieu >= minSpentVal) &&
      (maxSpentVal === null || c.tong_chi_tieu <= maxSpentVal);

    const minDebtVal = customerMinDebt !== "" ? parseFloat(customerMinDebt) : null;
    const maxDebtVal = customerMaxDebt !== "" ? parseFloat(customerMaxDebt) : null;
    const matchDebt =
      (minDebtVal === null || currentDebt >= minDebtVal) &&
      (maxDebtVal === null || currentDebt <= maxDebtVal);

    return matchSearch && matchDate && matchTotalSpent && matchDebt;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
        <Users className="h-5 w-5 text-blue-500" />
        Quản lý Khách hàng thành viên
      </h2>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Customer List Area */}
        <div className="xl:col-span-3 space-y-4">
          <div className="bg-white rounded-xl shadow-xs border px-4 py-3 flex justify-between items-center text-xs text-gray-500">
            <div className="font-semibold">
              Danh sách khách hàng ({filteredCustomers.length} kết quả khớp bộ lọc)
            </div>

            {(customerSearch ||
              customerDateFilterType !== "all" ||
              customerMinTotalSpent ||
              customerMaxTotalSpent ||
              customerMinDebt ||
              customerMaxDebt) && (
              <button
                onClick={() => {
                  setCustomerSearch("");
                  setCustomerDateFilterType("all");
                  setCustomerPredefinedDateRange("all");
                  setCustomerCustomStartDate("");
                  setCustomerCustomEndDate("");
                  setCustomerMinTotalSpent("");
                  setCustomerMaxTotalSpent("");
                  setCustomerMinDebt("");
                  setCustomerMaxDebt("");
                }}
                className="text-blue-600 hover:text-blue-800 font-semibold cursor-pointer text-[11px]"
              >
                Xóa tất cả bộ lọc
              </button>
            )}
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
          <th className="py-2 px-4 w-24">Mã KH</th>
          <th className="py-2 px-4">Họ và Tên</th>
          <th className="py-2 px-4 w-36">Số điện thoại</th>
          <th className="py-2 px-4 text-center w-36">Xếp hạng / Điểm</th>
          <th className="py-2 px-4 text-right">Tổng bán (Chi tiêu)</th>
          <th className="py-2 px-4 text-right text-rose-600">Nợ hiện tại</th>
          <th className="py-2 px-4 text-center w-32">Giao dịch cuối</th>
          <th className="py-2 px-4 text-center w-28">Hành động</th>
        </tr>
      </thead>
      <tbody className="text-xs text-gray-700">
        {(() => {
          const totalItems = filteredCustomers.length;
          const totalPages = Math.ceil(totalItems / customerPageSize) || 1;
          const safeCurrentPage = Math.max(1, Math.min(customerCurrentPage, totalPages));
          const paginatedCustomers = filteredCustomers.slice(
            (safeCurrentPage - 1) * customerPageSize,
            safeCurrentPage * customerPageSize
          );

          return (
            <>
              {paginatedCustomers.map((c) => {
                const customerInvoices = data.Hoa_don.filter((inv) => inv.id_khach_hang === c.id);
                const currentDebt = customerInvoices.reduce((acc, inv) => {
                  const diff = inv.khach_can_tra - inv.khach_da_tra;
                  return acc + (diff > 0 ? diff : 0);
                }, 0);
                const lastInv = customerInvoices.length > 0
                  ? [...customerInvoices].sort(
                      (a, b) => new Date(b.ngay_lap).getTime() - new Date(a.ngay_lap).getTime()
                    )[0]
                  : null;
                const lastTxDateStr = lastInv
                  ? new Date(lastInv.ngay_lap).toLocaleDateString("vi-VN")
                  : "Chưa có";

                return (
                  <tr key={c.id} className="border-b last:border-0 hover:bg-slate-50/50 transition-colors h-[42px]">
                    <td className="py-1 px-4 font-mono font-semibold text-blue-600 truncate">{c.id}</td>
                    <td className="py-1 px-4 font-medium text-gray-900 max-w-[180px]">
                      <div className="truncate">{c.ho_ten}</div>
                      {c.email && c.email !== "chua_cap_nhat@gmail.com" && (
                        <div className="text-[10px] text-gray-400 font-normal truncate">{c.email}</div>
                      )}
                    </td>
                    <td className="py-1 px-4 font-mono text-gray-600">{c.so_dien_thoai}</td>
                    <td className="py-1 px-4 text-center">
                      {(() => {
                        const tier = getCustomerTier(c.diem_tich_luy);
                        return (
                          <div className="flex flex-col items-center justify-center leading-none gap-0.5">
                            <span className={`px-1.5 py-0.5 rounded-full font-bold text-[9px] border ${tier.colorClass}`}>
                              {tier.name}
                            </span>
                            <span className="text-purple-600 font-bold text-[10px]">{c.diem_tich_luy}đ</span>
                          </div>
                        );
                      })()}
                    </td>
                    <td className="py-1 px-4 text-right font-semibold text-emerald-600">
                      {formatCurrency(c.tong_chi_tieu)}
                    </td>
                    <td className={`py-1 px-4 text-right font-bold ${currentDebt > 0 ? "text-rose-600 bg-rose-50/30" : "text-gray-400"}`}>
                      {currentDebt > 0 ? formatCurrency(currentDebt) : "0 đ"}
                    </td>
                    <td className="py-1 px-4 text-center text-gray-500 font-medium">{lastTxDateStr}</td>
                    <td className="py-1 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {currentDebt > 0 && (
                          <button
                            onClick={() => {
                              setPayingDebtCust(c);
                              setDebtPayAmount(currentDebt);
                            }}
                            className="p-1 rounded-full text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                            title="Thu nợ khách hàng"
                          >
                            <CreditCard className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => setEditingCust(c)}
                          className="p-1 rounded-full text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                          title="Chỉnh sửa thông tin"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteCustomer(c.id)}
                          className="p-1 rounded-full text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Xóa khách hàng"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {/* Bù dòng trống không border để giữ layout khít 15 dòng */}
              {paginatedCustomers.length > 0 && paginatedCustomers.length < 15 && (
                Array.from({ length: 15 - paginatedCustomers.length }).map((_, index) => (
                  <tr key={`empty-${index}`} className="h-[42px] border-none">
                    <td colSpan={8}></td>
                  </tr>
                ))
              )}

              {/* Trạng thái rỗng khi không tìm thấy kết quả phù hợp */}
              {totalItems === 0 && (
                <tr className="h-[630px] border-none">
                  <td colSpan={8} className="text-center text-gray-400 font-medium vertical-middle">
                    <div className="flex flex-col items-center justify-center h-full gap-2">
                      <Users className="h-8 w-8 text-gray-300" />
                      <span>Không tìm thấy thành viên nào khớp bộ lọc</span>
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

  {/* Pagination Controls: Cố định h-[62px] ở đáy khung */}
  {(() => {
    const totalItems = filteredCustomers.length;
    const totalPages = Math.ceil(totalItems / customerPageSize) || 1;
    const safeCurrentPage = Math.max(1, Math.min(customerCurrentPage, totalPages));

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
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t bg-gray-50/50 text-xs text-gray-500 font-medium h-[62px]">
        <div className="flex items-center gap-2">
          <span>Hiển thị:</span>
          <select
            value={customerPageSize}
            onChange={(e) => setCustomerPageSize(Number(e.target.value))}
            className="rounded-md border border-gray-300 bg-white px-2 py-1 focus:border-blue-500 focus:outline-hidden text-gray-700 cursor-pointer text-xs font-semibold"
          >
            <option value={15}>15 dòng</option>
            <option value={30}>30 dòng</option>
            <option value={50}>50 dòng</option>
            <option value={100}>100 dòng</option>
          </select>
          <span className="text-gray-400">|</span>
          <span>
            Hiển thị {totalItems > 0 ? (safeCurrentPage - 1) * customerPageSize + 1 : 0} - {Math.min(safeCurrentPage * customerPageSize, totalItems)} trong {totalItems} dòng
          </span>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCustomerCurrentPage(1)}
              disabled={safeCurrentPage === 1}
              className="p-1 rounded-md border border-gray-300 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-white transition-colors cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" style={{ strokeWidth: 3 }} />
            </button>
            <button
              onClick={() => setCustomerCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={safeCurrentPage === 1}
              className="p-1 rounded-md border border-gray-300 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-white transition-colors cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {getPageNumbers().map((p, idx) => {
              if (p === "...") {
                return (
                  <span key={`dots-${idx}`} className="px-2 py-1 text-gray-400 select-none">
                    ...
                  </span>
                );
              }
              return (
                <button
                  key={`customer-page-${p}`}
                  onClick={() => setCustomerCurrentPage(p)}
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
              onClick={() => setCustomerCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={safeCurrentPage === totalPages}
              className="p-1 rounded-md border border-gray-300 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-white transition-colors cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCustomerCurrentPage(totalPages)}
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
        </div>

        {/* Right Sidebar Filter Area */}
        <div className="space-y-6">
          {/* Section 1: Tìm khách hàng & Tạo mới */}
          <div className="bg-white rounded-xl shadow-xs border p-4 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Users className="h-4 w-4 text-blue-500" />
                Tìm khách hàng
              </h3>
              <button
                onClick={() => setShowCustomerQuickAdd(!showCustomerQuickAdd)}
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-all flex items-center gap-0.5 cursor-pointer shadow-xs border ${
                  showCustomerQuickAdd
                    ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300"
                    : "bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200"
                }`}
                title="Tạo nhanh khách hàng thành viên"
              >
                <Plus className="h-3 w-3" />
                Tạo mới
              </button>
            </div>

            {/* Search Field */}
            <div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-gray-400">
                  <Search className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  placeholder="Họ tên, SĐT, mã số..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="w-full rounded-md border border-gray-300 py-1.5 pl-8 pr-3 text-xs focus:border-blue-500 focus:outline-hidden text-gray-800 bg-white"
                />
              </div>
            </div>

            {/* Quick Add Form under the Search field, collapsible */}
            {showCustomerQuickAdd && (
              <div className="border-t pt-3 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="rounded-lg bg-slate-50 p-2.5 border">
                  <div className="text-[11px] font-bold text-slate-700 mb-2">
                    <span>+ Đăng ký khách mới</span>
                  </div>
                  <form onSubmit={handleQuickAddCustomerDirect} className="space-y-2">
                    <div>
                      <input
                        type="text"
                        required
                        placeholder="Họ tên đầy đủ *"
                        value={custName}
                        onChange={(e) => setCustName(e.target.value)}
                        className="w-full text-xs rounded-md border border-gray-300 py-1 px-2 focus:border-blue-500 focus:outline-hidden bg-white text-gray-800"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        required
                        placeholder="SĐT di động *"
                        value={custPhone}
                        onChange={(e) => setCustPhone(e.target.value)}
                        className="w-full text-xs rounded-md border border-gray-300 py-1 px-2 focus:border-blue-500 focus:outline-hidden bg-white text-gray-800"
                      />
                    </div>
                    <div>
                      <input
                        type="email"
                        placeholder="Email (tùy chọn)"
                        value={custEmail}
                        onChange={(e) => setCustEmail(e.target.value)}
                        className="w-full text-xs rounded-md border border-gray-300 py-1 px-2 focus:border-blue-500 focus:outline-hidden bg-white text-gray-800"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="Địa chỉ (tùy chọn)"
                        value={custAddress}
                        onChange={(e) => setCustAddress(e.target.value)}
                        className="w-full text-xs rounded-md border border-gray-300 py-1 px-2 focus:border-blue-500 focus:outline-hidden bg-white text-gray-800"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-[10px] py-1.5 rounded-md transition-colors uppercase tracking-wider cursor-pointer"
                    >
                      Lưu thông tin khách
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Ngày giao dịch cuối */}
          <div className="bg-white rounded-xl shadow-xs border p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 border-b pb-2">
              <Calendar className="h-4 w-4 text-blue-500" />
              Ngày giao dịch cuối
            </h3>

            <div className="space-y-2">
              {/* Predefined select */}
              <label className="flex items-start gap-2 text-xs font-medium text-gray-700 cursor-pointer">
                <input
                  type="radio"
                  name="customerDateFilterType"
                  checked={customerDateFilterType === "predefined"}
                  onChange={() => setCustomerDateFilterType("predefined")}
                  className="text-blue-600 focus:ring-blue-500 mt-0.5 h-3.5 w-3.5 bg-white border-gray-300"
                />
                <div className="flex-1">
                  <span>Mốc thời gian có sẵn</span>
                  {customerDateFilterType === "predefined" && (
                    <select
                      value={customerPredefinedDateRange}
                      onChange={(e) => setCustomerPredefinedDateRange(e.target.value)}
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

              {/* Custom range date */}
              <label className="flex items-start gap-2 text-xs font-medium text-gray-700 cursor-pointer">
                <input
                  type="radio"
                  name="customerDateFilterType"
                  checked={customerDateFilterType === "range"}
                  onChange={() => setCustomerDateFilterType("range")}
                  className="text-blue-600 focus:ring-blue-500 mt-0.5 h-3.5 w-3.5 bg-white border-gray-300"
                />
                <div className="flex-1">
                  <span>Chọn Từ ngày - Đến ngày</span>
                  {customerDateFilterType === "range" && (
                    <div className="mt-1.5 space-y-1.5 animate-in fade-in duration-100">
                      <div>
                        <span className="block text-[9px] text-gray-400 font-semibold uppercase">Từ ngày</span>
                        <input
                          type="date"
                          value={customerCustomStartDate}
                          onChange={(e) => setCustomerCustomStartDate(e.target.value)}
                          className="w-full text-xs rounded-md border border-gray-300 py-1 px-2 focus:border-blue-500 focus:outline-hidden bg-white text-gray-700"
                        />
                      </div>
                      <div>
                        <span className="block text-[9px] text-gray-400 font-semibold uppercase">Đến ngày</span>
                        <input
                          type="date"
                          value={customerCustomEndDate}
                          onChange={(e) => setCustomerCustomEndDate(e.target.value)}
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
                  name="customerDateFilterType"
                  checked={customerDateFilterType === "all"}
                  onChange={() => setCustomerDateFilterType("all")}
                  className="text-blue-600 focus:ring-blue-500 h-3.5 w-3.5 bg-white border-gray-300"
                />
                <span>Tất cả thời gian tạo</span>
              </label>
            </div>
          </div>

          {/* Section 3: Tổng bán (giá trị Từ/Đến) */}
          <div className="bg-white rounded-xl shadow-xs border p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 border-b pb-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              Tìm theo Tổng bán
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="block text-[9px] text-gray-400 font-semibold uppercase mb-0.5">Giá trị Từ</span>
                <input
                  type="number"
                  placeholder="Tối thiểu..."
                  value={customerMinTotalSpent}
                  onChange={(e) => setCustomerMinTotalSpent(e.target.value)}
                  className="w-full text-xs rounded-md border border-gray-300 py-1 px-2 focus:border-blue-500 focus:outline-hidden bg-white text-gray-800"
                />
              </div>
              <div>
                <span className="block text-[9px] text-gray-400 font-semibold uppercase mb-0.5">Giá trị Đến</span>
                <input
                  type="number"
                  placeholder="Tối đa..."
                  value={customerMaxTotalSpent}
                  onChange={(e) => setCustomerMaxTotalSpent(e.target.value)}
                  className="w-full text-xs rounded-md border border-gray-300 py-1 px-2 focus:border-blue-500 focus:outline-hidden bg-white text-gray-800"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Nợ hiện tại (Từ/Đến) */}
          <div className="bg-white rounded-xl shadow-xs border p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 border-b pb-2">
              <DollarSign className="h-4 w-4 text-red-500" />
              Nợ hiện tại
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="block text-[9px] text-gray-400 font-semibold uppercase mb-0.5">Giá trị Từ</span>
                <input
                  type="number"
                  placeholder="Tối thiểu..."
                  value={customerMinDebt}
                  onChange={(e) => setCustomerMinDebt(e.target.value)}
                  className="w-full text-xs rounded-md border border-gray-300 py-1 px-2 focus:border-blue-500 focus:outline-hidden bg-white text-gray-800"
                />
              </div>
              <div>
                <span className="block text-[9px] text-gray-400 font-semibold uppercase mb-0.5">Giá trị Đến</span>
                <input
                  type="number"
                  placeholder="Tối đa..."
                  value={customerMaxDebt}
                  onChange={(e) => setCustomerMaxDebt(e.target.value)}
                  className="w-full text-xs rounded-md border border-gray-300 py-1 px-2 focus:border-blue-500 focus:outline-hidden bg-white text-gray-800"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Dialog: Edit Customer Info */}
      {editingCust && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl overflow-hidden animate-in zoom-in-95 duration-150 border border-slate-200 flex flex-col">
            <div className="flex items-center justify-between bg-slate-50 border-b border-slate-150 px-5 py-3.5 text-slate-800">
              <div className="flex items-center gap-2">
                <Users className="h-4.5 w-4.5 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-800">Chỉnh sửa thông tin khách hàng</h3>
              </div>
              <button 
                onClick={() => setEditingCust(null)} 
                className="rounded-full p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleEditCustomerSave} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-500 mb-1">Mã khách hàng</label>
                <input
                  type="text"
                  disabled
                  value={editingCust.id}
                  className="w-full rounded-md border border-slate-200 bg-slate-100 px-3 py-1.5 font-mono text-slate-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-500 mb-1">Họ và Tên *</label>
                <input
                  type="text"
                  required
                  value={editingCust.ho_ten}
                  onChange={(e) => setEditingCust({ ...editingCust, ho_ten: e.target.value })}
                  className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-slate-800 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-500 mb-1">Số điện thoại *</label>
                <input
                  type="text"
                  required
                  value={editingCust.so_dien_thoai}
                  onChange={(e) => setEditingCust({ ...editingCust, so_dien_thoai: e.target.value })}
                  className="w-full rounded-md border border-slate-300 px-3 py-1.5 font-mono text-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-500 mb-1">Email</label>
                <input
                  type="email"
                  value={editingCust.email === "chua_cap_nhat@gmail.com" ? "" : editingCust.email}
                  placeholder="Nhập địa chỉ email..."
                  onChange={(e) => setEditingCust({ ...editingCust, email: e.target.value })}
                  className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-500 mb-1">Địa chỉ</label>
                <input
                  type="text"
                  value={editingCust.dia_chi === "Chưa cập nhật" ? "" : editingCust.dia_chi}
                  placeholder="Nhập địa chỉ..."
                  onChange={(e) => setEditingCust({ ...editingCust, dia_chi: e.target.value })}
                  className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-500 mb-1">Phân hạng</label>
                  <select
                    value={editingCust.loai_khach}
                    onChange={(e) => setEditingCust({ ...editingCust, loai_khach: e.target.value })}
                    className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-slate-800 bg-white cursor-pointer"
                  >
                    <option value="Thành viên">Thành viên</option>
                    <option value="Hạng Bạc">Hạng Bạc</option>
                    <option value="Hạng Vàng">Hạng Vàng</option>
                    <option value="VIP">Khách hàng VIP</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-500 mb-1">Điểm tích lũy</label>
                  <input
                    type="number"
                    min="0"
                    value={editingCust.diem_tich_luy}
                    onChange={(e) => setEditingCust({ ...editingCust, diem_tich_luy: Number(e.target.value) })}
                    className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-slate-800 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-500 mb-1">Tổng chi tiêu (đ)</label>
                <input
                  type="number"
                  min="0"
                  value={editingCust.tong_chi_tieu}
                  onChange={(e) => setEditingCust({ ...editingCust, tong_chi_tieu: Number(e.target.value) })}
                  className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-emerald-600 font-mono font-bold"
                />
              </div>

              <div className="flex gap-2 pt-3 justify-end border-t">
                <button
                  type="button"
                  onClick={() => setEditingCust(null)}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 hover:bg-blue-700 px-5 py-2 text-xs font-bold text-white transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Check className="h-4 w-4" />
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modern Dialog: Debt Payment for Customer */}
      {payingDebtCust && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl overflow-hidden animate-in zoom-in-95 duration-150 border border-slate-200 flex flex-col">
            <div className="flex items-center justify-between bg-slate-50 border-b border-slate-150 px-5 py-3.5 text-slate-800">
              <div className="flex items-center gap-2">
                <Wallet className="h-4.5 w-4.5 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-800">Thu nợ khách hàng</h3>
              </div>
              <button 
                onClick={() => setPayingDebtCust(null)} 
                className="rounded-full p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleDebtPaymentSave} className="p-5 space-y-4 text-xs">
              <div className="bg-emerald-50 text-emerald-800 p-3 rounded-lg border border-emerald-100 flex justify-between items-center">
                <div>
                  <p className="font-semibold text-emerald-900">{payingDebtCust.ho_ten}</p>
                  <p className="text-[10px] text-emerald-600">{payingDebtCust.so_dien_thoai}</p>
                </div>
                <div className="text-right">
                  <span className="block text-[10px] text-emerald-600 font-bold uppercase">Tổng nợ hiện tại</span>
                  <span className="text-sm font-extrabold text-emerald-800">
                    {(() => {
                      const customerInvoices = data.Hoa_don.filter((inv) => inv.id_khach_hang === payingDebtCust.id);
                      const currentDebt = customerInvoices.reduce((acc, inv) => {
                        const diff = inv.khach_can_tra - inv.khach_da_tra;
                        return acc + (diff > 0 ? diff : 0);
                      }, 0);
                      return formatCurrency(currentDebt);
                    })()}
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-500 mb-1.5">Số tiền khách thanh toán (đ)</label>
                <div className="relative rounded-md shadow-2xs">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <DollarSign className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    placeholder="Nhập số tiền..."
                    value={debtPayAmount !== "" ? formatNumberWithDots(debtPayAmount) : ""}
                    onChange={handleDebtPayAmountChange}
                    className="w-full rounded-md border border-slate-300 py-2.5 pl-8 pr-3 font-mono font-bold text-slate-800 text-sm focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  💡 Hệ thống sẽ tự động trừ trừ dần từ hóa đơn nợ cũ nhất đến hóa đơn mới nhất.
                </p>
              </div>

              <div className="flex gap-2.5 pt-3.5 justify-end border-t">
                <button
                  type="button"
                  onClick={() => setPayingDebtCust(null)}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-600 hover:bg-emerald-700 px-5 py-2 text-xs font-bold text-white transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Check className="h-4 w-4" />
                  Xác nhận thu nợ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
