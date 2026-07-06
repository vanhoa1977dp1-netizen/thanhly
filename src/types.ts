export interface ShopInfo {
  ten_shop: string;
  dia_chi: string;
  dien_thoai: string;
  email: string;
  website: string;
  slogan: string;
  doanh_thu_doi_diem?: number;
  gia_tri_1_diem?: number;
}

export interface BankAccount {
  id: string;
  ten_ngan_hang: string;
  so_tai_khoan: string;
  chu_tai_khoan: string;
  chi_nhanh: string;
}

export interface ProductCategory {
  id: string;
  ten_nhom: string;
  mo_ta: string;
}

export interface Brand {
  id: string;
  ten_thuong_hieu: string;
  quoc_gia: string;
}

export interface Employee {
  id: string;
  ho_ten: string;
  chuc_vu: string;
  so_dien_thoai: string;
  email: string;
  tai_khoan: string;
  quyen_han: 'ADMIN' | 'STAFF';
  trang_thai: string;
  mat_khau?: string;
}

export interface Customer {
  id: string;
  ho_ten: string;
  so_dien_thoai: string;
  email: string;
  dia_chi: string;
  loai_khach: string;
  diem_tich_luy: number;
  tong_chi_tieu: number;
  cong_no?: number;
}

export interface Supplier {
  id: string;
  ten_nha_cung_cap: string;
  nguoi_lien_he: string;
  so_dien_thoai: string;
  email: string;
  dia_chi: string;
  cong_no_hien_tai: number;
}

export interface Product {
  id: string;
  ten_san_pham: string;
  id_nhom_hang: string;
  id_thuong_hieu: string;
  gia_von: number;
  gia_ban: number;
  ton_kho: number;
  don_vi_tinh: string;
  bar_code: string;
  trang_thai: string;
  tich_diem?: boolean;
  ban_truc_tiep?: boolean;
  ngay_tao?: string;
  id_nha_cung_cap?: string;
  hinh_anh?: string;
}

export interface InvoiceDetail {
  id_sp: string;
  so_luong: number;
  don_gia: number;
  thanh_tien: number;
}

export interface Invoice {
  id: string;
  ngay_lap: string;
  id_khach_hang: string;
  id_nhan_vien: string;
  chi_tiet_san_pham: InvoiceDetail[];
  tong_tien_hang: number;
  giam_gia: number;
  khach_can_tra: number;
  khach_da_tra: number;
  phuong_thuc_thanh_toan: string;
  points_deducted?: number;
  trang_thai: string;
}

export interface ReturnDetail {
  id_sp: string;
  so_luong: number;
  gia_tra: number;
  thanh_tien: number;
}

export interface ReturnOrder {
  id: string;
  id_hoa_don_goc: string;
  ngay_tra: string;
  id_khach_hang: string;
  chi_tiet_tra_hang: ReturnDetail[];
  tong_tien_tra: number;
  ly_do_tra: string;
  hinh_thuc_hoan_tien: string;
  id_nhan_vien_nhan: string;
}

export interface ImportDetail {
  id_sp: string;
  so_luong: number;
  gian_nhap: number;
  thanh_tien: number;
}

export interface ImportOrder {
  id: string;
  ngay_nhap: string;
  id_nha_cung_cap: string;
  id_nhan_vien: string;
  chi_tiet_nhap: ImportDetail[];
  tong_tien_nhap: number;
  da_thanh_toan: number;
  con_no: number;
  trang_thai: string;
  phuong_thuc_thanh_toan?: string;
}

export interface ReturnSupplierDetail {
  id_sp: string;
  so_luong: number;
  gia_tra_lai: number;
  thanh_tien: number;
}

export interface ReturnSupplierOrder {
  id: string;
  id_phieu_nhap_goc: string;
  id_nha_cung_cap: string;
  ngay_tra: string;
  id_nhan_vien_thuc_hien: string;
  chi_tiet_tra: ReturnSupplierDetail[];
  tong_tien_ncc_hoan: number;
  tinh_trang_hoan_tien: string;
  ly_do_tra: string;
  phuong_thuc_thanh_toan?: string;
}

export interface OverviewStats {
  doanh_thu_thang_nay: number;
  so_don_hang_thang_nay: number;
  tong_so_khach_hang: number;
  tong_so_san_pham_he_thong: number;
  gia_tri_ton_kho_hien_tai: number;
  cap_nhat_cuoi_cung: string;
}

export interface DatabaseSchema {
  Thong_tin_shop: ShopInfo;
  Ngan_hang: BankAccount[];
  Nhom_hang: ProductCategory[];
  Thuong_hieu: Brand[];
  Nhan_vien: Employee[];
  Khach_hang: Customer[];
  Nha_cung_cap: Supplier[];
  San_pham: Product[];
  Hoa_don: Invoice[];
  Tra_hang: ReturnOrder[];
  Nhap_hang: ImportOrder[];
  Tra_hang_NCC: ReturnSupplierOrder[];
  Tong_quan: OverviewStats;
}
