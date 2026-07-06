import { DatabaseSchema, Invoice, Product, Customer, Supplier, Employee, ImportOrder, ReturnOrder, ReturnSupplierOrder, ProductCategory, Brand, BankAccount } from "./types";

// Seed Data
const seedShopInfo = {
  ten_shop: "Thanh Ly Shop",
  dia_chi: "620 Nguyễn Nghiêm - Đức Phổ - Quảng Ngãi",
  dien_thoai: "0918005269",
  email: "contact@techshop.com",
  website: "https://techshop.netlify.app",
  slogan: "Chất lượng tạo niềm tin",
  doanh_thu_doi_diem: 100000,
  gia_tri_1_diem: 1000
};

const seedBankAccounts: BankAccount[] = [
  {
    id: "NH001",
    ten_ngan_hang: "Vietcombank",
    so_tai_khoan: "10123456789",
    chu_tai_khoan: "NGUYEN VAN A",
    chi_nhanh: "Chi nhánh Sài Gòn"
  }
];

const seedCategories: ProductCategory[] = [
  {
    id: "DM001",
    ten_nhom: "Điện thoại & Máy tính bảng",
    mo_ta: "Các sản phẩm di động thông minh"
  },
  {
    id: "DM002",
    ten_nhom: "Phụ kiện công nghệ",
    mo_ta: "Cáp, sạc, tai nghe, bao da"
  }
];

const seedBrands: Brand[] = [
  {
    id: "TH001",
    ten_thuong_hieu: "Apple",
    quoc_gia: "Mỹ"
  },
  {
    id: "TH002",
    ten_thuong_hieu: "Anker",
    quoc_gia: "Trung Quốc"
  }
];

const seedEmployees: Employee[] = [
  {
    id: "NV001",
    ho_ten: "Nguyễn Văn Admin",
    chuc_vu: "Quản lý hệ thống",
    so_dien_thoai: "0911222333",
    email: "admin@techshop.com",
    tai_khoan: "admin",
    quyen_han: "ADMIN",
    trang_thai: "Đang hoạt động"
  },
  {
    id: "NV002",
    ho_ten: "Trần Thị Thu ngân",
    chuc_vu: "Nhân viên bán hàng",
    so_dien_thoai: "0922333444",
    email: "thungan1@techshop.com",
    tai_khoan: "thungan1",
    quyen_han: "STAFF",
    trang_thai: "Đang hoạt động"
  }
];

const seedCustomers: Customer[] = [
  {
    id: "KH000001",
    ho_ten: "Lê Minh Hoàng",
    so_dien_thoai: "0933444555",
    email: "hoang.le@gmail.com",
    dia_chi: "456 Lê Hồng Phong, Quận 5, TP. HCM",
    loai_khach: "Thành viên",
    diem_tich_luy: 120,
    tong_chi_tieu: 15500000,
    cong_no: 500000
  }
];

const seedSuppliers: Supplier[] = [
  {
    id: "NCC00001",
    ten_nha_cung_cap: "Công ty TNHH Phân Phối Digiworld",
    nguoi_lien_he: "Anh Bùi Nguyễn",
    so_dien_thoai: "02873088888",
    email: "contact@dgw.com.vn",
    dia_chi: "195-197 Cao Thắng, Quận 3, TP. HCM",
    cong_no_hien_tai: 45000000
  }
];

const seedProducts: Product[] = [
  {
    id: "SP000001",
    ten_san_pham: "iPhone 15 Pro Max 256GB",
    id_nhom_hang: "DM001",
    id_thuong_hieu: "TH001",
    gia_von: 26000000,
    gia_ban: 29990000,
    ton_kho: 15,
    don_vi_tinh: "Cái",
    bar_code: "8931234567890",
    trang_thai: "Đang kinh doanh",
    tich_diem: true,
    ban_truc_tiep: true,
    ngay_tao: "2026-06-20T10:00:00Z"
  },
  {
    id: "SP000002",
    ten_san_pham: "Sạc Nhanh Anker Nano 20W",
    id_nhom_hang: "DM002",
    id_thuong_hieu: "TH002",
    gia_von: 210000,
    gia_ban: 350000,
    ton_kho: 120,
    don_vi_tinh: "Cái",
    bar_code: "8931234567891",
    trang_thai: "Đang kinh doanh",
    tich_diem: true,
    ban_truc_tiep: true,
    ngay_tao: "2026-06-20T10:00:00Z"
  }
];

const seedInvoices: Invoice[] = [
  {
    id: "HD000001",
    ngay_lap: "2026-06-25T14:30:00Z",
    id_khach_hang: "KH000001",
    id_nhan_vien: "NV002",
    chi_tiet_san_pham: [
      {
        id_sp: "SP000002",
        so_luong: 2,
        don_gia: 350000,
        thanh_tien: 700000
      }
    ],
    tong_tien_hang: 700000,
    giam_gia: 50000,
    khach_can_tra: 650000,
    khach_da_tra: 650000,
    phuong_thuc_thanh_toan: "Tiền mặt",
    trang_thai: "Đã hoàn thành"
  }
];

const seedReturns: ReturnOrder[] = [
  {
    id: "THD00001",
    id_hoa_don_goc: "HD000001",
    ngay_tra: "2026-06-26T09:15:00Z",
    id_khach_hang: "KH000001",
    chi_tiet_tra_hang: [
      {
        id_sp: "SP000002",
        so_luong: 1,
        gia_tra: 350000,
        thanh_tien: 350000
      }
    ],
    tong_tien_tra: 350000,
    ly_do_tra: "Khách đổi ý, muốn nâng cấp củ sạc lớn hơn",
    hinh_thuc_hoan_tien: "Chuyển khoản",
    id_nhan_vien_nhan: "NV002"
  }
];

const seedImports: ImportOrder[] = [
  {
    id: "PN000001",
    ngay_nhap: "2026-06-20T10:00:00Z",
    id_nha_cung_cap: "NCC00001",
    id_nhan_vien: "NV001",
    chi_tiet_nhap: [
      {
        id_sp: "SP000001",
        so_luong: 10,
        gian_nhap: 26000000,
        thanh_tien: 260000000
      }
    ],
    tong_tien_nhap: 260000000,
    da_thanh_toan: 200000000,
    con_no: 60000000,
    trang_thai: "Đã nhận hàng"
  }
];

const seedReturnSuppliers: ReturnSupplierOrder[] = [
  {
    id: "THNCC001",
    id_phieu_nhap_goc: "PN000001",
    id_nha_cung_cap: "NCC00001",
    ngay_tra: "2026-06-22T16:00:00Z",
    id_nhan_vien_thuc_hien: "NV001",
    chi_tiet_tra: [
      {
        id_sp: "SP000001",
        so_luong: 1,
        gia_tra_lai: 26000000,
        thanh_tien: 26000000
      }
    ],
    tong_tien_ncc_hoan: 26000000,
    tinh_trang_hoan_tien: "Đã trừ vào công nợ",
    ly_do_tra: "Sản phẩm móp hộp do vận chuyển"
  }
];

const seedOverview = {
  doanh_thu_thang_nay: 650000,
  so_don_hang_thang_nay: 1,
  tong_so_khach_hang: seedCustomers.length,
  tong_so_san_pham_he_thong: seedProducts.length,
  gia_tri_ton_kho_hien_tai: seedProducts.reduce((sum, p) => sum + p.ton_kho * p.gia_von, 0),
  cap_nhat_cuoi_cung: new Date().toISOString()
};

const LOCAL_STORAGE_KEY = "thanh_ly_shop_db";

function getLocalDb(): DatabaseSchema {
  const data = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (data) {
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error("Failed to parse local DB, resetting to seed...", e);
    }
  }

  const initialDb: DatabaseSchema = {
    Thong_tin_shop: seedShopInfo,
    Ngan_hang: seedBankAccounts,
    Nhom_hang: seedCategories,
    Thuong_hieu: seedBrands,
    Nhan_vien: seedEmployees,
    Khach_hang: seedCustomers,
    Nha_cung_cap: seedSuppliers,
    San_pham: seedProducts,
    Hoa_don: seedInvoices,
    Tra_hang: seedReturns,
    Nhap_hang: seedImports,
    Tra_hang_NCC: seedReturnSuppliers,
    Tong_quan: seedOverview
  };

  saveLocalDb(initialDb);
  return initialDb;
}

function saveLocalDb(db: DatabaseSchema) {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(db));
}

function recalculateStats(db: DatabaseSchema) {
  const products = db.San_pham || [];
  const invoices = db.Hoa_don || [];
  const customers = db.Khach_hang || [];

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthlyInvoices = invoices.filter(inv => {
    const date = new Date(inv.ngay_lap);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });

  const revenue = monthlyInvoices.reduce((sum, inv) => sum + (inv.khach_can_tra || 0), 0);
  const totalStockVal = products.reduce((sum, p) => sum + (p.ton_kho || 0) * (p.gia_von || 0), 0);

  db.Tong_quan = {
    doanh_thu_thang_nay: revenue,
    so_don_hang_thang_nay: monthlyInvoices.length,
    tong_so_khach_hang: customers.length,
    tong_so_san_pham_he_thong: products.length,
    gia_tri_ton_kho_hien_tai: totalStockVal,
    cap_nhat_cuoi_cung: new Date().toISOString()
  };
}

// Intercept window.fetch globally
export function initMockApi() {
  const originalFetch = window.fetch.bind(window);

  const newFetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

    // Check if it's an API route. If not, bypass to real fetch
    if (!url.includes("/api/")) {
      return originalFetch(input, init);
    }

    const isGitHubPages = window.location.hostname.includes("github.io");
    let useMock = isGitHubPages;

    if (!useMock) {
      // Do a quick test fetch with timeout to see if the express backend is running
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1200);
        // Only fetch /api/health or test endpoint to check server liveness
        const testRes = await originalFetch("/api/data", { method: "GET", signal: controller.signal });
        clearTimeout(timeoutId);
        
        // If server returned valid response, use real server
        if (testRes.ok) {
          const contentType = testRes.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            return testRes;
          }
        }
      } catch (e) {
        useMock = true;
      }
    }

    if (useMock) {
      try {
        const resData = await handleMockRoute(url, init);
        return new Response(JSON.stringify(resData), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      } catch (err: any) {
        console.error("Mock API Error:", err);
        return new Response(JSON.stringify({ success: false, message: err?.message || "Internal Mock Error" }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }
    }

    return originalFetch(input, init);
  };

  try {
    Object.defineProperty(window, "fetch", {
      value: newFetch,
      configurable: true,
      writable: true,
      enumerable: true
    });
  } catch (e) {
    console.warn("Could not redefine window.fetch with Object.defineProperty, trying direct assignment:", e);
    try {
      (window as any).fetch = newFetch;
    } catch (err) {
      console.error("Failed to mock window.fetch:", err);
    }
  }
}

async function handleMockRoute(url: string, init?: RequestInit): Promise<any> {
  const pathPart = url.split("/api/")[1] || "";
  const cleanPath = pathPart.split("?")[0];
  const method = init?.method || "GET";

  const db = getLocalDb();

  // Helper to parse JSON body
  const getBody = () => {
    if (!init?.body) return {};
    try {
      if (typeof init.body === "string") {
        return JSON.parse(init.body);
      }
    } catch (e) {}
    return {};
  };

  if (cleanPath === "data") {
    if (method === "GET") {
      return db;
    } else if (method === "POST") {
      const newDb = getBody();
      if (newDb && typeof newDb === "object") {
        saveLocalDb(newDb);
        return { success: true, message: "Đồng bộ dữ liệu thành công!" };
      }
      throw new Error("Invalid payload");
    }
  }

  if (cleanPath === "sale" && method === "POST") {
    const invoiceData = getBody();
    const invoices = db.Hoa_don || [];
    const lastId = invoices.reduce((max, inv) => {
      const num = parseInt(inv.id.replace("HD", ""), 10);
      return isNaN(num) ? max : (num > max ? num : max);
    }, 0);
    const newId = `HD${String(lastId + 1).padStart(6, "0")}`;

    const newInvoice: Invoice = {
      id: newId,
      ngay_lap: invoiceData.ngay_lap || new Date().toISOString(),
      id_khach_hang: invoiceData.id_khach_hang || "KH000001",
      id_nhan_vien: invoiceData.id_nhan_vien || "NV001",
      chi_tiet_san_pham: invoiceData.chi_tiet_san_pham || [],
      tong_tien_hang: invoiceData.tong_tien_hang || 0,
      giam_gia: invoiceData.giam_gia || 0,
      khach_can_tra: invoiceData.khach_can_tra || 0,
      khach_da_tra: invoiceData.khach_da_tra || 0,
      phuong_thuc_thanh_toan: invoiceData.phuong_thuc_thanh_toan || "Tiền mặt",
      points_deducted: invoiceData.points_deducted || 0,
      trang_thai: "Đã hoàn thành"
    };

    // stock logic
    newInvoice.chi_tiet_san_pham.forEach((detail) => {
      const prod = db.San_pham.find(p => p.id === detail.id_sp);
      if (prod) {
        prod.ton_kho = Math.max(0, prod.ton_kho - detail.so_luong);
      }
    });

    // loyalty point + spent stats
    const customer = db.Khach_hang.find(c => c.id === newInvoice.id_khach_hang);
    if (customer) {
      if (newInvoice.points_deducted && newInvoice.points_deducted > 0) {
        customer.diem_tich_luy = Math.max(0, customer.diem_tich_luy - Number(newInvoice.points_deducted));
      }
      customer.tong_chi_tieu += newInvoice.khach_can_tra;
      const rate = Number(db.Thong_tin_shop.doanh_thu_doi_diem) || 100000;
      customer.diem_tich_luy += Math.floor(newInvoice.khach_can_tra / rate);

      const unpaid = newInvoice.khach_can_tra - newInvoice.khach_da_tra;
      if (unpaid > 0) {
        customer.cong_no = (customer.cong_no || 0) + unpaid;
      }
    }

    db.Hoa_don.push(newInvoice);
    recalculateStats(db);
    saveLocalDb(db);
    return { success: true, data: newInvoice, message: "Thanh toán thành công!" };
  }

  if (cleanPath === "products" && method === "POST") {
    const product = getBody();
    let isNew = false;
    if (!product.id) {
      isNew = true;
      const lastId = db.San_pham.reduce((max, p) => {
        const num = parseInt(p.id.replace("SP", ""), 10);
        return isNaN(num) ? max : (num > max ? num : max);
      }, 0);
      product.id = `SP${String(lastId + 1).padStart(6, "0")}`;
    } else {
      const existing = db.San_pham.findIndex(p => p.id === product.id);
      if (existing === -1) isNew = true;
    }

    if (isNew) {
      product.ngay_tao = product.ngay_tao || new Date().toISOString();
      product.tich_diem = product.tich_diem !== undefined ? product.tich_diem : true;
      product.ban_truc_tiep = product.ban_truc_tiep !== undefined ? product.ban_truc_tiep : true;
      product.trang_thai = product.trang_thai || "Đang kinh doanh";
      if (!product.bar_code) {
        product.bar_code = product.id;
      }
      db.San_pham.push(product);
    } else {
      const idx = db.San_pham.findIndex(p => p.id === product.id);
      db.San_pham[idx] = { ...db.San_pham[idx], ...product };
    }

    recalculateStats(db);
    saveLocalDb(db);
    return { success: true, data: product };
  }

  if (cleanPath === "customers" && method === "POST") {
    const customer = getBody();
    let isNew = false;
    if (!customer.id) {
      isNew = true;
      const lastId = db.Khach_hang.reduce((max, c) => {
        const num = parseInt(c.id.replace("KH", ""), 10);
        return isNaN(num) ? max : (num > max ? num : max);
      }, 0);
      customer.id = `KH${String(lastId + 1).padStart(6, "0")}`;
    }

    if (isNew) {
      customer.diem_tich_luy = customer.diem_tich_luy || 0;
      customer.tong_chi_tieu = customer.tong_chi_tieu || 0;
      customer.loai_khach = customer.loai_khach || "Thành viên";
      customer.cong_no = customer.cong_no || 0;
      db.Khach_hang.push(customer);
    } else {
      const idx = db.Khach_hang.findIndex(c => c.id === customer.id);
      if (idx !== -1) {
        db.Khach_hang[idx] = { ...db.Khach_hang[idx], ...customer };
      }
    }

    recalculateStats(db);
    saveLocalDb(db);
    return { success: true, data: customer };
  }

  if (cleanPath === "suppliers" && method === "POST") {
    const supplier = getBody();
    let isNew = false;
    if (!supplier.id) {
      isNew = true;
      const lastId = db.Nha_cung_cap.reduce((max, s) => {
        const num = parseInt(s.id.replace("NCC", ""), 10);
        return isNaN(num) ? max : (num > max ? num : max);
      }, 0);
      supplier.id = `NCC${String(lastId + 1).padStart(5, "0")}`;
    }

    if (isNew) {
      supplier.cong_no_hien_tai = supplier.cong_no_hien_tai || 0;
      db.Nha_cung_cap.push(supplier);
    } else {
      const idx = db.Nha_cung_cap.findIndex(s => s.id === supplier.id);
      if (idx !== -1) {
        db.Nha_cung_cap[idx] = { ...db.Nha_cung_cap[idx], ...supplier };
      }
    }

    saveLocalDb(db);
    return { success: true, data: supplier };
  }

  if (cleanPath === "employees" && method === "POST") {
    const employee = getBody();
    let isNew = false;
    if (!employee.id) {
      isNew = true;
      const lastId = db.Nhan_vien.reduce((max, e) => {
        const num = parseInt(e.id.replace("NV", ""), 10);
        return isNaN(num) ? max : (num > max ? num : max);
      }, 0);
      employee.id = `NV${String(lastId + 1).padStart(3, "0")}`;
    }

    if (isNew) {
      employee.trang_thai = employee.trang_thai || "Đang hoạt động";
      db.Nhan_vien.push(employee);
    } else {
      const idx = db.Nhan_vien.findIndex(e => e.id === employee.id);
      if (idx !== -1) {
        db.Nhan_vien[idx] = { ...db.Nhan_vien[idx], ...employee };
      }
    }

    saveLocalDb(db);
    return { success: true, data: employee };
  }

  if (cleanPath === "groups" && method === "POST") {
    const category = getBody();
    let isNew = false;
    if (!category.id) {
      isNew = true;
      const lastId = db.Nhom_hang.reduce((max, c) => {
        const num = parseInt(c.id.replace("DM", ""), 10);
        return isNaN(num) ? max : (num > max ? num : max);
      }, 0);
      category.id = `DM${String(lastId + 1).padStart(3, "0")}`;
    }

    if (isNew) {
      db.Nhom_hang.push(category);
    } else {
      const idx = db.Nhom_hang.findIndex(c => c.id === category.id);
      if (idx !== -1) {
        db.Nhom_hang[idx] = { ...db.Nhom_hang[idx], ...category };
      }
    }

    saveLocalDb(db);
    return { success: true, data: category };
  }

  if (cleanPath === "brands" && method === "POST") {
    const brand = getBody();
    let isNew = false;
    if (!brand.id) {
      isNew = true;
      const lastId = db.Thuong_hieu.reduce((max, b) => {
        const num = parseInt(b.id.replace("TH", ""), 10);
        return isNaN(num) ? max : (num > max ? num : max);
      }, 0);
      brand.id = `TH${String(lastId + 1).padStart(3, "0")}`;
    }

    if (isNew) {
      db.Thuong_hieu.push(brand);
    } else {
      const idx = db.Thuong_hieu.findIndex(b => b.id === brand.id);
      if (idx !== -1) {
        db.Thuong_hieu[idx] = { ...db.Thuong_hieu[idx], ...brand };
      }
    }

    saveLocalDb(db);
    return { success: true, data: brand };
  }

  if (cleanPath === "import" && method === "POST") {
    const importData = getBody();
    const imports = db.Nhap_hang || [];
    const lastId = imports.reduce((max, imp) => {
      const num = parseInt(imp.id.replace("PN", ""), 10);
      return isNaN(num) ? max : (num > max ? num : max);
    }, 0);
    const newId = `PN${String(lastId + 1).padStart(6, "0")}`;

    const newImport: ImportOrder = {
      id: newId,
      ngay_nhap: importData.ngay_nhap || new Date().toISOString(),
      id_nha_cung_cap: importData.id_nha_cung_cap,
      id_nhan_vien: importData.id_nhan_vien || "NV001",
      chi_tiet_nhap: importData.chi_tiet_nhap || [],
      tong_tien_nhap: importData.tong_tien_nhap || 0,
      da_thanh_toan: importData.da_thanh_toan || 0,
      con_no: importData.con_no || 0,
      trang_thai: "Đã nhận hàng"
    };

    // add to stocks
    newImport.chi_tiet_nhap.forEach((detail) => {
      const prod = db.San_pham.find(p => p.id === detail.id_sp);
      if (prod) {
        prod.ton_kho += detail.so_luong;
      }
    });

    // supplier debt balance
    const supplier = db.Nha_cung_cap.find(s => s.id === newImport.id_nha_cung_cap);
    if (supplier && newImport.con_no > 0) {
      supplier.cong_no_hien_tai += newImport.con_no;
    }

    db.Nhap_hang.push(newImport);
    recalculateStats(db);
    saveLocalDb(db);
    return { success: true, data: newImport, message: "Nhập hàng thành công!" };
  }

  if (cleanPath === "return" && method === "POST") {
    const returnData = getBody();
    const returns = db.Tra_hang || [];
    const lastId = returns.reduce((max, ret) => {
      const num = parseInt(ret.id.replace("THD", ""), 10);
      return isNaN(num) ? max : (num > max ? num : max);
    }, 0);
    const newId = `THD${String(lastId + 1).padStart(5, "0")}`;

    const newReturn: ReturnOrder = {
      id: newId,
      id_hoa_don_goc: returnData.id_hoa_don_goc,
      ngay_tra: returnData.ngay_tra || new Date().toISOString(),
      id_khach_hang: returnData.id_khach_hang || "KH000001",
      chi_tiet_tra_hang: returnData.chi_tiet_tra_hang || [],
      tong_tien_tra: returnData.tong_tien_tra || 0,
      ly_do_tra: returnData.ly_do_tra || "",
      hinh_thuc_hoan_tien: returnData.hinh_thuc_hoan_tien || "Tiền mặt",
      id_nhan_vien_nhan: returnData.id_nhan_vien_nhan || "NV001"
    };

    // return to stocks
    newReturn.chi_tiet_tra_hang.forEach((detail) => {
      const prod = db.San_pham.find(p => p.id === detail.id_sp);
      if (prod) {
        prod.ton_kho += detail.so_luong;
      }
    });

    db.Tra_hang.push(newReturn);
    recalculateStats(db);
    saveLocalDb(db);
    return { success: true, data: newReturn, message: "Khách trả hàng thành công!" };
  }

  if (cleanPath === "return-ncc" && method === "POST") {
    const returnNCCData = getBody();
    const returnsNCC = db.Tra_hang_NCC || [];
    const lastId = returnsNCC.reduce((max, ret) => {
      const num = parseInt(ret.id.replace("THNCC", ""), 10);
      return isNaN(num) ? max : (num > max ? num : max);
    }, 0);
    const newId = `THNCC${String(lastId + 1).padStart(3, "0")}`;

    const newReturnNCC: ReturnSupplierOrder = {
      id: newId,
      id_phieu_nhap_goc: returnNCCData.id_phieu_nhap_goc || "",
      id_nha_cung_cap: returnNCCData.id_nha_cung_cap || "",
      ngay_tra: returnNCCData.ngay_tra || new Date().toISOString(),
      id_nhan_vien_thuc_hien: returnNCCData.id_nhan_vien_thuc_hien || "NV001",
      chi_tiet_tra: returnNCCData.chi_tiet_tra || [],
      tong_tien_ncc_hoan: returnNCCData.tong_tien_ncc_hoan || 0,
      tinh_trang_hoan_tien: returnNCCData.tinh_trang_hoan_tien || "Đã trừ vào công nợ",
      ly_do_tra: returnNCCData.ly_do_tra || ""
    };

    // remove from stocks
    newReturnNCC.chi_tiet_tra.forEach((detail) => {
      const prod = db.San_pham.find(p => p.id === detail.id_sp);
      if (prod) {
        prod.ton_kho = Math.max(0, prod.ton_kho - detail.so_luong);
      }
    });

    // deduct supplier debt balance
    const supplier = db.Nha_cung_cap.find(s => s.id === newReturnNCC.id_nha_cung_cap);
    if (supplier) {
      supplier.cong_no_hien_tai = Math.max(0, supplier.cong_no_hien_tai - newReturnNCC.tong_tien_ncc_hoan);
    }

    db.Tra_hang_NCC.push(newReturnNCC);
    recalculateStats(db);
    saveLocalDb(db);
    return { success: true, data: newReturnNCC, message: "Trả hàng NCC thành công!" };
  }

  if (cleanPath === "settings/shop" && method === "POST") {
    const shop = getBody();
    db.Thong_tin_shop = { ...db.Thong_tin_shop, ...shop };
    saveLocalDb(db);
    return { success: true, message: "Cập nhật thành công!" };
  }

  if (cleanPath === "settings/bank") {
    if (method === "POST") {
      const bank = getBody();
      if (!bank.id) {
        bank.id = `NH${String(db.Ngan_hang.length + 1).padStart(3, "0")}`;
        db.Ngan_hang.push(bank);
      } else {
        const idx = db.Ngan_hang.findIndex(b => b.id === bank.id);
        if (idx !== -1) {
          db.Ngan_hang[idx] = { ...db.Ngan_hang[idx], ...bank };
        }
      }
      saveLocalDb(db);
      return { success: true, message: "Cập nhật thành công!" };
    }
  }

  if (cleanPath.startsWith("settings/bank/") && method === "DELETE") {
    const bankId = cleanPath.split("settings/bank/")[1] || "";
    db.Ngan_hang = db.Ngan_hang.filter(b => b.id !== bankId);
    saveLocalDb(db);
    return { success: true, message: "Đã xóa!" };
  }

  if (cleanPath === "upload-image" && method === "POST") {
    return { success: true, url: "https://picsum.photos/200/200" };
  }

  if (cleanPath === "backup" && method === "GET") {
    return db;
  }

  if (cleanPath === "restore" && method === "POST") {
    const uploaded = getBody();
    if (uploaded && typeof uploaded === "object" && uploaded.San_pham && uploaded.Thong_tin_shop) {
      saveLocalDb(uploaded);
      return { success: true, message: "Khôi phục dữ liệu thành công!" };
    }
    throw new Error("Dữ liệu khôi phục không hợp lệ!");
  }

  throw new Error(`Mock endpoint not supported: ${method} /api/${cleanPath}`);
}
