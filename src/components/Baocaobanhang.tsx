import React from "react";
import {
  Users
} from "lucide-react";
import {
  ResponsiveContainer as RechartsResponsiveContainer,
  BarChart as RechartsBarChart,
  CartesianGrid as RechartsCartesianGrid,
  XAxis as RechartsXAxis,
  YAxis as RechartsYAxis,
  Tooltip as RechartsTooltip,
  Bar as RechartsBar
} from "recharts";
import { DatabaseSchema, Invoice } from "../types";

interface BaocaobanhangProps {
  data: DatabaseSchema;
  filteredInvoicesForReports: Invoice[];
  rPeriodRevenue: number;
  rPeriodOrderCount: number;
  rPeriodGrossProfit: number;
  rTopCustomers: any[];
  rStaffRevenueData: any[];
}

export default function Baocaobanhang({
  data,
  filteredInvoicesForReports,
  rPeriodRevenue,
  rPeriodOrderCount,
  rPeriodGrossProfit,
  rTopCustomers,
  rStaffRevenueData
}: BaocaobanhangProps) {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Analysis Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Doanh thu kỳ báo cáo
          </span>
          <div className="text-2xl font-black text-blue-600 mt-1">
            {formatCurrency(rPeriodRevenue)}
          </div>
          <p className="text-[10px] text-gray-400 mt-1">Tổng doanh số bán lẻ chưa trừ hàng trả</p>
        </div>

        <div className="bg-white p-5 rounded-xl border shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Giá trị hóa đơn TB
          </span>
          <div className="text-2xl font-black text-slate-800 mt-1">
            {formatCurrency(rPeriodOrderCount > 0 ? rPeriodRevenue / rPeriodOrderCount : 0)}
          </div>
          <p className="text-[10px] text-gray-400 mt-1">Mức chi tiêu trung bình trên mỗi giao dịch</p>
        </div>

        <div className="bg-white p-5 rounded-xl border shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Lợi nhuận gộp (Ước tính)
          </span>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            {formatCurrency(rPeriodGrossProfit)}
          </div>
          <p className="text-[10px] text-gray-400 mt-1">Lợi nhuận gộp = Doanh thu - Giá vốn hàng bán</p>
        </div>

        <div className="bg-white p-5 rounded-xl border shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Tỷ suất lợi nhuận gộp
          </span>
          <div className="text-2xl font-black text-indigo-600 mt-1">
            {rPeriodRevenue > 0 ? ((rPeriodGrossProfit / rPeriodRevenue) * 100).toFixed(1) + "%" : "0%"}
          </div>
          <p className="text-[10px] text-gray-400 mt-1">Tỷ lệ lợi nhuận gộp trên tổng doanh thu</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue trend chart */}
        <div className="bg-white p-5 rounded-xl border shadow-xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-bold">
            Doanh thu theo từng hóa đơn
          </h3>
          <div className="h-64">
            {filteredInvoicesForReports.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-400 text-xs font-medium">
                Không đủ dữ liệu hóa đơn để hiển thị biểu đồ.
              </div>
            ) : (
              <RechartsResponsiveContainer width="100%" height="100%">
                <RechartsBarChart
                  data={filteredInvoicesForReports.map((inv) => ({
                    name: inv.id,
                    DoanhThu: inv.khach_can_tra
                  }))}
                >
                  <RechartsCartesianGrid strokeDasharray="3 3" vertical={false} />
                  <RechartsXAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <RechartsYAxis tick={{ fontSize: 10 }} />
                  <RechartsTooltip formatter={(value) => formatCurrency(Number(value))} />
                  <RechartsBar dataKey="DoanhThu" fill="#10b981" radius={[4, 4, 0, 0]} />
                </RechartsBarChart>
              </RechartsResponsiveContainer>
            )}
          </div>
        </div>

        {/* Staff Revenue Distribution */}
        <div className="bg-white p-5 rounded-xl border shadow-xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-bold">
            Doanh số đóng góp theo Nhân viên
          </h3>
          <div className="h-64">
            {rStaffRevenueData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-400 text-xs font-medium">
                Không đủ dữ liệu nhân viên để hiển thị biểu đồ.
              </div>
            ) : (
              <RechartsResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={rStaffRevenueData} layout="vertical">
                  <RechartsCartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <RechartsXAxis type="number" tick={{ fontSize: 10 }} />
                  <RechartsYAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={80} />
                  <RechartsTooltip formatter={(value) => formatCurrency(Number(value))} />
                  <RechartsBar dataKey="revenue" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </RechartsBarChart>
              </RechartsResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Top Spending Customers Table & Insights Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left: Top Spending Customers Table */}
        <div className="xl:col-span-2 bg-white rounded-xl border shadow-xs overflow-hidden">
          <div className="p-4 border-b bg-gray-50/50 flex items-center gap-1.5">
            <Users className="h-4 w-4 text-indigo-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Top 10 Khách hàng chi tiêu cao nhất
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b text-gray-500 font-semibold bg-gray-50/30">
                  <th className="py-2.5 px-4">Mã khách hàng</th>
                  <th className="py-2.5 px-4">Tên khách hàng</th>
                  <th className="py-2.5 px-4 text-center">Số lượt mua</th>
                  <th className="py-2.5 px-4 text-right">Tổng chi tiêu</th>
                </tr>
              </thead>
              <tbody className="divide-y text-gray-700">
                {rTopCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-gray-400 font-medium">
                      Chưa ghi nhận giao dịch của khách hàng thành viên.
                    </td>
                  </tr>
                ) : (
                  rTopCustomers.slice(0, 10).map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-2.5 px-4 font-mono font-bold text-slate-600">
                        {item.id === "vang_lai" ? "LẺ" : item.id}
                      </td>
                      <td className="py-2.5 px-4 font-medium text-slate-800">{item.name}</td>
                      <td className="py-2.5 px-4 text-center font-bold text-slate-600">{item.count}</td>
                      <td className="py-2.5 px-4 text-right font-black text-emerald-600">
                        {formatCurrency(item.spend)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Sales Analysis Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border shadow-xs p-4 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b pb-2 flex items-center gap-1.5 font-bold">
              <Users className="h-4 w-4 text-blue-500" />
              Hiệu suất nhân sự kỳ này
            </h3>
            <div className="space-y-3.5 text-xs">
              {(() => {
                const bestStaff = rStaffRevenueData.length > 0 
                  ? [...rStaffRevenueData].sort((a, b) => b.revenue - a.revenue)[0] 
                  : null;
                return (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                        Nhân sự xuất sắc nhất
                      </span>
                      <span className="font-bold text-slate-800">
                        {bestStaff ? bestStaff.name : "Chưa có"}
                      </span>
                    </div>
                    {bestStaff && (
                      <div className="flex justify-between items-center pl-3.5 text-gray-400 font-medium">
                        <span>Doanh số đóng góp</span>
                        <span className="font-semibold text-slate-700">{formatCurrency(bestStaff.revenue)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                        Hóa đơn trung bình (AOV)
                      </span>
                      <span className="font-bold text-slate-800">
                        {formatCurrency(rPeriodOrderCount > 0 ? rPeriodRevenue / rPeriodOrderCount : 0)}
                      </span>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

          <div className="bg-slate-50 border rounded-xl p-4 text-xs text-slate-600 space-y-2">
            <h4 className="font-bold text-slate-700 uppercase tracking-wide text-[10px] flex items-center gap-1 text-emerald-600">
              💡 Gợi ý thúc đẩy doanh số
            </h4>
            <p className="leading-relaxed">
              Tập trung chăm sóc Top 10 khách hàng chi tiêu cao nhất bằng các chương trình điểm tích lũy thành viên hoặc quà tặng đặc quyền để tối ưu hóa giá trị vòng đời khách hàng (LTV).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
