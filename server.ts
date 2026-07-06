import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { DatabaseSchema, Invoice, Product, Customer, Supplier, Employee, ImportOrder, ReturnOrder, ReturnSupplierOrder } from "./src/types";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "20mb" }));
  app.use(express.urlencoded({ limit: "20mb", extended: true }));
  app.use("/image", express.static(path.join(process.cwd(), "image")));

  const DATA_DIR = path.join(process.cwd(), "data");

  // Read data from files inside data/ directory
  function readDb(): DatabaseSchema {
    const brandsPath = path.join(DATA_DIR, "brands.json");
    const categoriesPath = path.join(DATA_DIR, "categories.json");
    const configsPath = path.join(DATA_DIR, "configs.json");
    const customersPath = path.join(DATA_DIR, "customers.json");
    const employeesPath = path.join(DATA_DIR, "employees.json");
    const ordersPath = path.join(DATA_DIR, "orders.json");
    const productsPath = path.join(DATA_DIR, "products.json");
    const suppliersPath = path.join(DATA_DIR, "suppliers.json");
    const overviewPath = path.join(DATA_DIR, "overview.json");

    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      // Load configs
      let configs: any = {};
      if (fs.existsSync(configsPath)) {
        configs = JSON.parse(fs.readFileSync(configsPath, "utf-8"));
      }
      const Thong_tin_shop = configs.Thong_tin_shop || {
        ten_shop: "Thanh Ly Shop",
        dia_chi: "620 Nguyễn Nghiêm - Đức Phổ - Quảng Ngãi",
        dien_thoai: "0918005269",
        email: "contact@techshop.com",
        website: "https://techshop.netlify.app",
        slogan: "Chất lượng tạo niềm tin"
      };
      const Ngan_hang = (configs.Ngan_hang || []).map((bank: any) => ({
        ...bank,
        id: bank.id_nh || bank.id
      }));

      // Load categories
      let Nhom_hang: any[] = [];
      if (fs.existsSync(categoriesPath)) {
        const rawDM = JSON.parse(fs.readFileSync(categoriesPath, "utf-8"));
        Nhom_hang = rawDM.map((c: any) => ({
          ...c,
          id: c.id_dm || c.id
        }));
      }

      // Load brands
      let Thuong_hieu: any[] = [];
      if (fs.existsSync(brandsPath)) {
        const rawTH = JSON.parse(fs.readFileSync(brandsPath, "utf-8"));
        Thuong_hieu = rawTH.map((b: any) => ({
          ...b,
          id: b.id_th || b.id
        }));
      }

      // Load employees
      let Nhan_vien: any[] = [];
      if (fs.existsSync(employeesPath)) {
        const rawEmp = JSON.parse(fs.readFileSync(employeesPath, "utf-8"));
        Nhan_vien = rawEmp.map((e: any) => ({
          ...e,
          id: e.id_nv || e.id,
          trang_thai: e.isActive === false ? "Đã nghỉ việc" : "Đang hoạt động"
        }));
      }

      // Load customers
      let Khach_hang: any[] = [];
      if (fs.existsSync(customersPath)) {
        const rawKH = JSON.parse(fs.readFileSync(customersPath, "utf-8"));
        Khach_hang = rawKH.map((c: any) => ({
          ...c,
          id: c.id_kh || c.id
        }));
      }

      // Load suppliers
      let Nha_cung_cap: any[] = [];
      if (fs.existsSync(suppliersPath)) {
        const rawSuppliers = JSON.parse(fs.readFileSync(suppliersPath, "utf-8"));
        Nha_cung_cap = rawSuppliers.map((s: any) => ({
          id: s.id_ncc || s.id,
          ten_nha_cung_cap: s.ten_nha_cung_cap,
          nguoi_lien_he: s.nguoi_lien_he,
          so_dien_thoai: s.so_dien_thoai,
          email: s.email,
          dia_chi: s.dia_chi,
          cong_no_hien_tai: s.cong_no_ncc !== undefined ? s.cong_no_ncc : s.cong_no_hien_tai || 0
        }));
      }

      // Load products
      let San_pham: any[] = [];
      if (fs.existsSync(productsPath)) {
        const rawProducts = JSON.parse(fs.readFileSync(productsPath, "utf-8"));
        San_pham = rawProducts.map((p: any, idx: number) => {
          let defaultDate = new Date();
          if (idx > 1 && idx <= 3) {
            defaultDate.setDate(defaultDate.getDate() - 1);
          } else if (idx > 3 && idx <= 5) {
            defaultDate.setDate(defaultDate.getDate() - 4);
          } else if (idx > 5 && idx <= 7) {
            defaultDate.setDate(defaultDate.getDate() - 10);
          } else if (idx > 7) {
            defaultDate.setMonth(defaultDate.getMonth() - 1);
          }
          return {
            ...p,
            id: p.id_sp || p.id,
            trang_thai: p.isActive === false ? "Ngừng kinh doanh" : "Đang kinh doanh",
            tich_diem: p.tich_diem !== undefined ? p.tich_diem : true,
            ban_truc_tiep: p.isDirectSale !== undefined ? p.isDirectSale : (p.ban_truc_tiep !== undefined ? p.ban_truc_tiep : true),
            ngay_tao: p.ngay_tao || defaultDate.toISOString(),
            id_nha_cung_cap: p.id_nha_cung_cap || "NCC00001"
          };
        });
      }

      // Load orders and split into separate arrays
      let orders: any[] = [];
      if (fs.existsSync(ordersPath)) {
        orders = JSON.parse(fs.readFileSync(ordersPath, "utf-8"));
      }

      const Hoa_don: Invoice[] = [];
      const Tra_hang: ReturnOrder[] = [];
      const Nhap_hang: ImportOrder[] = [];
      const Tra_hang_NCC: ReturnSupplierOrder[] = [];

      orders.forEach((o: any) => {
        if (o.loai_phieu === "BAN_HANG") {
          Hoa_don.push({
            id: o.id_hd || o.id,
            ngay_lap: o.ngay_lap,
            id_khach_hang: o.id_doi_tac || "KH000001",
            id_nhan_vien: o.id_nhan_vien || "NV001",
            chi_tiet_san_pham: (o.chi_tiet || []).map((item: any) => ({
              id_sp: item.id_san_pham || item.id_sp,
              so_luong: item.so_luong,
              don_gia: item.don_gia,
              thanh_tien: item.thanh_tien
            })),
            tong_tien_hang: o.tong_tien || 0,
            giam_gia: o.giam_gia || 0,
            khach_can_tra: o.khach_can_tra !== undefined ? o.khach_can_tra : (o.tong_tien - (o.giam_gia || 0)),
            khach_da_tra: o.thuc_thu_thuc_chi !== undefined ? o.thuc_thu_thuc_chi : (o.tong_tien - (o.giam_gia || 0)),
            phuong_thuc_thanh_toan: o.phuong_thuc_thanh_toan || "Tiền mặt",
            trang_thai: o.trang_thai || "Đã hoàn thành"
          });
        } else if (o.loai_phieu === "KHACH_TRA_HANG") {
          Tra_hang.push({
            id: o.id_thd || o.id,
            id_hoa_don_goc: o.id_phieu_goc || "",
            ngay_tra: o.ngay_lap,
            id_khach_hang: o.id_doi_tac || "KH000001",
            chi_tiet_tra_hang: (o.chi_tiet || []).map((item: any) => ({
              id_sp: item.id_san_pham || item.id_sp,
              so_luong: item.so_luong,
              gia_tra: item.don_gia,
              thanh_tien: item.thanh_tien
            })),
            tong_tien_tra: o.tong_tien || 0,
            ly_do_tra: o.ghi_chu || "",
            hinh_thuc_hoan_tien: o.phuong_thuc_thanh_toan || "Tiền mặt",
            id_nhan_vien_nhan: o.id_nhan_vien || "NV001"
          });
        } else if (o.loai_phieu === "NHAP_HANG") {
          Nhap_hang.push({
            id: o.id_pn || o.id,
            ngay_nhap: o.ngay_lap,
            id_nha_cung_cap: o.id_doi_tac || "",
            id_nhan_vien: o.id_nhan_vien || "NV001",
            chi_tiet_nhap: (o.chi_tiet || []).map((item: any) => ({
              id_sp: item.id_san_pham || item.id_sp,
              so_luong: item.so_luong,
              gian_nhap: item.don_gia,
              thanh_tien: item.thanh_tien
            })),
            tong_tien_nhap: o.tong_tien || 0,
            da_thanh_toan: o.thuc_thu_thuc_chi || 0,
            con_no: (o.tong_tien || 0) - (o.thuc_thu_thuc_chi || 0),
            trang_thai: o.trang_thai || "Đã nhận hàng"
          });
        } else if (o.loai_phieu === "TRA_HANG_NCC") {
          Tra_hang_NCC.push({
            id: o.id_thncc || o.id,
            id_phieu_nhap_goc: o.id_phieu_goc || "",
            id_nha_cung_cap: o.id_doi_tac || "",
            ngay_tra: o.ngay_lap,
            id_nhan_vien_thuc_hien: o.id_nhan_vien || "NV001",
            chi_tiet_tra: (o.chi_tiet || []).map((item: any) => ({
              id_sp: item.id_san_pham || item.id_sp,
              so_luong: item.so_luong,
              gia_tra_lai: item.don_gia,
              thanh_tien: item.thanh_tien
            })),
            tong_tien_ncc_hoan: o.tong_tien || 0,
            tinh_trang_hoan_tien: o.trang_thai || "Đã trừ vào công nợ",
            ly_do_tra: o.ghi_chu || ""
          });
        }
      });

      // Load overview metrics
      let Tong_quan: any = null;
      if (fs.existsSync(overviewPath)) {
        Tong_quan = JSON.parse(fs.readFileSync(overviewPath, "utf-8"));
      }
      if (!Tong_quan) {
        Tong_quan = {
          doanh_thu_thang_nay: 0,
          so_don_hang_thang_nay: 0,
          tong_so_khach_hang: Khach_hang.length,
          tong_so_san_pham_he_thong: San_pham.length,
          gia_tri_ton_kho_hien_tai: 0,
          cap_nhat_cuoi_cung: new Date().toISOString()
        };
      }

      return {
        Thong_tin_shop,
        Ngan_hang,
        Nhom_hang,
        Thuong_hieu,
        Nhan_vien,
        Khach_hang,
        Nha_cung_cap,
        San_pham,
        Hoa_don,
        Tra_hang,
        Nhap_hang,
        Tra_hang_NCC,
        Tong_quan
      };
    } catch (e) {
      console.error("Error reading database:", e);
    }

    return {
      Thong_tin_shop: {
        ten_shop: "Thanh Ly Shop",
        dia_chi: "620 Nguyễn Nghiêm - Đức Phổ - Quảng Ngãi",
        dien_thoai: "0918005269",
        email: "contact@techshop.com",
        website: "https://techshop.netlify.app",
        slogan: "Chất lượng tạo niềm tin"
      },
      Ngan_hang: [],
      Nhom_hang: [],
      Thuong_hieu: [],
      Nhan_vien: [],
      Khach_hang: [],
      Nha_cung_cap: [],
      San_pham: [],
      Hoa_don: [],
      Tra_hang: [],
      Nhap_hang: [],
      Tra_hang_NCC: [],
      Tong_quan: {
        doanh_thu_thang_nay: 0,
        so_don_hang_thang_nay: 0,
        tong_so_khach_hang: 0,
        tong_so_san_pham_he_thong: 0,
        gia_tri_ton_kho_hien_tai: 0,
        cap_nhat_cuoi_cung: new Date().toISOString()
      }
    };
  }

  // Write data back into individual files in data/ directory
  function writeDb(db: DatabaseSchema): boolean {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      const brandsPath = path.join(DATA_DIR, "brands.json");
      const categoriesPath = path.join(DATA_DIR, "categories.json");
      const configsPath = path.join(DATA_DIR, "configs.json");
      const customersPath = path.join(DATA_DIR, "customers.json");
      const employeesPath = path.join(DATA_DIR, "employees.json");
      const ordersPath = path.join(DATA_DIR, "orders.json");
      const productsPath = path.join(DATA_DIR, "products.json");
      const suppliersPath = path.join(DATA_DIR, "suppliers.json");
      const overviewPath = path.join(DATA_DIR, "overview.json");

      // 1. configs.json
      const configs = {
        Thong_tin_shop: db.Thong_tin_shop,
        Ngan_hang: (db.Ngan_hang || []).map((b: any) => {
          const { id, ...rest } = b;
          return {
            id_nh: id,
            ...rest
          };
        })
      };
      fs.writeFileSync(configsPath, JSON.stringify(configs, null, 2), "utf-8");

      // 2. categories.json
      const categoriesToSave = (db.Nhom_hang || []).map((c: any) => {
        const { id, ...rest } = c;
        return {
          id_dm: id,
          ...rest
        };
      });
      fs.writeFileSync(categoriesPath, JSON.stringify(categoriesToSave, null, 2), "utf-8");

      // 3. brands.json
      const brandsToSave = (db.Thuong_hieu || []).map((b: any) => {
        const { id, ...rest } = b;
        return {
          id_th: id,
          ...rest
        };
      });
      fs.writeFileSync(brandsPath, JSON.stringify(brandsToSave, null, 2), "utf-8");

      // 4. employees.json
      const employeesToSave = (db.Nhan_vien || []).map((e: any) => {
        const { id, trang_thai, ...rest } = e;
        return {
          id_nv: id,
          ...rest,
          isActive: trang_thai !== "Đã nghỉ việc"
        };
      });
      fs.writeFileSync(employeesPath, JSON.stringify(employeesToSave, null, 2), "utf-8");

      // 5. customers.json
      const customersToSave = (db.Khach_hang || []).map((c: any) => {
        const { id, ...rest } = c;
        return {
          id_kh: id,
          ...rest
        };
      });
      fs.writeFileSync(customersPath, JSON.stringify(customersToSave, null, 2), "utf-8");

      // 6. suppliers.json
      const suppliersToSave = (db.Nha_cung_cap || []).map((s: any) => {
        const { id, cong_no_hien_tai, ...rest } = s;
        return {
          id_ncc: id,
          ...rest,
          cong_no_ncc: cong_no_hien_tai
        };
      });
      fs.writeFileSync(suppliersPath, JSON.stringify(suppliersToSave, null, 2), "utf-8");

      // 7. products.json
      const productsToSave = (db.San_pham || []).map((p: any) => {
        const { id, trang_thai, ban_truc_tiep, tich_diem, ...rest } = p;
        return {
          id_sp: id,
          ...rest,
          isActive: trang_thai !== "Ngừng kinh doanh",
          isDirectSale: ban_truc_tiep !== false
        };
      });
      fs.writeFileSync(productsPath, JSON.stringify(productsToSave, null, 2), "utf-8");

      // 8. orders.json
      const ordersToSave: any[] = [];

      (db.Hoa_don || []).forEach((h: any) => {
        ordersToSave.push({
          id_hd: h.id,
          loai_phieu: "BAN_HANG",
          ngay_lap: h.ngay_lap,
          id_doi_tac: h.id_khach_hang,
          id_nhan_vien: h.id_nhan_vien,
          chi_tiet: h.chi_tiet_san_pham.map((item: any) => ({
            id_san_pham: item.id_sp || item.id_san_pham,
            so_luong: item.so_luong,
            don_gia: item.don_gia,
            thanh_tien: item.thanh_tien
          })),
          tong_tien: h.tong_tien_hang,
          giam_gia: h.giam_gia,
          thuc_thu_thuc_chi: h.khach_da_tra,
          khach_can_tra: h.khach_can_tra,
          phuong_thuc_thanh_toan: h.phuong_thuc_thanh_toan,
          trang_thai: h.trang_thai,
          ghi_chu: ""
        });
      });

      (db.Tra_hang || []).forEach((t: any) => {
        ordersToSave.push({
          id_thd: t.id,
          loai_phieu: "KHACH_TRA_HANG",
          id_phieu_goc: t.id_hoa_don_goc,
          ngay_lap: t.ngay_tra,
          id_doi_tac: t.id_khach_hang,
          id_nhan_vien: t.id_nhan_vien_nhan,
          chi_tiet: t.chi_tiet_tra_hang.map((item: any) => ({
            id_san_pham: item.id_sp || item.id_san_pham,
            so_luong: item.so_luong,
            don_gia: item.gia_tra,
            thanh_tien: item.thanh_tien
          })),
          tong_tien: t.tong_tien_tra,
          giam_gia: 0,
          thuc_thu_thuc_chi: -t.tong_tien_tra,
          phuong_thuc_thanh_toan: t.hinh_thuc_hoan_tien,
          trang_thai: "Đã hoàn thành",
          ghi_chu: t.ly_do_tra
        });
      });

      (db.Nhap_hang || []).forEach((n: any) => {
        ordersToSave.push({
          id_pn: n.id,
          loai_phieu: "NHAP_HANG",
          ngay_lap: n.ngay_nhap,
          id_doi_tac: n.id_nha_cung_cap,
          id_nhan_vien: n.id_nhan_vien,
          chi_tiet: n.chi_tiet_nhap.map((item: any) => ({
            id_san_pham: item.id_sp || item.id_san_pham,
            so_luong: item.so_luong,
            don_gia: item.gian_nhap,
            thanh_tien: item.thanh_tien
          })),
          tong_tien: n.tong_tien_nhap,
          giam_gia: 0,
          thuc_thu_thuc_chi: n.da_thanh_toan,
          trang_thai: n.trang_thai,
          ghi_chu: n.con_no > 0 ? `Còn nợ NCC ${n.con_no} VND` : ""
        });
      });

      (db.Tra_hang_NCC || []).forEach((tn: any) => {
        ordersToSave.push({
          id_thncc: tn.id,
          loai_phieu: "TRA_HANG_NCC",
          id_phieu_goc: tn.id_phieu_nhap_goc,
          id_doi_tac: tn.id_nha_cung_cap,
          ngay_lap: tn.ngay_tra,
          id_nhan_vien: tn.id_nhan_vien_thuc_hien,
          chi_tiet: tn.chi_tiet_tra.map((item: any) => ({
            id_san_pham: item.id_sp || item.id_san_pham,
            so_luong: item.so_luong,
            don_gia: item.gia_tra_lai,
            thanh_tien: item.thanh_tien
          })),
          tong_tien: tn.tong_tien_ncc_hoan,
          giam_gia: 0,
          thuc_thu_thuc_chi: 0,
          trang_thai: tn.tinh_trang_hoan_tien,
          ghi_chu: tn.ly_do_tra
        });
      });

      ordersToSave.sort((a, b) => new Date(a.ngay_lap).getTime() - new Date(b.ngay_lap).getTime());
      fs.writeFileSync(ordersPath, JSON.stringify(ordersToSave, null, 2), "utf-8");

      // 9. overview.json
      fs.writeFileSync(overviewPath, JSON.stringify(db.Tong_quan || {}, null, 2), "utf-8");

      return true;
    } catch (e) {
      console.error("Error writing database:", e);
      return false;
    }
  }

  // Recalculate summary metrics
  function recalculateStats(db: DatabaseSchema) {
    const products = db.San_pham || [];
    const invoices = db.Hoa_don || [];
    const customers = db.Khach_hang || [];

    // Doanh thu thang nay (thang hien tai trong nam 2026 hoac nam hien hanh)
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthlyInvoices = invoices.filter(inv => {
      const date = new Date(inv.ngay_lap);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });

    const monthlyRevenue = monthlyInvoices.reduce((sum, inv) => sum + inv.khach_can_tra, 0);

    const inventoryValue = products.reduce((sum, prod) => {
      // Chi tinh san pham dang kinh doanh hoac tat ca
      return sum + (prod.gia_von * Math.max(0, prod.ton_kho));
    }, 0);

    db.Tong_quan = {
      doanh_thu_thang_nay: monthlyRevenue || db.Tong_quan.doanh_thu_thang_nay,
      so_don_hang_thang_nay: monthlyInvoices.length || db.Tong_quan.so_don_hang_thang_nay,
      tong_so_khach_hang: customers.length,
      tong_so_san_pham_he_thong: products.length,
      gia_tri_ton_kho_hien_tai: inventoryValue,
      cap_nhat_cuoi_cung: new Date().toISOString()
    };
  }

  // API - Upload image to server
  app.post("/api/upload-image", (req, res) => {
    const { name, data } = req.body;
    if (!name || !data) {
      return res.status(400).json({ success: false, message: "Thiếu tên file hoặc dữ liệu ảnh!" });
    }

    try {
      const imageDir = path.join(process.cwd(), "image");
      if (!fs.existsSync(imageDir)) {
        fs.mkdirSync(imageDir, { recursive: true });
      }

      // Clean up base64 prefix if exists
      const base64Data = data.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");

      // Generate clean filename
      const ext = path.extname(name) || ".png";
      const cleanName = `${Date.now()}_${name.replace(/[^a-zA-Z0-9]/g, "_")}${ext}`;
      const filePath = path.join(imageDir, cleanName);

      fs.writeFileSync(filePath, buffer);
      
      res.json({ success: true, url: `/image/${cleanName}` });
    } catch (error: any) {
      console.error("Lỗi upload ảnh:", error);
      res.status(500).json({ success: false, message: "Lỗi lưu file ảnh: " + error.message });
    }
  });

  // API - Get all data
  app.get("/api/data", (req, res) => {
    const db = readDb();
    res.json(db);
  });

  // API - Save all data (overwrite)
  app.post("/api/data", (req, res) => {
    const oldDb = readDb();
    const newDb = req.body;

    if (oldDb && oldDb.San_pham && newDb && newDb.San_pham) {
      oldDb.San_pham.forEach((oldProd) => {
        if (oldProd.hinh_anh && oldProd.hinh_anh.startsWith("/image/")) {
          const isStillUsed = newDb.San_pham.some((newProd: any) => newProd.hinh_anh === oldProd.hinh_anh);
          if (!isStillUsed) {
            try {
              const fileName = oldProd.hinh_anh.replace(/^\/image\//, "");
              if (fileName && !fileName.includes("..") && !fileName.includes("/") && !fileName.includes("\\")) {
                const filePath = path.join(process.cwd(), "image", fileName);
                if (fs.existsSync(filePath)) {
                  fs.unlinkSync(filePath);
                  console.log(`Deleted unused product image on DB overwrite: ${filePath}`);
                }
              }
            } catch (err) {
              console.error("Lỗi xóa ảnh sản phẩm khi ghi đè DB:", err);
            }
          }
        }
      });
    }

    const success = writeDb(newDb);
    if (success) {
      res.json({ success: true, message: "Đồng bộ dữ liệu thành công!" });
    } else {
      res.status(500).json({ success: false, message: "Lưu dữ liệu thất bại!" });
    }
  });

  // API - Create an invoice (checkout)
  app.post("/api/sale", (req, res) => {
    const db = readDb();
    const invoiceData = req.body;

    // Generate unique ID
    const invoices = db.Hoa_don || [];
    const lastId = invoices.reduce((max, inv) => {
      const num = parseInt(inv.id.replace("HD", ""));
      return num > max ? num : max;
    }, 0);
    const newId = `HD${String(lastId + 1).padStart(6, "0")}`;

    const newInvoice: Invoice = {
      id: newId,
      ngay_lap: invoiceData.ngay_lap || new Date().toISOString(),
      id_khach_hang: invoiceData.id_khach_hang || "KH000001", // default customer if none
      id_nhan_vien: invoiceData.id_nhan_vien || "NV001",
      chi_tiet_san_pham: invoiceData.chi_tiet_san_pham,
      tong_tien_hang: invoiceData.tong_tien_hang,
      giam_gia: invoiceData.giam_gia || 0,
      khach_can_tra: invoiceData.khach_can_tra,
      khach_da_tra: invoiceData.khach_da_tra,
      phuong_thuc_thanh_toan: invoiceData.phuong_thuc_thanh_toan || "Tiền mặt",
      points_deducted: invoiceData.points_deducted || 0,
      trang_thai: "Đã hoàn thành"
    };

    // Update product stock levels
    newInvoice.chi_tiet_san_pham.forEach((detail) => {
      const product = db.San_pham.find(p => p.id === (detail.id_sp || (detail as any).id_san_pham));
      if (product) {
        product.ton_kho = Math.max(0, product.ton_kho - detail.so_luong);
      }
    });

    // Update customer stats
    const customer = db.Khach_hang.find(c => c.id === newInvoice.id_khach_hang);
    if (customer) {
      if (invoiceData.points_deducted && invoiceData.points_deducted > 0) {
        customer.diem_tich_luy = Math.max(0, customer.diem_tich_luy - Number(invoiceData.points_deducted));
      }
      customer.tong_chi_tieu += newInvoice.khach_can_tra;
      const rate = Number(db.Thong_tin_shop.doanh_thu_doi_diem) || 100000;
      customer.diem_tich_luy += Math.floor(newInvoice.khach_can_tra / rate);
      
      // Update customer debt if they paid less
      const unpaid = newInvoice.khach_can_tra - newInvoice.khach_da_tra;
      if (unpaid > 0) {
        customer.cong_no = (customer.cong_no || 0) + unpaid;
      }
    }

    // Add to invoices list
    db.Hoa_don.push(newInvoice);

    // Recalculate dashboard metrics
    recalculateStats(db);

    const success = writeDb(db);
    if (success) {
      res.json({ success: true, data: newInvoice, message: "Thanh toán thành công!" });
    } else {
      res.status(500).json({ success: false, message: "Lưu hóa đơn thất bại!" });
    }
  });

  // API - Add / Update Product
  app.post("/api/products", (req, res) => {
    const db = readDb();
    const product = req.body;

    let isNew = false;
    if (!product.id) {
      isNew = true;
      // Create new with sequential ID
      const lastId = db.San_pham.reduce((max, prod) => {
        if (prod.id && prod.id.startsWith("SP")) {
          const num = parseInt(prod.id.replace("SP", ""), 10);
          if (!isNaN(num)) {
            return num > max ? num : max;
          }
        }
        return max;
      }, 0);
      product.id = `SP${String(lastId + 1).padStart(6, "0")}`;
    } else {
      // If product.id is specified, check if it already exists
      const existingIndex = db.San_pham.findIndex(p => p.id === product.id);
      if (existingIndex === -1) {
        isNew = true;
      }
    }

    if (isNew) {
      product.ngay_tao = product.ngay_tao || new Date().toISOString();
      product.tich_diem = product.tich_diem !== undefined ? product.tich_diem : true;
      product.ban_truc_tiep = product.ban_truc_tiep !== undefined ? product.ban_truc_tiep : true;
      if (!product.bar_code) {
        product.bar_code = product.id;
      }
      db.San_pham.push(product);
    } else {
      // Update existing
      const index = db.San_pham.findIndex(p => p.id === product.id);
      const oldProduct = db.San_pham[index];

      // If there's an existing image and the new product has a different image (or no image)
      if (oldProduct && oldProduct.hinh_anh && oldProduct.hinh_anh !== product.hinh_anh) {
        const oldImgUrl = oldProduct.hinh_anh;
        if (oldImgUrl.startsWith("/image/")) {
          // Check if any other product is using this image
          const isUsedElsewhere = db.San_pham.some(p => p.id !== product.id && p.hinh_anh === oldImgUrl);
          if (!isUsedElsewhere) {
            try {
              const fileName = oldImgUrl.replace(/^\/image\//, "");
              if (fileName && !fileName.includes("..") && !fileName.includes("/") && !fileName.includes("\\")) {
                const filePath = path.join(process.cwd(), "image", fileName);
                if (fs.existsSync(filePath)) {
                  fs.unlinkSync(filePath);
                  console.log(`Deleted unused product image: ${filePath}`);
                }
              }
            } catch (err) {
              console.error("Lỗi xóa ảnh cũ khi cập nhật sản phẩm:", err);
            }
          }
        }
      }

      db.San_pham[index] = { ...db.San_pham[index], ...product };
    }

    recalculateStats(db);
    const success = writeDb(db);
    if (success) {
      res.json({ success: true, data: product });
    } else {
      res.status(500).json({ success: false, message: "Lưu sản phẩm thất bại!" });
    }
  });

  // API - Add / Update Customer
  app.post("/api/customers", (req, res) => {
    const db = readDb();
    const customer = req.body;

    if (!customer.id) {
      const lastId = db.Khach_hang.reduce((max, c) => {
        const num = parseInt(c.id.replace("KH", ""));
        return num > max ? num : max;
      }, 0);
      customer.id = `KH${String(lastId + 1).padStart(6, "0")}`;
      customer.diem_tich_luy = customer.diem_tich_luy || 0;
      customer.tong_chi_tieu = customer.tong_chi_tieu || 0;
      customer.loai_khach = customer.loai_khach || "Thành viên";
      db.Khach_hang.push(customer);
    } else {
      const index = db.Khach_hang.findIndex(c => c.id === customer.id);
      if (index !== -1) {
        db.Khach_hang[index] = { ...db.Khach_hang[index], ...customer };
      } else {
        db.Khach_hang.push(customer);
      }
    }

    recalculateStats(db);
    const success = writeDb(db);
    if (success) {
      res.json({ success: true, data: customer });
    } else {
      res.status(500).json({ success: false, message: "Lưu khách hàng thất bại!" });
    }
  });

  // API - Add / Update Supplier
  app.post("/api/suppliers", (req, res) => {
    const db = readDb();
    const supplier = req.body;

    if (!supplier.id) {
      const lastId = db.Nha_cung_cap.reduce((max, s) => {
        const num = parseInt(s.id.replace("NCC", ""));
        return num > max ? num : max;
      }, 0);
      supplier.id = `NCC${String(lastId + 1).padStart(5, "0")}`;
      supplier.cong_no_hien_tai = supplier.cong_no_hien_tai || 0;
      db.Nha_cung_cap.push(supplier);
    } else {
      const index = db.Nha_cung_cap.findIndex(s => s.id === supplier.id);
      if (index !== -1) {
        db.Nha_cung_cap[index] = { ...db.Nha_cung_cap[index], ...supplier };
      } else {
        db.Nha_cung_cap.push(supplier);
      }
    }

    const success = writeDb(db);
    if (success) {
      res.json({ success: true, data: supplier });
    } else {
      res.status(500).json({ success: false, message: "Lưu nhà cung cấp thất bại!" });
    }
  });

  // API - Add / Update Employee
  app.post("/api/employees", (req, res) => {
    const db = readDb();
    const employee = req.body;

    if (!employee.id) {
      const lastId = db.Nhan_vien.reduce((max, e) => {
        const num = parseInt(e.id.replace("NV", ""));
        return num > max ? num : max;
      }, 0);
      employee.id = `NV${String(lastId + 1).padStart(3, "0")}`;
      employee.trang_thai = employee.trang_thai || "Đang hoạt động";
      db.Nhan_vien.push(employee);
    } else {
      const index = db.Nhan_vien.findIndex(e => e.id === employee.id);
      if (index !== -1) {
        db.Nhan_vien[index] = { ...db.Nhan_vien[index], ...employee };
      } else {
        db.Nhan_vien.push(employee);
      }
    }

    const success = writeDb(db);
    if (success) {
      res.json({ success: true, data: employee });
    } else {
      res.status(500).json({ success: false, message: "Lưu nhân viên thất bại!" });
    }
  });

  // API - Record stock import
  app.post("/api/import", (req, res) => {
    const db = readDb();
    const importData = req.body;

    const imports = db.Nhap_hang || [];
    const lastId = imports.reduce((max, imp) => {
      const num = parseInt(imp.id.replace("PN", ""));
      return num > max ? num : max;
    }, 0);
    const newId = `PN${String(lastId + 1).padStart(6, "0")}`;

    const newImport: ImportOrder = {
      id: newId,
      ngay_nhap: new Date().toISOString(),
      id_nha_cung_cap: importData.id_nha_cung_cap,
      id_nhan_vien: importData.id_nhan_vien || "NV001",
      chi_tiet_nhap: importData.chi_tiet_nhap,
      tong_tien_nhap: importData.tong_tien_nhap,
      da_thanh_toan: importData.da_thanh_toan || 0,
      con_no: importData.tong_tien_nhap - (importData.da_thanh_toan || 0),
      trang_thai: "Đã nhận hàng",
      phuong_thuc_thanh_toan: importData.phuong_thuc_thanh_toan || "Tiền mặt"
    };

    // Update product stock and update unit cost (gia_von) as weighted average or import cost
    newImport.chi_tiet_nhap.forEach((detail) => {
      const product = db.San_pham.find(p => p.id === (detail.id_sp || (detail as any).id_san_pham));
      if (product) {
        // Recalculate average unit cost (gia_von)
        const oldTotalCost = product.gia_von * product.ton_kho;
        const newTotalCost = detail.gian_nhap * detail.so_luong;
        const totalQty = product.ton_kho + detail.so_luong;
        if (totalQty > 0) {
          product.gia_von = Math.round((oldTotalCost + newTotalCost) / totalQty);
        } else {
          product.gia_von = detail.gian_nhap;
        }
        product.ton_kho += detail.so_luong;
      }
    });

    // Update supplier debt
    const supplier = db.Nha_cung_cap.find(s => s.id === newImport.id_nha_cung_cap);
    if (supplier) {
      supplier.cong_no_hien_tai += newImport.con_no;
    }

    db.Nhap_hang.push(newImport);
    recalculateStats(db);

    const success = writeDb(db);
    if (success) {
      res.json({ success: true, data: newImport });
    } else {
      res.status(500).json({ success: false, message: "Lưu phiếu nhập thất bại!" });
    }
  });

  // API - Customer return
  app.post("/api/return", (req, res) => {
    const db = readDb();
    const returnData = req.body;

    const returns = db.Tra_hang || [];
    const lastId = returns.reduce((max, ret) => {
      const num = parseInt(ret.id.replace("THD", ""));
      return num > max ? num : max;
    }, 0);
    const newId = `THD${String(lastId + 1).padStart(5, "0")}`;

    const newReturn: ReturnOrder = {
      id: newId,
      id_hoa_don_goc: returnData.id_hoa_don_goc,
      ngay_tra: returnData.ngay_tra || new Date().toISOString(),
      id_khach_hang: returnData.id_khach_hang,
      chi_tiet_tra_hang: returnData.chi_tiet_tra_hang,
      tong_tien_tra: returnData.tong_tien_tra,
      ly_do_tra: returnData.ly_do_tra || "Khách hàng trả lại hàng",
      hinh_thuc_hoan_tien: returnData.hinh_thuc_hoan_tien || "Tiền mặt",
      id_nhan_vien_nhan: returnData.id_nhan_vien_nhan || "NV001"
    };

    // Return items to stock
    newReturn.chi_tiet_tra_hang.forEach((detail) => {
      const product = db.San_pham.find(p => p.id === (detail.id_sp || (detail as any).id_san_pham));
      if (product) {
        product.ton_kho += detail.so_luong;
      }
    });

    // Update client total spent & points
    const customer = db.Khach_hang.find(c => c.id === newReturn.id_khach_hang);
    if (customer) {
      customer.tong_chi_tieu = Math.max(0, customer.tong_chi_tieu - newReturn.tong_tien_tra);
      const rate = Number(db.Thong_tin_shop.doanh_thu_doi_diem) || 100000;
      customer.diem_tich_luy = Math.max(0, customer.diem_tich_luy - Math.floor(newReturn.tong_tien_tra / rate));
    }

    db.Tra_hang.push(newReturn);
    recalculateStats(db);

    const success = writeDb(db);
    if (success) {
      res.json({ success: true, data: newReturn });
    } else {
      res.status(500).json({ success: false, message: "Lưu phiếu trả hàng thất bại!" });
    }
  });

  // API - Return products to Supplier (Tra hang NCC)
  app.post("/api/return-ncc", (req, res) => {
    const db = readDb();
    const returnData = req.body;

    const returns = db.Tra_hang_NCC || [];
    const lastId = returns.reduce((max, ret) => {
      const num = parseInt(ret.id.replace("THNCC", ""));
      return num > max ? num : max;
    }, 0);
    const newId = `THNCC${String(lastId + 1).padStart(3, "0")}`;

    const newReturnNCC: ReturnSupplierOrder = {
      id: newId,
      id_phieu_nhap_goc: returnData.id_phieu_nhap_goc,
      id_nha_cung_cap: returnData.id_nha_cung_cap,
      ngay_tra: new Date().toISOString(),
      id_nhan_vien_thuc_hien: returnData.id_nhan_vien_thuc_hien || "NV001",
      chi_tiet_tra: returnData.chi_tiet_tra,
      tong_tien_ncc_hoan: returnData.tong_tien_ncc_hoan,
      tinh_trang_hoan_tien: returnData.tinh_trang_hoan_tien || "Đã trừ vào công nợ",
      ly_do_tra: returnData.ly_do_tra || "Hàng lỗi / Hỏng",
      phuong_thuc_thanh_toan: returnData.phuong_thuc_thanh_toan || "Tiền mặt"
    };

    // Subtract stock
    newReturnNCC.chi_tiet_tra.forEach((detail) => {
      const product = db.San_pham.find(p => p.id === (detail.id_sp || (detail as any).id_san_pham));
      if (product) {
        product.ton_kho = Math.max(0, product.ton_kho - detail.so_luong);
      }
    });

    // Subtract supplier debt
    const supplier = db.Nha_cung_cap.find(s => s.id === newReturnNCC.id_nha_cung_cap);
    if (supplier) {
      if (newReturnNCC.tinh_trang_hoan_tien === "Đã trừ vào công nợ") {
        supplier.cong_no_hien_tai = Math.max(0, supplier.cong_no_hien_tai - newReturnNCC.tong_tien_ncc_hoan);
      }
    }

    db.Tra_hang_NCC.push(newReturnNCC);
    recalculateStats(db);

    const success = writeDb(db);
    if (success) {
      res.json({ success: true, data: newReturnNCC });
    } else {
      res.status(500).json({ success: false, message: "Lưu phiếu trả hàng NCC thất bại!" });
    }
  });

  // API - Update Shop Settings
  app.post("/api/settings/shop", (req, res) => {
    const db = readDb();
    db.Thong_tin_shop = { ...db.Thong_tin_shop, ...req.body };
    const success = writeDb(db);
    if (success) {
      res.json({ success: true, data: db.Thong_tin_shop });
    } else {
      res.status(500).json({ success: false, message: "Lưu thiết lập shop thất bại!" });
    }
  });

  // API - Backup all JSON files
  app.get("/api/backup", (req, res) => {
    try {
      const filesToBackup = [
        "brands.json",
        "categories.json",
        "configs.json",
        "customers.json",
        "employees.json",
        "orders.json",
        "overview.json",
        "products.json",
        "suppliers.json"
      ];
      
      const backupData: Record<string, any> = {};
      
      filesToBackup.forEach(file => {
        const filePath = path.join(DATA_DIR, file);
        if (fs.existsSync(filePath)) {
          try {
            backupData[file] = JSON.parse(fs.readFileSync(filePath, "utf-8"));
          } catch (e) {
            backupData[file] = null;
          }
        } else {
          backupData[file] = null;
        }
      });
      
      res.json({
        version: "1.0",
        backupDate: new Date().toISOString(),
        files: backupData
      });
    } catch (error: any) {
      console.error("Backup failed:", error);
      res.status(500).json({ success: false, message: "Lỗi tạo bản sao lưu: " + error.message });
    }
  });

  // API - Restore all JSON files
  app.post("/api/restore", (req, res) => {
    try {
      const { files } = req.body;
      if (!files || typeof files !== "object") {
        return res.status(400).json({ success: false, message: "Định dạng file sao lưu không hợp lệ!" });
      }
      
      const allowedFiles = [
        "brands.json",
        "categories.json",
        "configs.json",
        "customers.json",
        "employees.json",
        "orders.json",
        "overview.json",
        "products.json",
        "suppliers.json"
      ];
      
      // Write each file
      for (const [filename, content] of Object.entries(files)) {
        if (!allowedFiles.includes(filename)) {
          continue; // Ignore any other files for security
        }
        if (content !== null) {
          const filePath = path.join(DATA_DIR, filename);
          fs.writeFileSync(filePath, JSON.stringify(content, null, 2), "utf-8");
        }
      }
      
      // Force read and recalculation
      const db = readDb();
      recalculateStats(db);
      writeDb(db);
      
      res.json({ success: true, message: "Khôi phục dữ liệu thành công!" });
    } catch (error: any) {
      console.error("Restore failed:", error);
      res.status(500).json({ success: false, message: "Lỗi khôi phục dữ liệu: " + error.message });
    }
  });

  // API - Add / Update Bank Details
  app.post("/api/settings/bank", (req, res) => {
    const db = readDb();
    const bank = req.body;

    db.Ngan_hang = db.Ngan_hang || [];

    if (!bank.id) {
      bank.id = `NH${String((db.Ngan_hang).length + 1).padStart(3, "0")}`;
      db.Ngan_hang.push(bank);
    } else {
      const index = db.Ngan_hang.findIndex(b => b.id === bank.id);
      if (index !== -1) {
        db.Ngan_hang[index] = { ...db.Ngan_hang[index], ...bank };
      } else {
        db.Ngan_hang.push(bank);
      }
    }

    const success = writeDb(db);
    if (success) {
      res.json({ success: true, data: bank });
    } else {
      res.status(500).json({ success: false, message: "Lưu tài khoản ngân hàng thất bại!" });
    }
  });

  // API - Delete Bank Detail
  app.delete("/api/settings/bank/:id", (req, res) => {
    const db = readDb();
    const id = req.params.id;
    db.Ngan_hang = db.Ngan_hang || [];
    db.Ngan_hang = db.Ngan_hang.filter(b => b.id !== id);
    const success = writeDb(db);
    if (success) {
      res.json({ success: true, message: "Xóa tài khoản ngân hàng thành công!" });
    } else {
      res.status(500).json({ success: false, message: "Xóa tài khoản ngân hàng thất bại!" });
    }
  });

  // API - Add Category / Group
  app.post("/api/groups", (req, res) => {
    const db = readDb();
    const group = req.body;

    if (!group.id) {
      const lastId = db.Nhom_hang.reduce((max, g) => {
        const num = parseInt(g.id.replace("DM", ""));
        return num > max ? num : max;
      }, 0);
      group.id = `DM${String(lastId + 1).padStart(3, "0")}`;
      db.Nhom_hang.push(group);
    } else {
      const index = db.Nhom_hang.findIndex(g => g.id === group.id);
      if (index !== -1) {
        db.Nhom_hang[index] = { ...db.Nhom_hang[index], ...group };
      } else {
        db.Nhom_hang.push(group);
      }
    }

    const success = writeDb(db);
    if (success) {
      res.json({ success: true, data: group });
    } else {
      res.status(500).json({ success: false, message: "Lưu nhóm hàng thất bại!" });
    }
  });

  // API - Add Brand
  app.post("/api/brands", (req, res) => {
    const db = readDb();
    const brand = req.body;

    if (!brand.id) {
      const lastId = db.Thuong_hieu.reduce((max, b) => {
        const num = parseInt(b.id.replace("TH", ""));
        return num > max ? num : max;
      }, 0);
      brand.id = `TH${String(lastId + 1).padStart(3, "0")}`;
      db.Thuong_hieu.push(brand);
    } else {
      const index = db.Thuong_hieu.findIndex(b => b.id === brand.id);
      if (index !== -1) {
        db.Thuong_hieu[index] = { ...db.Thuong_hieu[index], ...brand };
      } else {
        db.Thuong_hieu.push(brand);
      }
    }

    const success = writeDb(db);
    if (success) {
      res.json({ success: true, data: brand });
    } else {
      res.status(500).json({ success: false, message: "Lưu thương hiệu thất bại!" });
    }
  });


  // Serve static UI assets or mount Vite dev server
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[POS Server] Running on http://0.0.0.0:${PORT} (Production: ${process.env.NODE_ENV === "production"})`);
  });
}

startServer();
