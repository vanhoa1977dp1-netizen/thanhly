import React from "react";
import {
  DollarSign,
  FileText,
  RotateCcw,
  TrendingUp,
  CreditCard,
  Shield
} from "lucide-react";
import { DatabaseSchema, Invoice, ReturnOrder } from "../types";

interface BaocaocuoingayProps {
  data: DatabaseSchema;
  filteredInvoicesForReports: Invoice[];
  filteredReturnsForReports: ReturnOrder[];
  rPeriodRevenue: number;
  rPeriodOrderCount: number;
  rPeriodReturnAmount: number;
  rPeriodNetRevenue: number;
  rCashRevenue: number;
  rBankRevenue: number;
}

export default function Baocaocuoingay({
  data,
  filteredInvoicesForReports,
  filteredReturnsForReports,
  rPeriodRevenue,
  rPeriodOrderCount,
  rPeriodReturnAmount,
  rPeriodNetRevenue,
  rCashRevenue,
  rBankRevenue
}: BaocaocuoingayProps) {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="bg-white p-5 rounded-xl border shadow-xs flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tổng doanh thu</span>
            <div className="text-xl font-black text-slate-800">{formatCurrency(rPeriodRevenue)}</div>
            <p className="text-[10px] text-gray-400 font-medium">Tổng giá trị tất cả hóa đơn bán ra</p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-500 rounded-xl">
            <DollarSign className="h-6 w-6" />
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-5 rounded-xl border shadow-xs flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Số hóa đơn</span>
            <div className="text-xl font-black text-slate-800">{rPeriodOrderCount} đơn hàng</div>
            <p className="text-[10px] text-gray-400 font-medium">Tổng giao dịch bán lẻ thành công</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-500 rounded-xl">
            <FileText className="h-6 w-6" />
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white p-5 rounded-xl border shadow-xs flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Khách trả hàng</span>
            <div className="text-xl font-black text-red-600">{formatCurrency(rPeriodReturnAmount)}</div>
            <p className="text-[10px] text-gray-400 font-medium">Giá trị hàng nhận trả từ khách</p>
          </div>
          <div className="p-3 bg-red-50 text-red-500 rounded-xl">
            <RotateCcw className="h-6 w-6" />
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white p-5 rounded-xl border shadow-xs flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Thực thu</span>
            <div className="text-xl font-black text-emerald-600">{formatCurrency(rPeriodNetRevenue)}</div>
            <p className="text-[10px] text-gray-400 font-medium">Doanh thu ròng sau khi trừ trả hàng</p>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-500 rounded-xl">
            <TrendingUp className="h-6 w-6" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left: Today's transactions list */}
        <div className="xl:col-span-2 bg-white rounded-xl border shadow-xs overflow-hidden">
          <div className="p-4 border-b bg-gray-50/50 flex justify-between items-center">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Danh sách giao dịch trong kỳ ({filteredInvoicesForReports.length})
            </h3>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
              Bán lẻ
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b text-gray-500 font-semibold bg-gray-50/30">
                  <th className="py-2.5 px-4">Mã hóa đơn</th>
                  <th className="py-2.5 px-4">Thời gian</th>
                  <th className="py-2.5 px-4">Khách hàng</th>
                  <th className="py-2.5 px-4">Hình thức</th>
                  <th className="py-2.5 px-4 text-right">Tổng cộng</th>
                </tr>
              </thead>
              <tbody className="divide-y text-gray-700">
                {filteredInvoicesForReports.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-400">
                      Không có giao dịch nào trong khoảng thời gian này.
                    </td>
                  </tr>
                ) : (
                  filteredInvoicesForReports.slice(0, 15).map((inv) => {
                    const cust = (data.Khach_hang || []).find((c) => c.id === inv.id_khach_hang);
                    return (
                      <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-2.5 px-4 font-mono font-bold text-blue-600">{inv.id}</td>
                        <td className="py-2.5 px-4">
                          {new Date(inv.ngay_lap).toLocaleTimeString("vi-VN")}{" "}
                          {new Date(inv.ngay_lap).toLocaleDateString("vi-VN")}
                        </td>
                        <td className="py-2.5 px-4 font-medium text-slate-800">
                          {cust ? cust.ho_ten : "Khách lẻ / Vãng lai"}
                        </td>
                        <td className="py-2.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                              inv.phuong_thuc_thanh_toan === "Tiền mặt"
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : "bg-blue-50 text-blue-700 border-blue-200"
                            }`}
                          >
                            {inv.phuong_thuc_thanh_toan}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-right font-bold text-slate-900">
                          {formatCurrency(inv.khach_can_tra)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Payment details card */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border shadow-xs p-4 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b pb-2 flex items-center gap-1.5">
              <CreditCard className="h-4 w-4 text-blue-500" />
              Tổng kết dòng tiền thực thu
            </h3>
            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                  Thu bằng Tiền mặt
                </span>
                <span className="font-bold text-slate-800">{formatCurrency(rCashRevenue)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                  Thu bằng Chuyển khoản
                </span>
                <span className="font-bold text-slate-800">{formatCurrency(rBankRevenue)}</span>
              </div>
              <div className="border-t pt-3 flex justify-between items-center text-sm font-bold">
                <span className="text-slate-800">Tổng thu trực tiếp</span>
                <span className="text-emerald-600">{formatCurrency(rPeriodRevenue)}</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 border rounded-xl p-4 text-xs text-slate-600 space-y-2">
            <h4 className="font-bold text-slate-700 uppercase tracking-wide text-[10px] flex items-center gap-1 text-emerald-600">
              <Shield className="h-3.5 w-3.5" />
              Đồng bộ két quỹ tiền
            </h4>
            <p className="leading-relaxed">
              Dữ liệu trên phản ánh toàn bộ các hóa đơn đã in và thanh toán thành công trong ngày.
              Bạn có thể sử dụng dữ liệu này để đối soát trực tiếp với tiền két tại quầy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
