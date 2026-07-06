import React, { useState } from "react";
import {
  Briefcase,
  Plus,
  Shield,
  Trash2,
  Edit2
} from "lucide-react";
import { DatabaseSchema, Employee } from "../types";

interface NhanvienProps {
  data: DatabaseSchema;
  onRefreshData: () => void;
}

export default function Nhanvien({ data, onRefreshData }: NhanvienProps) {
  const [newEmpName, setNewEmpName] = useState("");
  const [newEmpRole, setNewEmpRole] = useState("Nhân viên");
  const [newEmpUsername, setNewEmpUsername] = useState("");
  const [newEmpPhone, setNewEmpPhone] = useState("");
  const [newEmpPermission, setNewEmpPermission] = useState<"STAFF" | "ADMIN">("STAFF");
  const [newEmpEmail, setNewEmpEmail] = useState("");
  const [newEmpPassword, setNewEmpPassword] = useState("");
  const [newEmpStatus, setNewEmpStatus] = useState("Đang hoạt động");
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmpName.trim()) return;
    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingEmployee ? editingEmployee.id : undefined,
          ho_ten: newEmpName.trim(),
          chuc_vu: newEmpRole.trim() || "Nhân viên",
          so_dien_thoai: newEmpPhone.trim(),
          email: newEmpEmail.trim(),
          tai_khoan: newEmpUsername.trim(),
          quyen_han: newEmpPermission,
          trang_thai: editingEmployee ? newEmpStatus : "Đang hoạt động",
          mat_khau: newEmpPassword.trim() || undefined
        })
      });
      if ((await res.json()).success) {
        setNewEmpName("");
        setNewEmpRole("Nhân viên");
        setNewEmpPhone("");
        setNewEmpEmail("");
        setNewEmpUsername("");
        setNewEmpPermission("STAFF");
        setNewEmpPassword("");
        setNewEmpStatus("Đang hoạt động");
        setEditingEmployee(null);
        onRefreshData();
      }
    } catch (e) {
      console.error(e);
      alert(editingEmployee ? "Lỗi khi cập nhật nhân viên" : "Lỗi khi thêm nhân viên");
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa nhân viên này (${id}) khỏi hệ thống?`)) return;

    const updated = { ...data };
    updated.Nhan_vien = updated.Nhan_vien.filter(emp => emp.id !== id);

    try {
      const res = await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated)
      });
      if ((await res.json()).success) {
        onRefreshData();
      } else {
        alert("Xóa thất bại!");
      }
    } catch (e) {
      console.error(e);
      alert("Lỗi kết nối máy chủ");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-blue-500" />
            Đội ngũ nhân sự & Thu ngân
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Quản lý hồ sơ nhân viên, phân quyền hạn ADMIN/STAFF và trạng thái hoạt động.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Left Side: Staff List */}
        <div className="xl:col-span-3 bg-white rounded-xl shadow-xs border overflow-hidden">
          <div className="p-4 border-b bg-gray-50/50">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Danh sách nhân sự ({data.Nhan_vien.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b text-gray-500 font-semibold bg-gray-50/50">
                  <th className="py-2.5 px-4 w-20">Mã NV</th>
                  <th className="py-2.5 px-4">Họ và Tên</th>
                  <th className="py-2.5 px-4">Chức vụ & Tài khoản</th>
                  <th className="py-2.5 px-4">Mật khẩu</th>
                  <th className="py-2.5 px-4">Liên hệ</th>
                  <th className="py-2.5 px-4 text-center">Quyền hạn</th>
                  <th className="py-2.5 px-4 text-center">Trạng thái</th>
                  <th className="py-2.5 px-4 text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y text-gray-700">
                {data.Nhan_vien.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-2.5 px-4 font-mono font-bold text-blue-600">{emp.id}</td>
                    <td className="py-2.5 px-4 font-bold text-gray-900">{emp.ho_ten}</td>
                    <td className="py-2.5 px-4">
                      <div className="space-y-0.5">
                        <span className="block font-medium text-slate-700">{emp.chuc_vu}</span>
                        <span className="block font-mono text-[10px] text-gray-400">
                          ID: {emp.tai_khoan}
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-gray-600 text-[11px] font-bold">
                        {emp.mat_khau || "123456"}
                      </span>
                    </td>
                    <td className="py-2.5 px-4">
                      <div className="space-y-0.5 font-mono text-[11px]">
                        <span className="block text-gray-600">{emp.so_dien_thoai}</span>
                        {emp.email && (
                          <span className="block text-gray-400 font-sans text-[10px]">
                            {emp.email}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                          emp.quyen_han === "ADMIN"
                            ? "bg-red-50 text-red-600 border border-red-100"
                            : "bg-blue-50 text-blue-600 border border-blue-100"
                        }`}
                      >
                        {emp.quyen_han}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full font-semibold text-[10px] border ${
                        emp.trang_thai === "Đang hoạt động" 
                          ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                          : "bg-amber-50 text-amber-600 border-amber-100"
                      }`}>
                        {emp.trang_thai}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingEmployee(emp);
                            setNewEmpName(emp.ho_ten);
                            setNewEmpRole(emp.chuc_vu);
                            setNewEmpPhone(emp.so_dien_thoai);
                            setNewEmpEmail(emp.email || "");
                            setNewEmpUsername(emp.tai_khoan);
                            setNewEmpPermission(emp.quyen_han);
                            setNewEmpPassword(emp.mat_khau || "123456");
                            setNewEmpStatus(emp.trang_thai);
                          }}
                          className="p-1 rounded-full text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                          title="Sửa thông tin & Mật khẩu"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteEmployee(emp.id)}
                          className="p-1 rounded-full text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Xóa nhân viên"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Side: Create and Role Permissions */}
        <div className="space-y-6">
          {/* Form Tạo Mới / Cập nhật */}
          <div className="bg-white rounded-xl shadow-xs border p-4 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 border-b pb-2">
              {editingEmployee ? <Edit2 className="h-4 w-4 text-amber-500" /> : <Plus className="h-4 w-4 text-blue-500" />}
              {editingEmployee ? `Cập nhật NV: ${editingEmployee.id}` : "Tạo nhân sự mới"}
            </h3>
            <form onSubmit={handleAddEmployee} className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-500 mb-1 font-medium">Họ và tên nhân viên *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Nguyễn Thị B..."
                  value={newEmpName}
                  onChange={(e) => setNewEmpName(e.target.value)}
                  className="w-full rounded-md border border-gray-300 py-1.5 px-2.5 focus:border-blue-500 focus:outline-hidden bg-white text-gray-800"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-500 mb-1 font-medium">Chức vụ</label>
                  <input
                    type="text"
                    placeholder="Thu ngân, Kho..."
                    value={newEmpRole}
                    onChange={(e) => setNewEmpRole(e.target.value)}
                    className="w-full rounded-md border border-gray-300 py-1.5 px-2.5 focus:border-blue-500 focus:outline-hidden bg-white text-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-gray-500 mb-1 font-medium">Tên tài khoản</label>
                  <input
                    type="text"
                    placeholder="Username..."
                    required
                    value={newEmpUsername}
                    onChange={(e) => setNewEmpUsername(e.target.value)}
                    className="w-full rounded-md border border-gray-300 py-1.5 px-2.5 focus:border-blue-500 focus:outline-hidden bg-white text-gray-800 font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-500 mb-1 font-medium">Số điện thoại</label>
                  <input
                    type="text"
                    placeholder="SĐT..."
                    value={newEmpPhone}
                    onChange={(e) => setNewEmpPhone(e.target.value)}
                    className="w-full rounded-md border border-gray-300 py-1.5 px-2.5 focus:border-blue-500 focus:outline-hidden bg-white text-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-gray-500 mb-1 font-medium">Phân quyền</label>
                  <select
                    value={newEmpPermission}
                    onChange={(e) => setNewEmpPermission(e.target.value as any)}
                    className="w-full rounded-md border border-gray-300 py-1.5 px-2 bg-white text-gray-800 focus:border-blue-500"
                  >
                    <option value="STAFF">STAFF (Nhân viên)</option>
                    <option value="ADMIN">ADMIN (Quản lý)</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-500 mb-1 font-medium">Mật khẩu *</label>
                  <input
                    type="text"
                    required
                    placeholder="Mật khẩu đăng nhập"
                    value={newEmpPassword}
                    onChange={(e) => setNewEmpPassword(e.target.value)}
                    className="w-full rounded-md border border-gray-300 py-1.5 px-2.5 focus:border-blue-500 focus:outline-hidden bg-white text-gray-800 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-gray-500 mb-1 font-medium">Email liên hệ</label>
                  <input
                    type="email"
                    placeholder="Email..."
                    value={newEmpEmail}
                    onChange={(e) => setNewEmpEmail(e.target.value)}
                    className="w-full rounded-md border border-gray-300 py-1.5 px-2.5 focus:border-blue-500 focus:outline-hidden bg-white text-gray-800"
                  />
                </div>
              </div>

              {editingEmployee && (
                <div>
                  <label className="block text-gray-500 mb-1 font-medium">Trạng thái làm việc</label>
                  <select
                    value={newEmpStatus}
                    onChange={(e) => setNewEmpStatus(e.target.value)}
                    className="w-full rounded-md border border-gray-300 py-1.5 px-2 bg-white text-gray-800 focus:border-blue-500"
                  >
                    <option value="Đang hoạt động">Đang hoạt động</option>
                    <option value="Đã nghỉ việc">Đã nghỉ việc</option>
                  </select>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  className={`flex-1 font-bold py-2 rounded-lg shadow-sm cursor-pointer transition-colors uppercase tracking-wider text-[10px] text-white ${
                    editingEmployee ? "bg-emerald-600 hover:bg-emerald-700" : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {editingEmployee ? "Cập nhật nhân viên" : "Thêm nhân viên mới"}
                </button>
                {editingEmployee && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingEmployee(null);
                      setNewEmpName("");
                      setNewEmpRole("Nhân viên");
                      setNewEmpPhone("");
                      setNewEmpEmail("");
                      setNewEmpUsername("");
                      setNewEmpPermission("STAFF");
                      setNewEmpPassword("");
                      setNewEmpStatus("Đang hoạt động");
                    }}
                    className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-3 rounded-lg shadow-sm cursor-pointer transition-colors uppercase tracking-wider text-[10px]"
                  >
                    Hủy
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Phân Quyền hạn */}
          <div className="bg-white rounded-xl shadow-xs border p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 border-b pb-2">
              <Shield className="h-4 w-4 text-emerald-500" />
              Chi tiết Phân Quyền Hạn
            </h3>
            <div className="space-y-3 text-xs text-gray-600">
              <div className="space-y-1">
                <span className="font-bold text-red-600 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> ADMIN (Quản lý)
                </span>
                <p className="text-[10.5px] leading-relaxed text-gray-500 pl-2.5">
                  Có toàn quyền truy cập toàn bộ hệ thống: xem doanh thu báo cáo, quản lý nhân sự,
                  thiết lập cửa hàng, sửa đổi đơn giá hàng hóa.
                </p>
              </div>
              <div className="space-y-1">
                <span className="font-bold text-blue-600 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> STAFF (Thu ngân/Kho)
                </span>
                <p className="text-[10.5px] leading-relaxed text-gray-500 pl-2.5">
                  Được sử dụng giao diện Màn hình Bán hàng (POS), xem danh mục sản phẩm, tạo phiếu
                  nhập hàng, lập hóa đơn thanh toán cho khách lẻ.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
