import React from "react";
import { AlertTriangle } from "lucide-react";
import { DatabaseSchema } from "../types";

interface BaocaohanghoaProps {
  data: DatabaseSchema;
  rTopProducts: any[];
}

export default function Baocaohanghoa({ data, rTopProducts }: BaocaohanghoaProps) {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val);
  };

  const totalSKUs = (data.San_pham || []).length;
  const totalStockQty = (data.San_pham || []).reduce((sum, p) => sum + p.ton_kho, 0);
  const totalStockCostValuation = (data.San_pham || []).reduce((sum, p) => sum + p.ton_kho * p.gia_von, 0);
  const totalStockSaleValuation = (data.San_pham || []).reduce((sum, p) => sum + p.ton_kho * p.gia_ban, 0);
  const lowStockProducts = (data.San_pham || []).filter((p) => p.ton_kho <= 5);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Tổng mặt hàng</span>
          <div className="text-2xl font-black text-slate-800 mt-1">{totalSKUs} mặt hàng</div>
          <p className="text-[10px] text-gray-400 mt-1">Số lượng SKU sản phẩm trong danh mục</p>
        </div>

        <div className="bg-white p-5 rounded-xl border shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Tổng tồn kho</span>
          <div className="text-2xl font-black text-slate-800 mt-1">{totalStockQty} sản phẩm</div>
          <p className="text-[10px] text-gray-400 mt-1">Tổng số lượng hàng hóa đang lưu kho</p>
        </div>

        <div className="bg-white p-5 rounded-xl border shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Tổng vốn tồn kho</span>
          <div className="text-2xl font-black text-blue-600 mt-1">{formatCurrency(totalStockCostValuation)}</div>
          <p className="text-[10px] text-gray-400 mt-1">Tính theo: Số lượng tồn kho × Giá vốn</p>
        </div>

        <div className="bg-white p-5 rounded-xl border shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Giá trị hàng niêm yết</span>
          <div className="text-2xl font-black text-emerald-600 mt-1">{formatCurrency(totalStockSaleValuation)}</div>
          <p className="text-[10px] text-gray-400 mt-1">Tính theo: Số lượng tồn kho × Giá bán</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left: Top selling products */}
        <div className="xl:col-span-2 bg-white rounded-xl border shadow-xs overflow-hidden">
          <div className="p-4 border-b bg-gray-50/50 flex justify-between items-center">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-bold">
              Sản phẩm bán chạy nhất
            </h3>
            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">
              Kỳ báo cáo
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b text-gray-500 font-semibold bg-gray-50/30">
                  <th className="py-2.5 px-4">Mã sản phẩm</th>
                  <th className="py-2.5 px-4">Tên sản phẩm</th>
                  <th className="py-2.5 px-4 text-center">Số lượng bán</th>
                  <th className="py-2.5 px-4 text-right">Doanh số thu về</th>
                </tr>
              </thead>
              <tbody className="divide-y text-gray-700">
                {rTopProducts.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-gray-400 font-medium">
                      Không có dữ liệu hàng hóa bán ra trong kỳ.
                    </td>
                  </tr>
                ) : (
                  rTopProducts.slice(0, 10).map((prod) => (
                    <tr key={prod.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-2.5 px-4 font-mono font-bold text-slate-600">{prod.id}</td>
                      <td className="py-2.5 px-4 font-medium text-slate-800">{prod.name}</td>
                      <td className="py-2.5 px-4 text-center font-bold text-slate-900">{prod.qty}</td>
                      <td className="py-2.5 px-4 text-right font-bold text-emerald-600">
                        {formatCurrency(prod.revenue)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Low Stock Alert List */}
        <div className="bg-white rounded-xl border shadow-xs p-4 space-y-4">
          <div className="border-b pb-2 flex justify-between items-center">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 font-bold">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Sản phẩm sắp hết hàng ({lowStockProducts.length})
            </h3>
          </div>
          <div className="space-y-3.5 max-h-[350px] overflow-y-auto pr-1">
            {lowStockProducts.length === 0 ? (
              <p className="text-center text-gray-400 text-xs py-4 font-medium">Tất cả hàng hóa đều đủ tồn kho.</p>
            ) : (
              lowStockProducts.map((p) => (
                <div
                  key={p.id}
                  className="flex justify-between items-center text-xs p-2 rounded bg-slate-50 border hover:bg-slate-100/70 transition-all"
                >
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-700 block max-w-[150px] truncate" title={p.ten_san_pham}>
                      {p.ten_san_pham}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 font-medium">Mã: {p.id}</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                      p.ton_kho === 0
                        ? "bg-red-50 text-red-600 border border-red-200"
                        : "bg-amber-50 text-amber-600 border border-amber-200"
                    }`}
                  >
                    Tồn: {p.ton_kho}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
