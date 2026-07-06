import React, { useState } from "react";
import { X, User, Phone, MapPin, Mail, Award } from "lucide-react";
import { Customer } from "../types";

interface AddCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (customer: Omit<Customer, "id" | "diem_tich_luy" | "tong_chi_tieu">) => void;
}

export default function AddCustomerModal({ isOpen, onClose, onSave }: AddCustomerModalProps) {
  const [hoTen, setHoTen] = useState("");
  const [soDienThoai, setSoDienThoai] = useState("");
  const [email, setEmail] = useState("");
  const [diaChi, setDiaChi] = useState("");
  const [loaiKhach, setLoaiKhach] = useState("Thành viên");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hoTen.trim()) return alert("Vui lòng nhập họ tên khách hàng!");
    if (!soDienThoai.trim()) return alert("Vui lòng nhập số điện thoại!");

    onSave({
      ho_ten: hoTen.trim(),
      so_dien_thoai: soDienThoai.trim(),
      email: email.trim() || "chua_cap_nhat@gmail.com",
      dia_chi: diaChi.trim() || "Chưa cập nhật",
      loai_khach: loaiKhach
    });

    // Reset state
    setHoTen("");
    setSoDienThoai("");
    setEmail("");
    setDiaChi("");
    setLoaiKhach("Thành viên");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-lg bg-white shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between bg-emerald-600 px-4 py-3 text-white">
          <h3 className="flex items-center gap-2 font-medium">
            <User className="h-5 w-5" />
            Thêm Khách Hàng Mới
          </h3>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-white/20 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Họ và tên *</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <User className="h-4 w-4" />
              </span>
              <input
                type="text"
                required
                placeholder="Nguyễn Văn A"
                value={hoTen}
                onChange={(e) => setHoTen(e.target.value)}
                className="w-full rounded-md border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Số điện thoại *</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <Phone className="h-4 w-4" />
              </span>
              <input
                type="text"
                required
                placeholder="0912345678"
                value={soDienThoai}
                onChange={(e) => setSoDienThoai(e.target.value)}
                className="w-full rounded-md border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <Mail className="h-4 w-4" />
              </span>
              <input
                type="email"
                placeholder="khachhang@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Địa chỉ</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <MapPin className="h-4 w-4" />
              </span>
              <input
                type="text"
                placeholder="Số nhà, đường, phường/xã..."
                value={diaChi}
                onChange={(e) => setDiaChi(e.target.value)}
                className="w-full rounded-md border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Nhóm khách hàng</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <Award className="h-4 w-4" />
              </span>
              <select
                value={loaiKhach}
                onChange={(e) => setLoaiKhach(e.target.value)}
                className="w-full rounded-md border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-emerald-500 focus:outline-hidden bg-white"
              >
                <option value="Thành viên">Thành viên</option>
                <option value="VIP">Khách hàng VIP</option>
                <option value="Đại lý">Đại lý</option>
                <option value="Khách vãng lai">Khách vãng lai</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2 pt-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-hidden"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 focus:outline-hidden"
            >
              Lưu khách hàng
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
