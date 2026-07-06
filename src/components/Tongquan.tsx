import React, { useState } from "react";
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
  Calendar,
  TrendingUp,
  ShoppingCart,
  DollarSign,
  Package,
  RotateCcw,
  Layers,
  Users
} from "lucide-react";
import { DatabaseSchema } from "../types";

interface TongquanProps {
  data: DatabaseSchema;
}

export default function Tongquan({ data }: TongquanProps) {
  // Overview Tab Date Range Filters
  const [overviewDateFilterType, setOverviewDateFilterType] = useState<"all" | "predefined" | "range">("predefined");
  const [overviewPredefinedRange, setOverviewPredefinedRange] = useState<string>("this_month");
  const [overviewCustomStartDate, setOverviewCustomStartDate] = useState<string>("");
  const [overviewCustomEndDate, setOverviewCustomEndDate] = useState<string>("");

  // Currency formatter
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val);
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
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <LayoutDashboard className="h-5 w-5 text-blue-500" />
          Tổng quan hoạt động kinh doanh
        </h2>
        <div className="text-[11px] text-gray-500 bg-slate-100 px-3 py-1.5 rounded-lg font-medium border">
          Cập nhật cuối: <span className="font-semibold text-slate-800">{new Date(data.Tong_quan.cap_nhat_cuoi_cung).toLocaleString("vi-VN")}</span>
        </div>
      </div>

      {/* Time Range Selector for Reports */}
      <div className="bg-white p-4 rounded-xl border shadow-xs flex flex-col xl:flex-row xl:items-center justify-between gap-4 transition-all">
        <div className="flex items-center gap-2">
          <Calendar className="h-4.5 w-4.5 text-blue-500 shrink-0" />
          <div>
            <span className="text-xs font-bold text-slate-700 block">Thời gian xem báo cáo</span>
            <span className="text-[10px] text-slate-400">Lọc tự động doanh thu, đơn hàng, nhập hàng, lợi nhuận</span>
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
            { id: "all", label: "Tất cả thời gian" },
            { id: "custom", label: "Khoảng tự chọn" }
          ].map((range) => {
            const isActive = 
              (overviewDateFilterType === "range" && range.id === "custom") ||
              (overviewDateFilterType === "all" && range.id === "all") ||
              (overviewDateFilterType === "predefined" && overviewPredefinedRange === range.id);
            return (
              <button
                key={range.id}
                onClick={() => {
                  if (range.id === "custom") {
                    setOverviewDateFilterType("range");
                  } else if (range.id === "all") {
                    setOverviewDateFilterType("all");
                  } else {
                    setOverviewDateFilterType("predefined");
                    setOverviewPredefinedRange(range.id);
                  }
                }}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all duration-150 cursor-pointer ${
                  isActive
                    ? "bg-blue-600 text-white shadow-xs scale-102"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-600 active:scale-98"
                }`}
              >
                {range.label}
              </button>
            );
          })}
        </div>

        {overviewDateFilterType === "range" && (
          <div className="flex items-center gap-2 text-xs border-t xl:border-t-0 xl:border-l pt-3 xl:pt-0 xl:pl-4 transition-all">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 text-[11px] font-medium">Từ ngày</span>
              <input
                type="date"
                value={overviewCustomStartDate}
                onChange={(e) => setOverviewCustomStartDate(e.target.value)}
                className="rounded-lg border border-gray-300 py-1.5 px-2.5 bg-white text-gray-800 focus:border-blue-500 focus:outline-hidden font-medium"
              />
            </div>
            <span className="text-gray-400">—</span>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 text-[11px] font-medium">Đến ngày</span>
              <input
                type="date"
                value={overviewCustomEndDate}
                onChange={(e) => setOverviewCustomEndDate(e.target.value)}
                className="rounded-lg border border-gray-300 py-1.5 px-2.5 bg-white text-gray-800 focus:border-blue-500 focus:outline-hidden font-medium"
              />
            </div>
          </div>
        )}
      </div>

      {/* Section 1: Time-based filtered reporting metrics */}
      <div className="space-y-3">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">
          <span>Chỉ số trong kỳ báo cáo</span>
          <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-semibold border border-blue-100">
            {overviewDateFilterType === "all" ? "Tất cả thời gian" : 
             overviewDateFilterType === "range" ? "Tùy chọn khoảng" : 
             overviewPredefinedRange === "today" ? "Hôm nay" :
             overviewPredefinedRange === "yesterday" ? "Hôm qua" :
             overviewPredefinedRange === "this_week" ? "Tuần này" :
             overviewPredefinedRange === "last_7_days" ? "7 ngày qua" :
             overviewPredefinedRange === "this_month" ? "Tháng này" :
             overviewPredefinedRange === "last_month" ? "Tháng trước" :
             overviewPredefinedRange === "this_quarter" ? "Quý này" : "Năm nay"}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Dynamic Revenue Card */}
          <div className="bg-white rounded-xl shadow-xs border p-4.5 flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-all">
            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
            <div className="flex items-center justify-between text-gray-400">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Doanh thu bán hàng</span>
              <TrendingUp className="h-5 w-5 text-emerald-500" />
            </div>
            <div className="text-xl font-black text-slate-800 mt-2">
              {formatCurrency(periodRevenue)}
            </div>
            <div className="text-[10px] text-emerald-600 font-semibold mt-1">Đã trừ các khoản giảm giá</div>
          </div>

          {/* Dynamic Orders Count Card */}
          <div className="bg-white rounded-xl shadow-xs border p-4.5 flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-all">
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
            <div className="flex items-center justify-between text-gray-400">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Số đơn hàng lập</span>
              <ShoppingCart className="h-5 w-5 text-blue-500" />
            </div>
            <div className="text-xl font-black text-slate-800 mt-2">
              {periodOrderCount} đơn
            </div>
            <div className="text-[10px] text-blue-600 font-semibold mt-1">Giao dịch hoàn tất</div>
          </div>

          {/* Dynamic Gross Profit Card */}
          <div className="bg-white rounded-xl shadow-xs border p-4.5 flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-all">
            <div className="absolute top-0 left-0 w-1 h-full bg-pink-500"></div>
            <div className="flex items-center justify-between text-gray-400">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Lợi nhuận gộp ước tính</span>
              <DollarSign className="h-5 w-5 text-pink-500" />
            </div>
            <div className="text-xl font-black text-slate-800 mt-2">
              {formatCurrency(periodGrossProfit)}
            </div>
            <div className="text-[10px] text-pink-600 font-semibold mt-1">
              {periodRevenue > 0 ? `Tỷ suất ~${Math.round((periodGrossProfit / periodRevenue) * 100)}%` : "Doanh thu trừ giá vốn"}
            </div>
          </div>

          {/* Dynamic Imports Cost Card */}
          <div className="bg-white rounded-xl shadow-xs border p-4.5 flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-all">
            <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
            <div className="flex items-center justify-between text-gray-400">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Chi phí nhập hàng</span>
              <Package className="h-5 w-5 text-amber-500" />
            </div>
            <div className="text-xl font-black text-slate-800 mt-2">
              {formatCurrency(periodImportAmount)}
            </div>
            <div className="text-[10px] text-amber-600 font-semibold mt-1">Giá trị nhập kho bổ sung</div>
          </div>

          {/* Dynamic Customer Returns Card */}
          <div className="bg-white rounded-xl shadow-xs border p-4.5 flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-all">
            <div className="absolute top-0 left-0 w-1 h-full bg-rose-500"></div>
            <div className="flex items-center justify-between text-gray-400">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Khách trả hàng</span>
              <RotateCcw className="h-5 w-5 text-rose-500" />
            </div>
            <div className="text-xl font-black text-slate-800 mt-2">
              {formatCurrency(periodReturnAmount)}
            </div>
            <div className="text-[10px] text-rose-600 font-semibold mt-1">Giá trị hoàn trả khách</div>
          </div>
        </div>
      </div>

      {/* Section 2: Global System Metrics */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">
          <span>Thông số hệ thống (Toàn thời gian)</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Stock Value */}
          <div className="bg-white rounded-xl shadow-xs border p-4 flex items-center justify-between hover:shadow-md transition-all">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-yellow-50 text-yellow-600 border border-yellow-100">
                <Layers className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Tổng giá trị tồn kho</span>
                <span className="text-lg font-black text-slate-800">{formatCurrency(data.Tong_quan.gia_tri_ton_kho_hien_tai)}</span>
              </div>
            </div>
            <span className="text-[10px] text-yellow-600 font-semibold self-end">Giá trị quy đổi vốn</span>
          </div>

          {/* Products SKU count */}
          <div className="bg-white rounded-xl shadow-xs border p-4 flex items-center justify-between hover:shadow-md transition-all">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
                <Package className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Tổng số mặt hàng</span>
                <span className="text-lg font-black text-slate-800">{data.Tong_quan.tong_so_san_pham_he_thong} SKUs</span>
              </div>
            </div>
            <span className="text-[10px] text-indigo-600 font-semibold self-end">Đang lưu kho quản lý</span>
          </div>

          {/* Customer membership count */}
          <div className="bg-white rounded-xl shadow-xs border p-4 flex items-center justify-between hover:shadow-md transition-all">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-pink-50 text-pink-600 border border-pink-100">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Khách hàng đăng ký</span>
                <span className="text-lg font-black text-slate-800">{data.Tong_quan.tong_so_khach_hang} hội viên</span>
              </div>
            </div>
            <span className="text-[10px] text-pink-600 font-semibold self-end">Đã cấp tài khoản</span>
          </div>
        </div>
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-xs border p-5">
          <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider">Doanh thu theo hóa đơn</h3>
          <div className="h-64">
            {revenueData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-400 text-xs">Chưa có dữ liệu giao dịch hóa đơn</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Legend />
                  <Bar dataKey="revenue" name="Doanh thu (đ)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Stock distribution */}
        <div className="bg-white rounded-xl shadow-xs border p-5">
          <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider">Cơ cấu ngành hàng</h3>
          <div className="h-64 flex flex-col items-center justify-center">
            {catDistribution.length === 0 ? (
              <div className="text-gray-400 text-xs">Chưa có sản phẩm theo nhóm</div>
            ) : (
              <>
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={catDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={60}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {catDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Legend */}
                <div className="grid grid-cols-2 gap-2 text-[10px] w-full px-2 mt-2 border-t pt-2">
                  {catDistribution.map((entry, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 truncate">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                      ></span>
                      <span className="text-gray-600 truncate">{entry.name} ({entry.value})</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

      </div>

      {/* Recent paid invoices list */}
      <div className="bg-white rounded-xl shadow-xs border overflow-hidden">
        <div className="px-5 py-4 border-b flex justify-between items-center bg-gray-50/50">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Hóa đơn lập trong kỳ</h3>
          <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-bold">
            {filteredInvoicesForOverview.length} hóa đơn
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b text-gray-500 text-xs font-semibold bg-gray-50/30">
                <th className="py-2.5 px-4">Mã hóa đơn</th>
                <th className="py-2.5 px-4">Ngày lập</th>
                <th className="py-2.5 px-4">Mã khách</th>
                <th className="py-2.5 px-4 text-right">Tổng tiền hàng</th>
                <th className="py-2.5 px-4 text-right">Giảm giá</th>
                <th className="py-2.5 px-4 text-right">Khách đã thanh toán</th>
                <th className="py-2.5 px-4">Phương thức</th>
              </tr>
            </thead>
            <tbody className="divide-y text-xs text-gray-700">
              {filteredInvoicesForOverview.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400 font-medium">
                    Không có hóa đơn nào lập trong khoảng thời gian này
                  </td>
                </tr>
              ) : (
                filteredInvoicesForOverview.slice(-8).reverse().map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-2.5 px-4 font-mono font-semibold text-blue-600">{inv.id}</td>
                    <td className="py-2.5 px-4">{new Date(inv.ngay_lap).toLocaleString("vi-VN")}</td>
                    <td className="py-2.5 px-4 font-mono text-gray-500">{inv.id_khach_hang}</td>
                    <td className="py-2.5 px-4 text-right">{formatCurrency(inv.tong_tien_hang)}</td>
                    <td className="py-2.5 px-4 text-right text-rose-500">-{formatCurrency(inv.giam_gia)}</td>
                    <td className="py-2.5 px-4 text-right font-bold text-emerald-600">{formatCurrency(inv.khach_can_tra)}</td>
                    <td className="py-2.5 px-4 font-medium">{inv.phuong_thuc_thanh_toan}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
