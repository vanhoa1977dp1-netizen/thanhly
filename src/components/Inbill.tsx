import React, { useRef } from "react";
import { X, Printer, CheckCircle, MapPin, Phone, Globe, Sparkles, AlertCircle } from "lucide-react";
import { Invoice, ReturnOrder, ShopInfo, Product, Customer, Employee, BankAccount } from "../types";

// ==========================================
// UTILITIES FOR CURRENCY FORMATTING
// ==========================================
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("vi-VN").format(value);
};

const getCleanAmount = (value: number) => {
  return formatCurrency(value);
};

// ==========================================
// SHARED PRINT ACTION ENGINE
// ==========================================
const performPrint = (receiptRef: React.RefObject<HTMLDivElement | null>, title: string) => {
  const printContent = receiptRef.current?.innerHTML;
  if (!printContent) return;

  // Create temporary container for current window printing
  const printContainer = document.createElement("div");
  printContainer.id = "print-section-overlay";
  printContainer.innerHTML = printContent;
  document.body.appendChild(printContainer);

  // Inject temporary styles to override document only when printing
  const styleEl = document.createElement("style");
  styleEl.id = "print-section-styles";
  styleEl.innerHTML = `
    @media print {
      /* Hide everything except the print container */
      body > *:not(#print-section-overlay) {
        display: none !important;
      }
      html, body {
        background-color: #ffffff !important;
        background: #ffffff !important;
        margin: 0 !important;
        padding: 0 !important;
        width: 100% !important;
        height: auto !important;
      }
      #print-section-overlay {
        display: block !important;
        position: absolute;
        left: 0;
        top: 0;
        width: 100% !important;
        max-width: 100% !important;
        margin: 0 !important;
        padding: 0px 2px !important;
        box-shadow: none !important;
        background-color: #ffffff !important;
        background: #ffffff !important;
      }
      /* Ensure text styling is crisp, black, and contrasty for thermal printers */
      #print-section-overlay, #print-section-overlay * {
        color: #000000 !important;
        -webkit-text-fill-color: #000000 !important;
        border-color: #000000 !important;
        stroke: #000000 !important;
        opacity: 1 !important;
        filter: none !important;
        text-shadow: none !important;
        box-shadow: none !important;
        background-color: transparent !important;
        background: transparent !important;
        background-image: none !important;
      }
      @page {
        size: 80mm auto;
        margin: 1mm 2mm;
      }
    }
    @media screen {
      /* Hide the print container on screen completely */
      #print-section-overlay {
        display: none !important;
      }
    }
  `;
  document.head.appendChild(styleEl);

  // Trigger browser's native print dialog in the current window
  setTimeout(() => {
    window.print();
    
    // Clean up temporary DOM elements
    if (document.getElementById("print-section-overlay")) {
      document.body.removeChild(printContainer);
    }
    if (document.getElementById("print-section-styles")) {
      document.head.removeChild(styleEl);
    }
  }, 150);
};


// ==========================================
// 1. RECEIPT MODAL (SUCCESSFUL SALE RECEIPT)
// ==========================================
interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice;
  shopInfo: ShopInfo;
  products: Product[];
  customers: Customer[];
  employees: Employee[];
  bankAccounts: BankAccount[];
}

export function ReceiptModal({
  isOpen,
  onClose,
  invoice,
  shopInfo,
  products,
  customers,
  employees,
  bankAccounts,
}: ReceiptModalProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    performPrint(receiptRef, `Hóa đơn bán lẻ - ${invoice.id}`);
  };

  React.useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        handlePrint();
        onClose();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const customer = customers.find((c) => c.id === invoice.id_khach_hang);
  const employee = employees.find((e) => e.id === invoice.id_nhan_vien);

  const bank = bankAccounts && bankAccounts.length > 0 ? bankAccounts[0] : null;
  const vietQrUrl = bank
    ? `https://img.vietqr.io/image/${bank.ten_ngan_hang.toLowerCase()}-${bank.so_tai_khoan}-compact2.png?amount=${invoice.khach_can_tra}&addInfo=Thanh+toan+HD+${invoice.id}&accountName=${encodeURIComponent(bank.chu_tai_khoan)}`
    : null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="hidden">
        <div ref={receiptRef} className="printable-content">
          {/* Header */}
          <div className="text-center">
            <h1 className="font-bold text-3xl text-black">{shopInfo.ten_shop}</h1>
            <div className="text-xs text-slate-600">
              <p>{shopInfo.dia_chi}</p>
              <p>SĐT: {shopInfo.dien_thoai}</p>
            </div>
            
            <div className="border-t border-dashed border-gray-300"></div>
            
            <h2 className="font-bold text-sm text-black text-center">HÓA ĐƠN BÁN LẺ</h2>
            <p className="text-[10px] text-slate-500 text-center">Mã số: {invoice.id}</p>
            <p className="text-[10px] text-slate-500 text-center">Ngày lập: {new Date(invoice.ngay_lap).toLocaleString("vi-VN")}</p>
          </div>

          {/* Metadata */}
          <div className="text-slate-600 text-xs">
            <div className="flex justify-between">
              <span>Khách hàng:</span>
              <span className="font-bold text-black">{customer ? customer.ho_ten : "Khách lẻ"}</span>
            </div>
            {customer && customer.so_dien_thoai && (
              <div className="flex justify-between">
                <span>SĐT khách:</span>
                <span>{customer.so_dien_thoai}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Thu ngân:</span>
              <span>{employee ? employee.ho_ten : "Nhân viên hệ thống"}</span>
            </div>
            <div className="flex justify-between">
              <span>Hình thức:</span>
              <span>{invoice.phuong_thuc_thanh_toan}</span>
            </div>
          </div>

          {/* Items List */}
          <div className="space-y-1 my-1 text-[12px]">
            <div className="border-t border-b border-black font-bold py-0.5 flex justify-between items-center">
              <span className="text-left flex-1">Đơn giá</span>
              <span className="text-right w-16">SL</span>
              <span className="text-right w-24">Thành Tiền</span>
            </div>
            <div className="divide-y divide-dashed divide-slate-300">
              {invoice.chi_tiet_san_pham.map((item, index) => {
                const product = products.find(p => p.id === item.id_sp);
                const originalPrice = product ? product.gia_ban : item.don_gia;
                const actualPrice = item.don_gia;
                const isDiscounted = originalPrice > actualPrice;
                return (
                  <div key={index} className="py-0.5 text-left">
                    {/* Product Name */}
                    <div className="font-mono text-[14px] text-black break-words leading-tight">
                      {product ? product.ten_san_pham : "Sản phẩm đã xóa"}
                    </div>
                    
                    {/* Details */}
                    <div className="flex justify-between items-center text-[14px] mt-0.5 text-slate-700">
                      <div className="text-left flex-1 flex items-center gap-1 flex-wrap">
                        <span className="text-black font-mono">{getCleanAmount(actualPrice)}</span>
                        {isDiscounted ? (
                          <span className="line-through text-slate-400 font-mono">{getCleanAmount(originalPrice)}</span>
                        ) : null}
                      </div>
                      <div className="text-right w-16 text-black font-mono">
                        {item.so_luong}
                      </div>
                      <div className="text-right w-24 text-black font-mono">
                        {getCleanAmount(item.thanh_tien || (item.so_luong * item.don_gia))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="border-t border-dashed border-gray-300"></div>

          {/* Total Section */}
          <div className="total-section space-y-1 text-slate-700 text-sm font-medium pt-1">
            <div className="total-row flex font-bold justify-between pt-1 mt-1">
              <span>Tổng tiền hàng:</span>
              <span>{getCleanAmount(invoice.tong_tien_hang)}</span>
            </div>
            {invoice.giam_gia > 0 && (
              <div className="total-row flex justify-between">
                <span>Giảm giá:</span>
                <span>-{getCleanAmount(invoice.giam_gia)}</span>
              </div>
            )}
            {invoice.points_deducted !== undefined && invoice.points_deducted > 0 && (
              <div className="total-row flex justify-between text-indigo-700">
                <span>Trừ điểm:</span>
                <span>-{getCleanAmount(invoice.points_deducted * 500)}</span>
              </div>
            )}
            <div className="total-row grand-total flex justify-between text-black font-bold border-t border-dashed border-black pt-1">
              <span>KHÁCH CẦN TRẢ:</span>
              <span className="text-base">{formatCurrency(invoice.khach_can_tra)}</span>
            </div>
            <div className="total-row flex justify-between text-slate-600">
              <span>Khách đã trả:</span>
              <span>{formatCurrency(invoice.khach_da_tra)}</span>
            </div>
            {invoice.khach_da_tra - invoice.khach_can_tra > 0 ? (
              <div className="total-row flex justify-between text-emerald-600 font-bold">
                <span>Tiền thừa trả khách:</span>
                <span>{formatCurrency(invoice.khach_da_tra - invoice.khach_can_tra)}</span>
              </div>
            ) : invoice.khach_can_tra - invoice.khach_da_tra > 0 ? (
              <div className="total-row flex justify-between text-red-600 font-bold">
                <span>Tính vào công nợ:</span>
                <span>{formatCurrency(invoice.khach_can_tra - invoice.khach_da_tra)}</span>
              </div>
            ) : null}
          </div>

          {/* QR Code Section */}
          {invoice.phuong_thuc_thanh_toan === "Chuyển khoản" && vietQrUrl && (
            <div className="mt-4 p-2 border border-slate-200 rounded-md flex flex-col items-center justify-center text-center">
              <p className="text-[9px] font-medium text-slate-400 uppercase mb-1">Quét mã QR để chuyển khoản</p>
              <img src={vietQrUrl} alt="VietQR Payment Code" className="w-28 h-28 object-contain" referrerPolicy="no-referrer" />
              <div className="mt-1">
                <p className="text-[9px] font-bold text-slate-900">{bank?.ten_ngan_hang}</p>
                <p className="text-[9px] text-slate-500 font-mono">{bank?.so_tai_khoan} - {bank?.chu_tai_khoan}</p>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="footer text-[10px] text-slate-400 mt-4 text-center">
            <p>Cảm ơn quý khách đã mua sắm tại {shopInfo.ten_shop}!</p>
          </div>
        </div>
      </div>

      {/* Elegant printing status spinner */}
      <div className="flex flex-col items-center gap-3 text-white">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
        <p className="text-sm font-medium">Đang chuẩn bị trang in...</p>
      </div>
    </div>
  );
}


// ==========================================
// 2. RETURN RECEIPT MODAL (SUCCESSFUL RETURN RECEIPT)
// ==========================================
interface ReturnReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  returnOrder: ReturnOrder;
  shopInfo: ShopInfo;
  products: Product[];
  customers: Customer[];
  employees: Employee[];
}

export function ReturnReceiptModal({
  isOpen,
  onClose,
  returnOrder,
  shopInfo,
  products,
  customers,
  employees,
}: ReturnReceiptModalProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    performPrint(receiptRef, `Phiếu trả hàng - ${returnOrder.id}`);
  };

  React.useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        handlePrint();
        onClose();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const customer = customers.find(c => c.id === returnOrder.id_khach_hang);
  const employee = employees.find(e => e.id === returnOrder.id_nhan_vien_nhan);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="hidden">
        <div ref={receiptRef} className="printable-content">
          {/* Header */}
          <div className="text-center">
            <h1 className="font-bold text-3xl text-black">{shopInfo.ten_shop}</h1>
            <div className="text-xs text-slate-600">
              <p>{shopInfo.dia_chi}</p>
              <p>SĐT: {shopInfo.dien_thoai}</p>
            </div>
            
            <div className="border-t border-dashed border-gray-300"></div>
            
            <h2 className="font-bold text-sm text-black text-center">PHIẾU TRẢ HÀNG</h2>
            <p className="text-[10px] text-slate-500 text-center">Mã số: {returnOrder.id}</p>
            <p className="text-[10px] text-slate-500 text-center">Hóa đơn gốc: {returnOrder.id_hoa_don_goc || "Không có"}</p>
            <p className="text-[10px] text-slate-500 text-center">Ngày lập: {new Date(returnOrder.ngay_tra).toLocaleString("vi-VN")}</p>
          </div>

          {/* Metadata */}
          <div className="text-slate-600 text-xs">
            <div className="flex justify-between">
              <span>Khách hàng:</span>
              <span className="font-bold text-black">{customer ? customer.ho_ten : "Khách lẻ"}</span>
            </div>
            {customer?.so_dien_thoai && (
              <div className="flex justify-between">
                <span>SĐT khách:</span>
                <span>{customer.so_dien_thoai}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Nhân viên nhận:</span>
              <span>{employee ? employee.ho_ten : "Nhân viên hệ thống"}</span>
            </div>
            <div className="flex justify-between">
              <span>Hình thức hoàn:</span>
              <span>{returnOrder.hinh_thuc_hoan_tien}</span>
            </div>
            {returnOrder.ly_do_tra && (
              <div className="flex justify-between">
                <span>Lý do trả:</span>
                <span className="text-right max-w-[150px] truncate">{returnOrder.ly_do_tra}</span>
              </div>
            )}
          </div>

          <div className="border-t border-dashed border-gray-300"></div>

          {/* Items List */}
          <div className="space-y-1 my-1 text-[12px]">
            <div className="border-t border-b border-black font-bold py-0.5 flex justify-between items-center">
              <span className="text-left flex-1">Giá trả</span>
              <span className="text-right w-16">SL</span>
              <span className="text-right w-24">Thành tiền</span>
            </div>
            <div className="divide-y divide-dashed divide-slate-300">
              {returnOrder.chi_tiet_tra_hang.map((item, idx) => {
                const prod = products.find(p => p.id === (item.id_sp || (item as any).id_san_pham));
                return (
                  <div key={idx} className="py-0.5 text-left">
                    {/* Product Name */}
                    <div className="text-black text-[14px] break-words leading-tight">
                      {prod ? prod.ten_san_pham : "Sản phẩm đã xóa"}
                    </div>
                    
                    {/* Details */}
                    <div className="flex justify-between items-center text-[14px] mt-0.5 text-slate-700">
                      <div className="text-left flex-1 text-black font-mono">
                        {getCleanAmount(item.gia_tra)}
                      </div>
                      <div className="text-right w-16 text-black font-mono">
                        {item.so_luong}
                      </div>
                      <div className="text-right w-24 text-black font-mono">
                        {getCleanAmount(item.thanh_tien)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="border-t border-dashed border-gray-300"></div>

          {/* Totals */}
          <div className="total-section space-y-1 text-slate-700 text-sm font-medium pt-1">
            <div className="total-row grand-total flex justify-between text-black font-bold border-t border-dashed border-black pt-1">
              <span className="text-sm">TỔNG TIỀN HOÀN TRẢ:</span>
              <span className="text-rose-600">{formatCurrency(returnOrder.tong_tien_tra)}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="footer text-[10px] text-slate-400 mt-4 text-center">
            <p>Cảm ơn quý khách đã mua sắm tại {shopInfo.ten_shop}!</p>
          </div>
        </div>
      </div>

      {/* Elegant printing status spinner */}
      <div className="flex flex-col items-center gap-3 text-white">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
        <p className="text-sm font-medium">Đang chuẩn bị trang in...</p>
      </div>
    </div>
  );
}


// ==========================================
// 3. DRAFT RECEIPT MODAL (TEMPORARY DRAFT BILL)
// ==========================================
interface DraftReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: any[];
  discountAmount: number;
  pointsDeduction: number;
  usePoints: boolean;
  paymentMethod: string;
  selectedCustomer: Customer | null;
  shopInfo: ShopInfo;
  employeeName: string;
  bankAccounts: BankAccount[];
  isReturn?: boolean;
  returnItems?: any[];
  totalReturn?: number;
  paidAmount?: number;
}

export function DraftReceiptModal({
  isOpen,
  onClose,
  items,
  discountAmount,
  pointsDeduction,
  usePoints,
  paymentMethod,
  selectedCustomer,
  shopInfo,
  employeeName,
  bankAccounts,
  isReturn = false,
  returnItems = [],
  totalReturn = 0,
  paidAmount = 0
}: DraftReceiptModalProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    performPrint(receiptRef, "In Hóa Đơn Nháp - Tạm Tính");
  };

  React.useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        handlePrint();
        onClose();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Calculations
  const getItemSellingPrice = (item: any) => {
    if (item.discountType === "%") {
      return item.product.gia_ban * (1 - item.discount / 100);
    }
    return Math.max(0, item.product.gia_ban - (item.discount || 0));
  };

  const totalBillCost = items.reduce((sum, item) => sum + getItemSellingPrice(item) * item.quantity, 0);
  const totalReturnCost = isReturn ? returnItems.reduce((sum, item) => sum + (item.gia_tra * item.quantity), 0) : 0;
  
  const netBalance = isReturn
    ? (totalBillCost - discountAmount - (usePoints ? pointsDeduction : 0)) - totalReturnCost
    : totalBillCost - discountAmount - (usePoints ? pointsDeduction : 0);

  const netDue = Math.max(0, netBalance);

  // Active bank account
  const bank = bankAccounts && bankAccounts.length > 0 ? bankAccounts[0] : null;

  // VietQR URL for Draft invoice payment (previewing dynamic QR code)
  const vietQrUrl = bank && netDue > 0
    ? `https://img.vietqr.io/image/${bank.ten_ngan_hang.toLowerCase()}-${bank.so_tai_khoan}-compact2.png?amount=${netDue}&addInfo=Tam+tinh+HD+NHAP&accountName=${encodeURIComponent(bank.chu_tai_khoan)}`
    : null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="hidden">
        <div ref={receiptRef} className="printable-content">
          {/* Receipt Header */}
          <div className="text-center">
            <h1 className="font-bold text-3xl text-black">{shopInfo.ten_shop}</h1>
            <div className="text-xs text-slate-600">
              <p>{shopInfo.dia_chi}</p>
              <p>SĐT: {shopInfo.dien_thoai}</p>
            </div>
            
            <div className="border-t border-dashed border-gray-300"></div>
            
            <h2 className="font-bold text-sm text-black text-center">HÓA ĐƠN TẠM TÍNH</h2>
            <p className="text-center text-[10px] text-slate-500">(DÙNG THỬ - CHƯA THANH TOÁN)</p>
            <p className="text-[10px] text-slate-500 text-center">{new Date().toLocaleString("vi-VN")}</p>
          </div>

          {/* Metadata */}
          <div className="text-slate-600 text-xs">
            <div className="flex justify-between">
              <span>Khách hàng:</span>
              <span className="font-bold text-black">{selectedCustomer ? selectedCustomer.ho_ten : "Khách lẻ"}</span>
            </div>
            {selectedCustomer?.so_dien_thoai && (
              <div className="flex justify-between">
                <span>SĐT khách:</span>
                <span>{selectedCustomer.so_dien_thoai}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Thu ngân:</span>
              <span>{employeeName || "Nhân viên hệ thống"}</span>
            </div>
            <div className="flex justify-between">
              <span>Hình thức:</span>
              <span>{paymentMethod}</span>
            </div>
          </div>


          {/* Table of items */}
          {isReturn && returnItems.length > 0 && (
            <>
              <p className="font-bold text-black border-b border-black pb-0.5 text-xs uppercase mb-1">HÀNG TRẢ LẠI</p>
              <div className="space-y-1 my-1 text-[11px]">
                <div className="border-t border-b border-black font-bold py-0.5 flex justify-between items-center">
                  <span className="text-left flex-1">Giá trả</span>
                  <span className="text-right w-16">SL</span>
                  <span className="text-right w-24">Thành tiền</span>
                </div>
                <div className="divide-y divide-dashed divide-slate-300">
                  {returnItems.map((item, idx) => (
                    <div key={idx} className="py-0.5 text-left">
                      <div className="font-bold text-[14px] text-black break-words leading-tight">
                        {item.product.ten_san_pham}
                      </div>
                      
                      <div className="flex justify-between items-center text-[13px] mt-0.5 text-slate-700">
                        <div className="text-left flex-1 text-black font-mono">
                          {getCleanAmount(item.gia_tra)}
                        </div>
                        <div className="text-right w-16 text-black font-mono">
                          {item.quantity}
                        </div>
                        <div className="font-bold text-black font-mono text-right w-24">
                          {getCleanAmount(item.gia_tra * item.quantity)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {(!isReturn || items.length > 0) && (
            <>
              {isReturn && <p className="font-bold text-black border-b border-black pb-0.5 text-xs uppercase mb-0.5 mt-1">HÀNG MUA MỚI</p>}
              <div className="space-y-1 my-1 text-[12px]">
                <div className="border-t border-b border-black font-bold py-0.5 flex justify-between items-center">
                  <span className="text-left flex-1">Đơn giá</span>
                  <span className="text-right w-16">SL</span>
                  <span className="text-right w-24">Thành Tiền</span>
                </div>
                
                <div className="divide-y divide-dashed divide-slate-300">
                  {items.map((item, idx) => {
                    const isDuplicateRow = items.slice(0, idx).some(x => x.product.id === item.product.id);
                    const originalPrice = item.product.gia_ban;
                    const actualPrice = getItemSellingPrice(item);
                    const isDiscounted = originalPrice > actualPrice;
                    return (
                      <div key={idx} className="py-0.5 text-[14px] text-left">
                        {isDuplicateRow ? (
                          <span className="text-slate-500 italic"></span>
                        ) : (
                          <div className="font-mono text-black break-words leading-tight">{item.product.ten_san_pham}</div>
                        )}
                        
                        <div className="flex justify-between items-center text-[13px] mt-0.5 text-slate-700">
                          <div className="text-left flex-1 flex items-center gap-1 flex-wrap">
                            <span className="text-black font-mono">{getCleanAmount(actualPrice)}</span>
                            {isDiscounted ? (
                              <span className="line-through text-slate-400 font-mono">{getCleanAmount(originalPrice)}</span>
                            ) : null}
                          </div>
                          <div className="text-right w-16 text-black font-mono">
                            {item.quantity}
                          </div>
                          <div className="text-right w-24 text-black font-mono">
                            {getCleanAmount(actualPrice * item.quantity)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          <div className="border-t border-dashed border-gray-300"></div>

          {/* Summary details */}
          <div className="total-section space-y-1 text-slate-700 text-sm font-medium pt-1">
            {isReturn ? (
              <div>
                {items.length > 0 && (
                  <div className="total-row flex justify-between font-bold">
                    <span>Tổng tiền mua mới:</span>
                    <span>{getCleanAmount(totalBillCost)}</span>
                  </div>
                )}
                {returnItems.length > 0 && (
                  <div className="total-row flex justify-between font-bold text-rose-600">
                    <span>Tổng tiền trả hàng:</span>
                    <span>-{getCleanAmount(totalReturnCost)}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="total-row flex justify-between font-bold">
                <span>Tổng cộng hàng:</span>
                <span>{getCleanAmount(totalBillCost)}</span>
              </div>
            )}
            
            {discountAmount > 0 && (
              <div className="total-row flex justify-between">
                <span>Giảm giá:</span>
                <span>-{getCleanAmount(discountAmount)}</span>
              </div>
            )}

            {usePoints && pointsDeduction > 0 && (
              <div className="total-row flex justify-between text-indigo-700">
                <span>Trừ điểm</span>
                <span>-{getCleanAmount(pointsDeduction)}</span>
              </div>
            )}

            {isReturn ? (
              netBalance > 0 ? (
                <>
                  <div className="total-row grand-total flex justify-between text-black font-bold border-t border-dashed border-black pt-1">
                    <span>Kkhách cần trả thêm:</span>
                    <span className="text-blue-600">{formatCurrency(netBalance)}</span>
                  </div>
                  <div className="total-row flex justify-between text-slate-600">
                    <span>Khách đã trả:</span>
                    <span>{formatCurrency(paidAmount)}</span>
                  </div>
                  {paidAmount > netBalance ? (
                    <div className="total-row flex justify-between text-emerald-600 font-bold">
                      <span>Tiền thừa trả khách:</span>
                      <span>{formatCurrency(paidAmount - netBalance)}</span>
                    </div>
                  ) : paidAmount < netBalance ? (
                    <div className="total-row flex justify-between text-red-600 font-bold">
                      <span>Tính vào công nợ:</span>
                      <span>{formatCurrency(netBalance - paidAmount)}</span>
                    </div>
                  ) : null}
                </>
              ) : netBalance < 0 ? (
                <div className="total-row grand-total flex justify-between text-black font-bold border-t border-dashed border-black pt-1">
                  <span>Tiền thối lại khách:</span>
                  <span className="text-rose-600">{formatCurrency(Math.abs(netBalance))}</span>
                </div>
              ) : (
                <div className="total-row grand-total flex justify-between text-black font-bold border-t border-dashed border-black pt-1">
                  <span className="text-sm">Tổng cần trả (Đã đối trừ):</span>
                  <span className="text-emerald-600">0</span>
                </div>
              )
            ) : (
              <>
                <div className="total-row grand-total flex justify-between text-black font-bold border-t border-dashed border-black pt-1">
                  <span>TỔNG CẦN TRẢ:</span>
                  <span className="text-base">{formatCurrency(netDue)}</span>
                </div>
                <div className="total-row flex justify-between text-slate-600">
                  <span>Khách đã trả:</span>
                  <span>{formatCurrency(paidAmount)}</span>
                </div>
                {paidAmount > netDue ? (
                  <div className="total-row flex justify-between text-emerald-600 font-bold">
                    <span>Tiền thừa trả khách:</span>
                    <span>{formatCurrency(paidAmount - netDue)}</span>
                  </div>
                ) : paidAmount < netDue ? (
                  <div className="total-row flex justify-between text-red-600 font-bold">
                    <span>Tính vào công nợ:</span>
                    <span>{formatCurrency(netDue - paidAmount)}</span>
                  </div>
                ) : null}
              </>
            )}
          </div>

          {/* Draft scan code preview */}
          {paymentMethod === "Chuyển khoản" && vietQrUrl && (
            <div className="mt-4 p-2 border border-slate-200 rounded-md flex flex-col items-center justify-center text-center">
              <p className="text-[9px] font-medium text-slate-400 uppercase mb-1">Mã QR Thanh Toán Nháp</p>
              <img src={vietQrUrl} alt="VietQR draft payment link" className="w-28 h-28 object-contain" referrerPolicy="no-referrer" />
              <p className="text-[9px] text-slate-500 mt-1">{bank?.ten_ngan_hang} - {bank?.so_tai_khoan}</p>
            </div>
          )}

          {/* Footer */}
          <div className="footer text-[10px] text-slate-400 mt-4 text-center">
            <p>Cảm ơn quý khách đã mua sắm tại {shopInfo.ten_shop}!</p>
          </div>
        </div>
      </div>

      {/* Elegant printing status spinner */}
      <div className="flex flex-col items-center gap-3 text-white">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
        <p className="text-sm font-medium">Đang chuẩn bị trang in...</p>
      </div>
    </div>
  );
}

// Fallback legacy default export just in case
export default ReceiptModal;
