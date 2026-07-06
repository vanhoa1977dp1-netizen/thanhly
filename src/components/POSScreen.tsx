import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  RotateCcw,
  RefreshCw,
  Printer,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  User,
  Settings,
  Calendar,
  Check,
  DollarSign,
  Zap,
  Clock,
  HelpCircle,
  MessageSquare,
  QrCode,
  Sparkles,
  Barcode, ShoppingBag,
  ArrowRight,
  LogOut,
  X,
  CreditCard,
  Wallet,
  Smartphone,
  Edit
} from "lucide-react";
import { motion, AnimatePresence } from 'motion/react';
import { DatabaseSchema, Product, Customer, Employee, Invoice, BankAccount, ReturnOrder } from "../types";
import AddCustomerModal from "./AddCustomerModal";
import { DraftReceiptModal } from "./Inbill";

const formatNumberWithDots = (val: number | undefined | null): string => {
  if (val === undefined || val === null || isNaN(val)) return "";
  return new Intl.NumberFormat("vi-VN").format(val);
};

const parseNumberFromDots = (str: string): number => {
  const clean = str.replace(/\./g, "").replace(/\D/g, "");
  return parseInt(clean, 10) || 0;
};

const getSuggestedCashDenominations = (dueAmount: number): number[] => {
  if (dueAmount <= 0) return [];
  const denominations = [1000, 2000, 5000, 10000, 20000, 50000, 100000, 200000, 500000, 1000000];
  const suggestionsSet = new Set<number>();
  
  // Standard denominations > dueAmount
  for (const denom of denominations) {
    if (denom > dueAmount) {
      suggestionsSet.add(denom);
    }
  }

  // If dueAmount is larger than 500k, suggest custom rounded values
  if (dueAmount >= 500000) {
    const customOptions = [
      Math.ceil(dueAmount / 10000) * 10000,
      Math.ceil(dueAmount / 20000) * 20000,
      Math.ceil(dueAmount / 50000) * 50000,
      Math.ceil(dueAmount / 100000) * 100000,
      Math.ceil(dueAmount / 200000) * 200000,
      Math.ceil(dueAmount / 500000) * 500000,
      Math.ceil(dueAmount / 1000000) * 1000000,
    ];
    for (const opt of customOptions) {
      if (opt > dueAmount) {
        suggestionsSet.add(opt);
      }
    }
  }

  // Convert to sorted array and limit to 5 suggestions
  return Array.from(suggestionsSet).sort((a, b) => a - b).slice(0, 5);
};

const getItemUnitPrice = (item: { product: Product; customPrice?: number }) => {
  return item.customPrice !== undefined ? item.customPrice : item.product.gia_ban;
};

const getItemSellingPrice = (item: { product: Product; customPrice?: number; discount: number; discountType?: "VND" | "%" }) => {
  const unitPrice = getItemUnitPrice(item);
  const discountType = item.discountType || "VND";
  const discount = item.discount || 0;
  if (discountType === "%") {
    return Math.max(0, unitPrice - (unitPrice * discount / 100));
  } else {
    return Math.max(0, unitPrice - discount);
  }
};

const getInvoiceItemsTotal = (items: { product: Product; quantity: number; discount: number; customPrice?: number; discountType?: "VND" | "%" }[]) => {
  return items.reduce((sum, item) => sum + (getItemSellingPrice(item) * item.quantity), 0);
};

interface POSScreenProps {
  data: DatabaseSchema;
  onCheckoutSuccess: (invoice: Invoice) => void;
  onReturnSuccess?: (returnOrder: ReturnOrder) => void;
  onAddCustomer: (customer: Omit<Customer, "id" | "diem_tich_luy" | "tong_chi_tieu">) => Promise<Customer>;
  onRefreshData: () => void;
  onToggleScreen: () => void; // Switch between POS and Admin
}

interface InvoiceTab {
  id: number;
  name: string;
  items: {
    rowId?: string;
    product: Product;
    quantity: number;
    discount: number; // custom discount per product item
    customPrice?: number; // custom unit price
    discountType?: "VND" | "%"; // discount type
  }[];
  selectedCustomer: Customer | null;
  discountAmount: number; // global bill discount
  paidAmount: number; // cash customer gave
  paymentMethod: "Tiền mặt" | "Chuyển khoản" | "Thẻ" | "Ví";
  note: string;
  isReturn?: boolean;
  originalInvoiceId?: string;
  returnItems?: {
    product: Product;
    quantity: number;
    maxQuantity: number;
    gia_tra: number;
  }[];
  pointsDeduction?: number; // point deduction in VND
  usePoints?: boolean; // toggle points usage
  refundType?: "Tiền thừa trả khách" | "Tính vào công nợ";
  isPosConfirmed?: boolean;
  customDate?: string;
}

const getLocalISOString = (date: Date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export default function POSScreen({
  data,
  onCheckoutSuccess,
  onReturnSuccess,
  onAddCustomer,
  onRefreshData,
  onToggleScreen
}: POSScreenProps) {
  const [invoices, setInvoices] = useState<InvoiceTab[]>(() => {
    const saved = localStorage.getItem("pos_invoices");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.error("Error parsing invoices from localStorage", e);
      }
    }
    return [
      {
        id: 1,
        name: "Hóa đơn 1",
        items: [],
        selectedCustomer: null,
        discountAmount: 0,
        paidAmount: 0,
        paymentMethod: "Tiền mặt",
        note: "",
        pointsDeduction: 0,
        usePoints: false
      }
    ];
  });
  const [activeTabId, setActiveTabId] = useState<number>(() => {
    const savedActiveTabId = localStorage.getItem("pos_active_tab_id");
    if (savedActiveTabId) {
      const parsed = parseInt(savedActiveTabId, 10);
      if (!isNaN(parsed)) {
        return parsed;
      }
    }
    return 1;
  });

  // Persist invoices and active tab to localStorage on change
  useEffect(() => {
    localStorage.setItem("pos_invoices", JSON.stringify(invoices));
  }, [invoices]);

  useEffect(() => {
    localStorage.setItem("pos_active_tab_id", activeTabId.toString());
  }, [activeTabId]);
  const [productSearch, setProductSearch] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  
  // Staff change login states
  const [showEmployeeLoginModal, setShowEmployeeLoginModal] = useState(false);
  const [employeeToVerify, setEmployeeToVerify] = useState<any>(null);
  const [employeePasswordInput, setEmployeePasswordInput] = useState("");
  const [employeeLoginError, setEmployeeLoginError] = useState("");
  
  // Return Goods states
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returnSearchId, setReturnSearchId] = useState("");
  const [returnSearchCustName, setReturnSearchCustName] = useState("");
  const [returnSearchCustPhone, setReturnSearchCustPhone] = useState("");
  const [returnSearchFromDate, setReturnSearchFromDate] = useState("");
  const [returnSearchToDate, setReturnSearchToDate] = useState("");

  // Modals state
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isDraftReceiptOpen, setIsDraftReceiptOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrModalType, setQrModalType] = useState<"Tiền mặt" | "Chuyển khoản" | "Thẻ" | "Ví" | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingItemPosition, setEditingItemPosition] = useState<{ top: number; left: number } | null>(null);
  
  // Tabs "Bán nhanh" vs "Bán thường"
  const [saleMode, setSaleMode] = useState<"Bán nhanh" | "Bán thường">("Bán nhanh");
  
  // Real-time clock formatted exactly as shown: 17/06/2026 19:12
  const [currentTime, setCurrentTime] = useState("");

  // Search dropdown popups
  const [showProductResults, setShowProductResults] = useState(false);
  const [showCustomerResults, setShowCustomerResults] = useState(false);

  // Input elements refs for hotkeys focus
  const productSearchRef = useRef<HTMLInputElement>(null);
  const customerSearchRef = useRef<HTMLInputElement>(null);

  // Refs for checking click-outside to close product search and customer search
  const productSearchContainerRef = useRef<HTMLDivElement>(null);
  const customerSearchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        productSearchContainerRef.current &&
        !productSearchContainerRef.current.contains(event.target as Node)
      ) {
        setShowProductResults(false);
      }
      if (
        customerSearchContainerRef.current &&
        !customerSearchContainerRef.current.contains(event.target as Node)
      ) {
        setShowCustomerResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Scrollable tabs states
  const [showScrollLeft, setShowScrollLeft] = useState(false);
  const [showScrollRight, setShowScrollRight] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);
  const tabsContainerRef = useRef<HTMLDivElement>(null);

  const checkScroll = () => {
    const container = tabsContainerRef.current;
    if (container) {
      const { scrollLeft, scrollWidth, clientWidth } = container;
      setHasOverflow(scrollWidth > clientWidth + 3);
      setShowScrollLeft(scrollLeft > 1);
      setShowScrollRight(scrollLeft + clientWidth < scrollWidth - 1);
    }
  };

  const scrollTabs = (direction: "left" | "right") => {
    const container = tabsContainerRef.current;
    if (container) {
      const scrollAmount = 200;
      container.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth"
      });
    }
  };

  useEffect(() => {
    const container = tabsContainerRef.current;
    if (container) {
      container.addEventListener("scroll", checkScroll);
      window.addEventListener("resize", checkScroll);
      checkScroll();
    }
    return () => {
      if (container) {
        container.removeEventListener("scroll", checkScroll);
      }
      window.removeEventListener("resize", checkScroll);
    };
  }, [invoices]);

  useEffect(() => {
    const timer = setTimeout(checkScroll, 100);
    return () => clearTimeout(timer);
  }, [invoices, activeTabId]);

  useEffect(() => {
    // Clock updates
    const updateTime = () => {
      const now = new Date();
      const dd = String(now.getDate()).padStart(2, "0");
      const mm = String(now.getMonth() + 1).padStart(2, "0");
      const yyyy = now.getFullYear();
      const hh = String(now.getHours()).padStart(2, "0");
      const min = String(now.getMinutes()).padStart(2, "0");
      setCurrentTime(`${dd}/${mm}/${yyyy} ${hh}:${min}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 30000); // every 30s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Set default staff
    if (data.Nhan_vien && data.Nhan_vien.length > 0 && !selectedEmployeeId) {
      setSelectedEmployeeId(data.Nhan_vien[0].id);
    }
  }, [data.Nhan_vien]);

  const handleEmployeeChange = (empId: string) => {
    const targetEmployee = data.Nhan_vien.find(emp => emp.id === empId);
    if (targetEmployee) {
      setEmployeeToVerify(targetEmployee);
      setEmployeePasswordInput("");
      setEmployeeLoginError("");
      setShowEmployeeLoginModal(true);
    }
  };

  // Bind F3, F4, F10 Hotkeys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F3") {
        e.preventDefault();
        productSearchRef.current?.focus();
      } else if (e.key === "F4") {
        e.preventDefault();
        customerSearchRef.current?.focus();
      } else if (e.key === "F10") {
        e.preventDefault();
        handleCheckout();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [invoices, activeTabId, selectedEmployeeId]);

  // Get current active invoice tab state
  const activeInvoice = invoices.find(inv => inv.id === activeTabId) || invoices[0];

  // Helper to update active invoice properties
  const updateActiveInvoice = (updater: (inv: InvoiceTab) => InvoiceTab) => {
    setInvoices(prev => prev.map(inv => {
      if (inv.id === activeTabId) {
        return updater(inv);
      }
      return inv;
    }));
  };

  // Add items
  const addProductToInvoice = (product: Product) => {
    updateActiveInvoice(inv => {
      const existingItemIndex = inv.items.findIndex(item => item.product.id === product.id);
      let updatedItems = [...inv.items];

      if (existingItemIndex !== -1) {
        // Move existing item to top and increment quantity
        const existingItem = updatedItems[existingItemIndex];
        const updatedItem = {
          ...existingItem,
          quantity: existingItem.quantity + 1
        };
        updatedItems.splice(existingItemIndex, 1);
        updatedItems.unshift(updatedItem);
      } else {
        // Add new item to top
        updatedItems.unshift({
          rowId: `row_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          product,
          quantity: 1,
          discount: 0
        });
      }

      // Calculate total for paidAmount auto default
      const totalAmount = getInvoiceItemsTotal(updatedItems);
      const LOYALTY_POINT_VALUE = 500;
      const maxPoints = (inv.selectedCustomer?.diem_tich_luy || 0) * LOYALTY_POINT_VALUE;
      const allowedDeduction = Math.max(0, totalAmount - inv.discountAmount);
      const actualDeduction = inv.usePoints ? Math.min(inv.pointsDeduction || 0, maxPoints, allowedDeduction) : 0;
      const neededToPay = Math.max(0, totalAmount - inv.discountAmount - actualDeduction);

      return {
        ...inv,
        items: updatedItems,
        pointsDeduction: actualDeduction,
        paidAmount: neededToPay // auto pre-populate paidAmount
      };
    });
    setProductSearch("");
    setShowProductResults(false);
  };

  // Duplicate product as a new row
  const addProductRowToInvoice = (product: Product) => {
    updateActiveInvoice(inv => {
      const newItem = {
        rowId: `row_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        product,
        quantity: 1,
        discount: 0
      };
      const updatedItems = [newItem, ...inv.items];

      const totalAmount = getInvoiceItemsTotal(updatedItems);
      const LOYALTY_POINT_VALUE = 500;
      const maxPoints = (inv.selectedCustomer?.diem_tich_luy || 0) * LOYALTY_POINT_VALUE;
      const allowedDeduction = Math.max(0, totalAmount - inv.discountAmount);
      const actualDeduction = inv.usePoints ? Math.min(inv.pointsDeduction || 0, maxPoints, allowedDeduction) : 0;
      const neededToPay = Math.max(0, totalAmount - inv.discountAmount - actualDeduction);

      return {
        ...inv,
        items: updatedItems,
        pointsDeduction: actualDeduction,
        paidAmount: neededToPay
      };
    });
  };

  // Remove items using rowId/productId
  const removeProductFromInvoice = (targetId: string) => {
    updateActiveInvoice(inv => {
      const updatedItems = inv.items.filter(item => {
        const itemRowId = item.rowId || item.product.id;
        return itemRowId !== targetId;
      });
      const totalAmount = getInvoiceItemsTotal(updatedItems);
      const LOYALTY_POINT_VALUE = 500;
      const maxPoints = (inv.selectedCustomer?.diem_tich_luy || 0) * LOYALTY_POINT_VALUE;
      const allowedDeduction = Math.max(0, totalAmount - inv.discountAmount);
      const actualDeduction = inv.usePoints ? Math.min(inv.pointsDeduction || 0, maxPoints, allowedDeduction) : 0;
      const neededToPay = Math.max(0, totalAmount - inv.discountAmount - actualDeduction);
      return {
        ...inv,
        items: updatedItems,
        pointsDeduction: actualDeduction,
        paidAmount: neededToPay
      };
    });
  };

  // Adjust Quantity using rowId/productId
  const adjustQuantity = (targetId: string, delta: number) => {
    updateActiveInvoice(inv => {
      const updatedItems = inv.items.map(item => {
        const itemRowId = item.rowId || item.product.id;
        if (itemRowId === targetId) {
          const newQty = Math.max(1, item.quantity + delta);
          return { ...item, quantity: newQty };
        }
        return item;
      });
      const totalAmount = getInvoiceItemsTotal(updatedItems);
      const LOYALTY_POINT_VALUE = 500;
      const maxPoints = (inv.selectedCustomer?.diem_tich_luy || 0) * LOYALTY_POINT_VALUE;
      const allowedDeduction = Math.max(0, totalAmount - inv.discountAmount);
      const actualDeduction = inv.usePoints ? Math.min(inv.pointsDeduction || 0, maxPoints, allowedDeduction) : 0;
      const neededToPay = Math.max(0, totalAmount - inv.discountAmount - actualDeduction);
      return {
        ...inv,
        items: updatedItems,
        pointsDeduction: actualDeduction,
        paidAmount: neededToPay
      };
    });
  };

  const setItemQuantityDirectly = (targetId: string, val: number) => {
    if (val < 1) val = 1;
    updateActiveInvoice(inv => {
      const updatedItems = inv.items.map(item => {
        const itemRowId = item.rowId || item.product.id;
        if (itemRowId === targetId) {
          return { ...item, quantity: val };
        }
        return item;
      });
      const totalAmount = getInvoiceItemsTotal(updatedItems);
      const LOYALTY_POINT_VALUE = 500;
      const maxPoints = (inv.selectedCustomer?.diem_tich_luy || 0) * LOYALTY_POINT_VALUE;
      const allowedDeduction = Math.max(0, totalAmount - inv.discountAmount);
      const actualDeduction = inv.usePoints ? Math.min(inv.pointsDeduction || 0, maxPoints, allowedDeduction) : 0;
      const neededToPay = Math.max(0, totalAmount - inv.discountAmount - actualDeduction);
      return {
        ...inv,
        items: updatedItems,
        pointsDeduction: actualDeduction,
        paidAmount: neededToPay
      };
    });
  };

  // Helper to update invoice item price/discount properties using rowId/productId
  const updateInvoiceItemPrice = (
    targetId: string,
    fields: { customPrice?: number; discount?: number; discountType?: "VND" | "%" }
  ) => {
    updateActiveInvoice(inv => {
      const updatedItems = inv.items.map(item => {
        const itemRowId = item.rowId || item.product.id;
        if (itemRowId === targetId) {
          const newItem = { ...item, ...fields };
          const unitPrice = newItem.customPrice !== undefined ? newItem.customPrice : newItem.product.gia_ban;
          if (newItem.discountType === "%") {
            if (newItem.discount !== undefined) {
              newItem.discount = Math.min(100, Math.max(0, newItem.discount));
            }
          } else {
            if (newItem.discount !== undefined) {
              newItem.discount = Math.min(unitPrice, Math.max(0, newItem.discount));
            }
          }
          return newItem;
        }
        return item;
      });

      const totalAmount = getInvoiceItemsTotal(updatedItems);
      const LOYALTY_POINT_VALUE = 500;
      const maxPoints = (inv.selectedCustomer?.diem_tich_luy || 0) * LOYALTY_POINT_VALUE;
      const allowedDeduction = Math.max(0, totalAmount - inv.discountAmount);
      const actualDeduction = inv.usePoints ? Math.min(inv.pointsDeduction || 0, maxPoints, allowedDeduction) : 0;
      const neededToPay = Math.max(0, totalAmount - inv.discountAmount - actualDeduction);

      return {
        ...inv,
        items: updatedItems,
        pointsDeduction: actualDeduction,
        paidAmount: neededToPay
      };
    });
  };

  // Helper to update invoice item line total directly using rowId/productId
  const updateInvoiceItemLineTotalDirectly = (targetId: string, finalLineTotal: number) => {
    updateActiveInvoice(inv => {
      const updatedItems = inv.items.map(item => {
        const itemRowId = item.rowId || item.product.id;
        if (itemRowId === targetId) {
          const qty = item.quantity || 1;
          const targetSellingPrice = Math.max(0, finalLineTotal / qty);
          const unitPrice = item.customPrice !== undefined ? item.customPrice : item.product.gia_ban;
          
          if (targetSellingPrice > unitPrice) {
            return {
              ...item,
              customPrice: targetSellingPrice,
              discount: 0,
              discountType: "VND" as const
            };
          } else {
            const discountVal = unitPrice - targetSellingPrice;
            return {
              ...item,
              discount: discountVal,
              discountType: "VND" as const
            };
          }
        }
        return item;
      });

      const totalAmount = getInvoiceItemsTotal(updatedItems);
      const LOYALTY_POINT_VALUE = 500;
      const maxPoints = (inv.selectedCustomer?.diem_tich_luy || 0) * LOYALTY_POINT_VALUE;
      const allowedDeduction = Math.max(0, totalAmount - inv.discountAmount);
      const actualDeduction = inv.usePoints ? Math.min(inv.pointsDeduction || 0, maxPoints, allowedDeduction) : 0;
      const neededToPay = Math.max(0, totalAmount - inv.discountAmount - actualDeduction);

      return {
        ...inv,
        items: updatedItems,
        pointsDeduction: actualDeduction,
        paidAmount: neededToPay
      };
    });
  };

  // Helper to update invoice item selling price directly using rowId/productId
  const updateInvoiceItemSellingPriceDirectly = (targetId: string, finalSellingPrice: number) => {
    updateActiveInvoice(inv => {
      const updatedItems = inv.items.map(item => {
        const itemRowId = item.rowId || item.product.id;
        if (itemRowId === targetId) {
          const unitPrice = item.customPrice !== undefined ? item.customPrice : item.product.gia_ban;
          const targetSellingPrice = Math.max(0, Math.min(unitPrice, finalSellingPrice));
          const discountVal = unitPrice - targetSellingPrice;
          
          return {
            ...item,
            discount: discountVal,
            discountType: "VND" as const
          };
        }
        return item;
      });

      const totalAmount = getInvoiceItemsTotal(updatedItems);
      const LOYALTY_POINT_VALUE = 500;
      const maxPoints = (inv.selectedCustomer?.diem_tich_luy || 0) * LOYALTY_POINT_VALUE;
      const allowedDeduction = Math.max(0, totalAmount - inv.discountAmount);
      const actualDeduction = inv.usePoints ? Math.min(inv.pointsDeduction || 0, maxPoints, allowedDeduction) : 0;
      const neededToPay = Math.max(0, totalAmount - inv.discountAmount - actualDeduction);

      return {
        ...inv,
        items: updatedItems,
        pointsDeduction: actualDeduction,
        paidAmount: neededToPay
      };
    });
  };

  const openPriceAdjustment = (e: React.MouseEvent<HTMLButtonElement>, rowId: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const panelWidth = 270; 
    const panelHeight = 280; 

    let left = rect.right - panelWidth;
    if (left < 10) {
      left = Math.max(10, rect.left);
    }
    if (left + panelWidth > viewportWidth - 10) {
      left = viewportWidth - panelWidth - 10;
    }

    let top = rect.bottom + 6;
    if (top + panelHeight > viewportHeight - 10) {
      top = Math.max(10, rect.top - panelHeight - 6);
    }

    setEditingItemId(rowId);
    setEditingItemPosition({ top, left });
  };

  // Open / Add tabs
  const addNewTab = () => {
    const newId = invoices.length > 0 ? Math.max(...invoices.map(i => i.id)) + 1 : 1;
    const newInvoice: InvoiceTab = {
      id: newId,
      name: `Hóa đơn ${newId}`,
      items: [],
      selectedCustomer: null,
      discountAmount: 0,
      paidAmount: 0,
      paymentMethod: "Tiền mặt",
      note: "",
      pointsDeduction: 0,
      usePoints: false
    };
    setInvoices([...invoices, newInvoice]);
    setActiveTabId(newId);
  };

  // Close tabs
  const closeTab = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();

    const targetInvoice = invoices.find(inv => inv.id === id);
    if (targetInvoice && targetInvoice.items.length > 0) {
      alert(`Hóa đơn "${targetInvoice.name}" đang có sản phẩm, không thể đóng/xóa tab!`);
      return;
    }

    if (invoices.length === 1) {
      // Just clear instead of deleting the last tab
      setInvoices([
        {
          id: 1,
          name: "Hóa đơn 1",
          items: [],
          selectedCustomer: null,
          discountAmount: 0,
          paidAmount: 0,
          paymentMethod: "Tiền mặt",
          note: ""
        }
      ]);
      setActiveTabId(1);
      return;
    }

    const remaining = invoices.filter(inv => inv.id !== id);
    setInvoices(remaining);
    
    if (activeTabId === id) {
      setActiveTabId(remaining[remaining.length - 1].id);
    }
  };

  // Filter products on search
  const filteredProducts = data.San_pham.filter(p => {
    const q = productSearch.toLowerCase().trim();
    if (!q) return false;
    return (
      p.ten_san_pham.toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q) ||
      p.bar_code.includes(q)
    );
  });

  // Filter customers on search
  const filteredCustomers = data.Khach_hang.filter(c => {
    const q = customerSearch.toLowerCase().trim();
    if (!q) return false;
    return (
      c.ho_ten.toLowerCase().includes(q) ||
      c.so_dien_thoai.includes(q) ||
      c.id.toLowerCase().includes(q)
    );
  });

  // Quick Customer Save
  const handleQuickSaveCustomer = async (cust: Omit<Customer, "id" | "diem_tich_luy" | "tong_chi_tieu">) => {
    try {
      const saved = await onAddCustomer(cust);
      updateActiveInvoice(inv => ({
        ...inv,
        selectedCustomer: saved
      }));
      setCustomerSearch("");
      setIsCustomerModalOpen(false);
    } catch (e) {
      console.error(e);
      alert("Không thể lưu thông tin khách hàng");
    }
  };

  // Compute Invoice Financial summary
  const totalBillCost = getInvoiceItemsTotal(activeInvoice.items);
  const totalReturn = activeInvoice.isReturn
    ? (activeInvoice.returnItems || []).reduce((sum, item) => sum + (item.gia_tra * item.quantity), 0)
    : 0;

  const netBalance = activeInvoice.isReturn
    ? totalBillCost - totalReturn - activeInvoice.discountAmount
    : totalBillCost - activeInvoice.discountAmount;

  const LOYALTY_POINT_VALUE = 500; // 1 điểm = 500 đ
  const maxPointsAvailable = (activeInvoice.selectedCustomer?.diem_tich_luy || 0) * LOYALTY_POINT_VALUE;
  const maxDeductionAllowed = Math.max(0, totalBillCost - activeInvoice.discountAmount);
  const actualPointsDeduction = activeInvoice.usePoints
    ? Math.min(maxPointsAvailable, activeInvoice.pointsDeduction || 0, maxDeductionAllowed)
    : 0;

  const netDue = activeInvoice.isReturn
    ? (netBalance >= 0 ? netBalance : 0)
    : Math.max(0, totalBillCost - activeInvoice.discountAmount - actualPointsDeduction);

  const changeDue = activeInvoice.isReturn
    ? (netBalance >= 0 ? Math.max(0, activeInvoice.paidAmount - netBalance) : 0)
    : Math.max(0, activeInvoice.paidAmount - netDue);

  const isCartEmpty = activeInvoice.isReturn
    ? (((activeInvoice.returnItems || []).filter(item => item.quantity > 0).length === 0) && activeInvoice.items.length === 0)
    : activeInvoice.items.length === 0;

  const editingItem = activeInvoice.items.find(item => (item.rowId || item.product.id) === editingItemId);

  useEffect(() => {
    // Sync refundType automatically based on payment vs due
    const hasMore = activeInvoice.paidAmount > netDue;
    const hasLess = activeInvoice.paidAmount < netDue;
    if (hasMore && activeInvoice.refundType !== "Tiền thừa trả khách") {
      setInvoices(prev => prev.map(inv => inv.id === activeTabId ? { ...inv, refundType: "Tiền thừa trả khách" } : inv));
    } else if (hasLess && activeInvoice.refundType !== "Tính vào công nợ") {
      setInvoices(prev => prev.map(inv => inv.id === activeTabId ? { ...inv, refundType: "Tính vào công nợ" } : inv));
    }
  }, [activeInvoice.paidAmount, netDue, activeInvoice.refundType, activeTabId]);

  // Submit checkout
  const handleCheckout = async () => {
    if (activeInvoice.isReturn) {
      const validReturnItems = (activeInvoice.returnItems || []).filter(item => item.quantity > 0);
      if (validReturnItems.length === 0 && activeInvoice.items.length === 0) {
        alert("Vui lòng nhập số lượng trả hoặc chọn sản phẩm mua mới!");
        return;
      }

      // 1. Submit Return portion if there are items returned
      let returnSuccess = true;
      let returnRecord = null;
      if (validReturnItems.length > 0) {
        const returnPayload = {
          id_hoa_don_goc: activeInvoice.originalInvoiceId || "",
          id_khach_hang: activeInvoice.selectedCustomer?.id || "KH000001",
          chi_tiet_tra_hang: validReturnItems.map(item => ({
            id_sp: item.product.id,
            so_luong: item.quantity,
            gia_tra: item.gia_tra,
            thanh_tien: item.gia_tra * item.quantity
          })),
          tong_tien_tra: totalReturn,
          ly_do_tra: activeInvoice.note || "Khách đổi hàng trả tại quầy",
          hinh_thuc_hoan_tien: activeInvoice.paymentMethod,
          id_nhan_vien_nhan: selectedEmployeeId || "NV001",
          ngay_tra: activeInvoice.customDate ? new Date(activeInvoice.customDate).toISOString() : new Date().toISOString()
        };

        try {
          const res = await fetch("/api/return", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(returnPayload)
          });
          const result = await res.json();
          if (result.success) {
            returnRecord = result.data;
          } else {
            alert("Lưu phiếu trả hàng thất bại: " + result.message);
            returnSuccess = false;
          }
        } catch (e) {
          console.error(e);
          alert("Lỗi kết nối khi lưu phiếu trả hàng.");
          returnSuccess = false;
        }
      }

      if (!returnSuccess) return;

      // 2. Submit New Purchase portion if there are new items
      let purchaseSuccess = true;
      let purchaseRecord = null;
      if (activeInvoice.items.length > 0) {
        const purchasePayload = {
          id_khach_hang: activeInvoice.selectedCustomer?.id || "KH000001",
          id_nhan_vien: selectedEmployeeId || "NV001",
          chi_tiet_san_pham: activeInvoice.items.map(item => ({
            id_sp: item.product.id,
            so_luong: item.quantity,
            don_gia: item.product.gia_ban,
            thanh_tien: item.product.gia_ban * item.quantity
          })),
          tong_tien_hang: totalBillCost,
          giam_gia: activeInvoice.discountAmount,
          khach_can_tra: netDue,
          khach_da_tra: netDue > 0 ? activeInvoice.paidAmount : 0,
          phuong_thuc_thanh_toan: activeInvoice.paymentMethod,
          ngay_lap: activeInvoice.customDate ? new Date(activeInvoice.customDate).toISOString() : new Date().toISOString()
        };

        try {
          const res = await fetch("/api/sale", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(purchasePayload)
          });
          const result = await res.json();
          if (result.success) {
            purchaseRecord = result.data;
          } else {
            alert("Lưu hóa đơn mua mới thất bại: " + result.message);
            purchaseSuccess = false;
          }
        } catch (e) {
          console.error(e);
          alert("Lỗi kết nối khi lưu hóa đơn mua mới.");
          purchaseSuccess = false;
        }
      }

      if (!purchaseSuccess) return;

      alert("Đã thực hiện giao dịch đổi trả hàng thành công!");
      
      // Trigger standard invoice view for purchase portion if purchased
      if (purchaseRecord) {
        onCheckoutSuccess(purchaseRecord);
      } else if (returnRecord) {
        onReturnSuccess?.(returnRecord);
      }

      // Close this return tab
      if (invoices.length === 1) {
        setInvoices([
          {
            id: 1,
            name: "Hóa đơn 1",
            items: [],
            selectedCustomer: null,
            discountAmount: 0,
            paidAmount: 0,
            paymentMethod: "Tiền mặt",
            note: ""
          }
        ]);
        setActiveTabId(1);
      } else {
        const remaining = invoices.filter(inv => inv.id !== activeInvoice.id);
        setInvoices(remaining);
        setActiveTabId(remaining[remaining.length - 1].id);
      }
      return;
    }

    if (activeInvoice.items.length === 0) {
      alert("Vui lòng thêm sản phẩm vào hóa đơn trước khi thanh toán!");
      return;
    }

    const payload = {
      id_khach_hang: activeInvoice.selectedCustomer?.id || "KH000001", // fallback to default
      id_nhan_vien: selectedEmployeeId || "NV001",
      chi_tiet_san_pham: activeInvoice.items.map(item => ({
        id_sp: item.product.id,
        so_luong: item.quantity,
        don_gia: item.product.gia_ban,
        thanh_tien: item.product.gia_ban * item.quantity
      })),
      tong_tien_hang: totalBillCost,
      giam_gia: activeInvoice.discountAmount,
      khach_can_tra: netDue,
      khach_da_tra: activeInvoice.paidAmount,
      phuong_thuc_thanh_toan: activeInvoice.paymentMethod,
      points_deducted: Math.floor(actualPointsDeduction / LOYALTY_POINT_VALUE),
      ngay_lap: activeInvoice.customDate ? new Date(activeInvoice.customDate).toISOString() : new Date().toISOString()
    };

    try {
      const res = await fetch("/api/sale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      if (result.success) {
        // Callback parent with the full created Invoice record to open Receipt Modal
        onCheckoutSuccess(result.data);

        // Reset current invoice tab and refresh data
        updateActiveInvoice(inv => ({
          ...inv,
          items: [],
          selectedCustomer: null,
          discountAmount: 0,
          paidAmount: 0,
          paymentMethod: "Tiền mặt",
          note: "",
          pointsDeduction: 0,
          usePoints: false
        }));
      } else {
        alert("Giao dịch thanh toán thất bại: " + result.message);
      }
    } catch (e) {
      console.error(e);
      alert("Lỗi kết nối tới máy chủ khi thanh toán.");
    }
  };

  // Filter invoices for returns based on search state variables
  const filteredInvoicesForReturn = (data.Hoa_don || []).filter((invoice) => {
    if (returnSearchId.trim() && !invoice.id.toLowerCase().includes(returnSearchId.toLowerCase().trim())) {
      return false;
    }
    const cust = data.Khach_hang.find((c) => c.id === invoice.id_khach_hang);
    const custName = cust ? cust.ho_ten.toLowerCase() : "";
    const custPhone = cust ? cust.so_dien_thoai : "";

    if (returnSearchCustName.trim() && !custName.includes(returnSearchCustName.toLowerCase().trim())) {
      return false;
    }
    if (returnSearchCustPhone.trim() && !custPhone.includes(returnSearchCustPhone.trim())) {
      return false;
    }
    if (invoice.ngay_lap) {
      const invDateStr = invoice.ngay_lap.split("T")[0]; // YYYY-MM-DD
      if (returnSearchFromDate && invDateStr < returnSearchFromDate) {
        return false;
      }
      if (returnSearchToDate && invDateStr > returnSearchToDate) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="flex flex-col h-screen bg-[#eef1f5] text-sm font-sans overflow-hidden pos-container">
      
      {/* CSS Styles to hide the scrollbars dynamically and support short/narrow viewports */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
        @media (max-height: 740px) {
          .pos-container {
            height: auto !important;
            min-height: 740px;
            overflow: auto !important;
          }
          .pos-workspace {
            height: auto !important;
            overflow: visible !important;
          }
        }
        @media (max-width: 1024px) {
          .pos-container {
            width: auto !important;
            min-width: 1024px;
            overflow-x: auto !important;
          }
          .pos-workspace {
            overflow: visible !important;
          }
        }
      `}</style>

      {/* 1. Header (Blue Top Bar) */}
      <header className="flex items-center justify-between bg-blue-600 text-white px-4 py-1 shrink-0 shadow-md">
        
        {/* Left: Product Search and Invoice Tabs */}
        <div className="flex items-center gap-4 flex-1 max-w-[80%] min-w-0">
          {/* F3 Search Input */}
          <div ref={productSearchContainerRef} className="relative w-120 shrink-0">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-white/70">
              <Search className="h-4 w-4" />
            </div>
            <input
              ref={productSearchRef}
              type="text"
              placeholder="Tìm hàng hóa (F3)"
              value={productSearch}
              onChange={(e) => {
                const val = e.target.value;
                setProductSearch(val);
                setShowProductResults(true);

                // Auto add on exact match of ID or Barcode
                const cleanVal = val.trim();
                if (cleanVal) {
                  const matchedProduct = data.San_pham.find(p => 
                    p.id.toLowerCase() === cleanVal.toLowerCase() || 
                    (p.bar_code && p.bar_code.toLowerCase() === cleanVal.toLowerCase())
                  );
                  if (matchedProduct) {
                    addProductToInvoice(matchedProduct);
                  }
                }
              }}
              onFocus={() => setShowProductResults(true)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const cleanVal = productSearch.trim();
                  if (cleanVal) {
                    // Try to find exact match
                    const matchedProduct = data.San_pham.find(p => 
                      p.id.toLowerCase() === cleanVal.toLowerCase() || 
                      (p.bar_code && p.bar_code.toLowerCase() === cleanVal.toLowerCase())
                    );
                    if (matchedProduct) {
                      addProductToInvoice(matchedProduct);
                    } else if (filteredProducts.length > 0) {
                      // If no exact match but there are filtered products, add the first one
                      addProductToInvoice(filteredProducts[0]);
                    }
                  }
                }
              }}
              className="w-full bg-white/20 hover:bg-white/35 focus:bg-white text-white focus:text-gray-900 rounded-md py-2 px-9 placeholder-white/80 focus:placeholder-gray-400 text-base focus:outline-hidden transition-all border border-transparent focus:border-white"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-white/50">
              <Barcode className="h-4 w-4" />
            </div>

            {/* Product search results list */}
            {showProductResults && productSearch.trim() && (
              <div className="absolute left-0 mt-1.5 w-[450px] bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-80 overflow-y-auto text-gray-800">
                {/* <div className="flex justify-between items-center bg-gray-50 px-3 py-1.5 border-b text-[11px] font-semibold text-gray-500">
                  <span>Sản phẩm tìm thấy ({filteredProducts.length})</span>
                  <button onClick={() => setShowProductResults(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="h-3 w-3" />
                  </button>
                </div> */}
                {filteredProducts.length === 0 ? (
                  <div className="p-4 text-center text-xs text-gray-400">Không tìm thấy sản phẩm nào trùng khớp</div>
                ) : (
                  filteredProducts.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => addProductToInvoice(p)}
                      className="flex items-center justify-between px-3 py-2 border-b border-gray-50 hover:bg-blue-100 cursor-pointer transition-colors"
                    >
                      <div>
                        <div className=" text-base text-black">{p.ten_san_pham}</div>
                        <div className="text-[14px] text-gray-900 font-mono flex items-center gap-2 mt-1.5">
                          <span>{p.id}</span>
                          <span>|</span>
                          <span className={p.ton_kho > 0 ? "text-emerald-600" : "text-rose-500"}>Tồn: {p.ton_kho}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-base font-bold text-blue-600">{new Intl.NumberFormat("vi-VN").format(p.gia_ban)}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Invoice Tabs container */}
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            {/* Left Scroll Button */}
            {showScrollLeft && (
              <button
                onClick={() => scrollTabs("left")}
                className="bg-blue-800/80 hover:bg-blue-900 text-white rounded-md p-1.5 transition-colors shrink-0 shadow-xs cursor-pointer flex items-center justify-center h-8 w-8"
                title="Cuộn sang trái"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            )}

            {/* Scrollable container */}
            <div
              ref={tabsContainerRef}
              className="flex items-end gap-1.5 overflow-x-auto no-scrollbar select-none flex-1 scroll-smooth h-10"
            >
              {invoices.map((inv) => (
                <div
                  key={inv.id}
                  onClick={() => setActiveTabId(inv.id)}
                  className={`flex shrink-0 items-center gap-2 px-4 py-2 text-xs font-semibold rounded-t-lg cursor-pointer transition-all border-t-2 h-9 ${
                    activeTabId === inv.id
                      ? "bg-white text-gray-900 border-[#ff9100]"
                      : "bg-blue-700/50 hover:bg-blue-700 text-white/90 border-transparent"
                  }`}
                >
                  <span>{inv.name}</span>
                  <button
                    onClick={(e) => closeTab(inv.id, e)}
                    className="rounded-full p-0.5 hover:bg-gray-200 hover:text-gray-900 transition-all ml-1"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}

              {/* Add Tab (+) Button inside if no overflow, positioned near last tab */}
              {!hasOverflow && (
                <button
                  onClick={addNewTab}
                  className="bg-white/20 hover:bg-white/35 text-white rounded-full p-1.5 transition-colors shrink-0 flex items-center justify-center shadow-xs cursor-pointer mb-1 h-8 w-8"
                  title="Mở thêm hóa đơn"
                >
                  <Plus className="h-4.5 w-4.5" />
                </button>
              )}
            </div>

            {/* Right Scroll Button */}
            {showScrollRight && (
              <button
                onClick={() => scrollTabs("right")}
                className="bg-blue-800/80 hover:bg-blue-900 text-white rounded-md p-1.5 transition-colors shrink-0 shadow-xs cursor-pointer flex items-center justify-center h-8 w-8"
                title="Cuộn sang phải"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            )}

            {/* Add Tab (+) Button always visible when hasOverflow is true, standing right after the right scroll button */}
            {hasOverflow && (
              <button
                onClick={addNewTab}
                className="bg-white/20 hover:bg-white/35 text-white rounded-full p-1.5 transition-colors shrink-0 flex items-center justify-center shadow-xs cursor-pointer ml-1 h-8 w-8"
                title="Mở thêm hóa đơn"
              >
                <Plus className="h-4.5 w-4.5" />
              </button>
            )}
          </div>
        </div>

        {/* Right: Return, Refresh, Print, Admin Panel Access */}
        <div className="flex items-center gap-2 shrink-0">
          {/* TRẢ HÀNG BUTTON */}
          <button
            onClick={() => setIsReturnModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 hover:border-rose-300 rounded transition-all cursor-pointer shadow-sm select-none"
            title="Chọn hóa đơn để khách trả hàng"
          >
            <RotateCcw className="h-3.5 w-3.5 text-rose-500" />
            <span>Trả Hàng</span>
          </button>

          {/* User & Admin mode toggle */}
          <button
            onClick={onToggleScreen}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-md transition-colors"
            title="Quản lý & cài đặt"
          >
            <Settings className="h-4 w-4 text-amber-400" />
          </button>

          <button
            onClick={() => {
              if (confirm("Bạn có muốn xóa sạch các mặt hàng trong hóa đơn này?")) {
                updateActiveInvoice(inv => ({
                  ...inv,
                  items: [],
                  selectedCustomer: null,
                  discountAmount: 0,
                  paidAmount: 0,
                  paymentMethod: "Tiền mặt",
                  note: ""
                }));
              }
            }}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-md transition-colors"
            title="Xóa nháp hóa đơn"
          >
            <Trash2 className="h-4 w-4" />
          </button>

          {/* <button
            onClick={() => window.print()}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-md transition-colors"
            title="In màn hình POS"
          >
            <Printer className="h-4 w-4" />
          </button> */}

          <div className="flex items-center gap-1 text-xs font-semibold pl-1 border-l border-white/25">
            <span className="bg-emerald-500 rounded-full w-5 h-5 flex items-center justify-center text-[10px] uppercase font-mono tracking-tighter shadow-xs">ly</span>
            <span className="hidden md:inline font-medium opacity-90">Thanh Ly Shop</span>
          </div>
        </div>
      </header>

      {/* 2. Main Workspace (split Left List & Right Checkout) */}
      <div className="flex flex-1 overflow-hidden pos-workspace">
        
        {/* LEFT WORKSPACE (~75% width) */}
        <div className="flex-1 flex flex-col overflow-hidden p-2">
          
          {/* Selected Products Table List */}
          <div className="flex-1 bg-white rounded-lg shadow-xs overflow-hidden flex flex-col border border-gray-200">
            {activeInvoice.isReturn ? (
              // 2-part return view: returned items on top, purchased items on bottom
              <div className="flex-1 overflow-y-auto p-3 space-y-4">
                {/* 1. Returned Items Section (TOP) */}
                <div className="bg-rose-50/20 rounded-lg border border-rose-200 p-3">
                  <div className="flex justify-between items-center border-b border-rose-200 pb-2 mb-3 bg-rose-50/50 -m-3 p-3 rounded-t-lg">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-rose-700 flex items-center gap-1.5">
                      <RotateCcw className="h-4 w-4" />
                      Sản phẩm khách trả lại (Hóa đơn gốc: <span className="font-mono">{activeInvoice.originalInvoiceId}</span>)
                    </h4>
                    <span className="text-[10px] bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full font-bold">
                      HÓA ĐƠN TRẢ
                    </span>
                  </div>
                  {/* Tab hoá đơn trả hàng phần hoá đơn trả*/}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs min-w-[700px]">
                      <thead>
                        <tr className="border-b border-rose-200 text-slate-900 font-mono bg-rose-50/30">
                          <th className="py-2 px-3 w-10 text-center">STT</th>
                          <th className="py-2 px-2 w-24">Mã hàng</th>
                          <th className="py-2 px-2">Tên hàng hóa</th>
                          <th className="py-2 pr-14 w-30 text-center">Đã mua</th>
                          <th className="py-2 px-2 w-28 text-left">Giá mua</th>
                          <th className="py-2 px-2 w-32 text-center">Số lượng trả</th>
                          <th className="py-2 px-2 w-28 text-right">Thành tiền trả</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-rose-100">
                        {(activeInvoice.returnItems || []).map((retItem, idx) => (
                          <tr key={retItem.product.id} className="hover:bg-rose-50/10 transition-colors">
                            <td className="py-2 px-3 text-center text-sm  text-slate-900 font-mono">{idx + 1}</td>
                            <td className="py-2 px-2 text-sm text-slate-900">{retItem.product.id}</td>
                            <td className="py-2 px-2 text-sm text-slate-900">{retItem.product.ten_san_pham}</td>
                            <td className="py-2 pr-14 text-center text-sm text-slate-900">{retItem.maxQuantity}</td>
                            <td className="py-2 px-2 text-left text-sm text-slate-900">
                              {new Intl.NumberFormat("vi-VN").format(retItem.gia_tra)}
                            </td>
                            <td className="py-2 px-8 text-center">
                              <div className="inline-flex items-center border border-gray-300 rounded-md bg-white shadow-2xs">
                                <button
                                  onClick={() => {
                                    updateActiveInvoice(inv => ({
                                      ...inv,
                                      returnItems: (inv.returnItems || []).map(ri => {
                                        if (ri.product.id === retItem.product.id) {
                                          return { ...ri, quantity: Math.max(0, ri.quantity - 1) };
                                        }
                                        return ri;
                                      })
                                    }));
                                  }}
                                  className="px-1.5 py-0.5 text-gray-500 hover:bg-gray-100 active:bg-gray-200 transition-colors cursor-pointer"
                                >
                                  <Minus className="h-3 w-3" />
                                </button>
                                <input
                                  type="number"
                                  min="0"
                                  max={retItem.maxQuantity}
                                  value={retItem.quantity}
                                  onChange={(e) => {
                                    const val = Math.min(retItem.maxQuantity, Math.max(0, parseInt(e.target.value) || 0));
                                    updateActiveInvoice(inv => ({
                                      ...inv,
                                      returnItems: (inv.returnItems || []).map(ri => {
                                        if (ri.product.id === retItem.product.id) {
                                          return { ...ri, quantity: val };
                                        }
                                        return ri;
                                      })
                                    }));
                                  }}
                                  className="w-10 text-center text-sm text-slate-900 focus:outline-hidden"
                                />
                                <button
                                  onClick={() => {
                                    updateActiveInvoice(inv => ({
                                      ...inv,
                                      returnItems: (inv.returnItems || []).map(ri => {
                                        if (ri.product.id === retItem.product.id) {
                                          return { ...ri, quantity: Math.min(ri.maxQuantity, ri.quantity + 1) };
                                        }
                                        return ri;
                                      })
                                    }));
                                  }}
                                  className="px-1.5 py-0.5 text-gray-500 hover:bg-gray-100 active:bg-gray-200 transition-colors cursor-pointer"
                                >
                                  <Plus className="h-3 w-3" />
                                </button>
                              </div>
                            </td>
                            <td className="py-2 px-2 text-right text-sm text-slate-900">
                              {new Intl.NumberFormat("vi-VN").format(retItem.gia_tra * retItem.quantity)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {/* <div className="flex justify-end mt-2 text-base text-rose-700">
                    Tổng tiền trả hàng: {new Intl.NumberFormat("vi-VN").format((activeInvoice.returnItems || []).reduce((sum, item) => sum + (item.gia_tra * item.quantity), 0))}
                  </div> */}
                </div>

                {/* 2. Newly Purchased Items Section (BOTTOM) Tab hoá đơn trả hàng phần hoá đơn mua hàng */}
                <div className="bg-sky-50/10 rounded-lg border border-sky-100 p-3">
                  <div className="flex justify-between items-center border-b border-sky-200 pb-2 mb-3 bg-sky-50/50 -m-3 p-3 rounded-t-lg">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-sky-800 flex items-center gap-1.5">
                      <ShoppingBag className="h-4 w-4" />
                      Sản phẩm mua mới (Mua thêm / Đổi trả hàng)
                    </h4>
                    <span className="text-[10px] bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full font-bold">
                      MUA MỚI
                    </span>
                  </div>

                  {/* Tab Hoá đơn trả hàng phần mua mới */}
                  {activeInvoice.items.length === 0 ? (
                    <div className="py-6 text-center text-gray-400 bg-gray-50/30 rounded-md border border-dashed border-gray-200 text-xs">
                      Chưa thêm sản phẩm mua mới. Sử dụng thanh tìm kiếm (F3) để thêm sản phẩm mua mới.
                      <p className="text-[10px] text-gray-400 mt-1 font-medium">Hệ thống cho phép trả hàng mà không cần mua hàng mới.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto p-1">
                      <div className="flex flex-col min-w-[700px] gap-y-0"> {/* gap-y-3 tạo khoảng cách giữa các block sản phẩm khác nhau */}
                        {/* Bước 1: Gom nhóm các item có cùng product.id lại với nhau */}
                        {(() => {
                          const grouped = (Object.values(
                            activeInvoice.items.reduce<Record<string, any[]>>((acc, item) => {
                              const pId = item.product.id;
                              if (!acc[pId]) acc[pId] = [];
                              acc[pId].push(item);
                              return acc;
                            }, {})
                          ) as any[][]);
                          return grouped.map((groupItems, groupIndex) => {
                            // Phần tử đầu tiên trong nhóm đóng vai trò là dòng sản phẩm chính
                            const firstItem = groupItems[0];
                            const mainUniqueRowId = firstItem.rowId || firstItem.product.id;
                            const displayIndex = grouped.length - groupIndex;

                            return (
                              <div
                                key={firstItem.product.id}
                                className="flex flex-col bg-white border border-slate-200 rounded-lg shadow-sm transition-all duration-300 ease-in-out hover:border-blue-500 hover:shadow-[0_0_15px_rgba(59,130,246,0.6)] overflow-hidden"
                              >
                                {/* LẶP QUA CÁC DÒNG BÊN TRONG CỦA SẢN PHẨM NÀY */}
                                {groupItems.map((item, subIndex) => {
                                  const currentUniqueRowId = item.rowId || item.product.id;
                                  const isDuplicateRow = subIndex > 0;

                                  return (
                                    <div
                                      key={currentUniqueRowId}
                                      className={`flex items-center p-2.5 relative ${isDuplicateRow ? "bg-amber-50/5" : ""}`}
                                    >
                                      {/* ĐƯỜNG NÉT ĐỨT PHÂN CÁCH: Chỉ xuất hiện từ dòng thứ 2 trở đi trong khối */}
                                      {isDuplicateRow && (
                                        <div className="absolute top-0 left-4 right-4 border-t border-dashed border-slate-300 pointer-events-none" />
                                      )}

                                      {/* index: Chỉ hiển thị ở dòng đầu tiên của khối */}
                                      <div className="w-10 text-center text-slate-900 font-medium text-sm select-none shrink-0">
                                        {!isDuplicateRow ? displayIndex : ""}
                                      </div>

                                    {/* Trash Action */}
                                    <div className="w-10 text-center shrink-0">
                                      <button
                                        type="button"
                                        onClick={() => removeProductFromInvoice(currentUniqueRowId)}
                                        className="p-1 rounded-full text-slate-900 hover:text-rose-500 transition-colors cursor-pointer"
                                        title="Xóa dòng này"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    </div>

                                    {/* ID code: Chỉ hiển thị ở dòng đầu tiên */}
                                    <div
                                      className="w-36 font-sans text-sm text-slate-900 font-medium shrink-0 px-2 cursor-help"
                                      title={`(Tồn: ${item.product.ton_kho})`}
                                    >
                                      {!isDuplicateRow ? item.product.id : ""}
                                    </div>

                                    {/* Name */}
                                    <div
                                      className="flex-1 min-w-0 font-sans text-base text-slate-900 px-1 cursor-help"
                                      title={`(Tồn: ${item.product.ton_kho})`}
                                    >
                                      {isDuplicateRow ? (
                                        <span className="text-slate-400 italic text-xs flex items-center gap-1 pl-4">
                                        
                                        </span>
                                      ) : (
                                        item.product.ten_san_pham
                                      )}
                                    </div>

                                    {/* Quantity Counter */}
                                    <div
                                      className="w-40 text-center shrink-0 px-3 cursor-help"
                                      title={`(Tồn: ${item.product.ton_kho})`}
                                    >
                                      <div className="inline-flex items-center border border-gray-300 rounded-md bg-white shadow-2xs">
                                        <button
                                          type="button"
                                          onClick={() => adjustQuantity(currentUniqueRowId, -1)}
                                          className="px-1.5 py-1 text-gray-500 hover:bg-gray-100 active:bg-gray-200 transition-colors cursor-pointer"
                                        >
                                          <Minus className="h-3 w-3" />
                                        </button>
                                        <input
                                          type="number"
                                          min="1"
                                          value={item.quantity}
                                          onChange={(e) => setItemQuantityDirectly(currentUniqueRowId, parseInt(e.target.value.replace(/\D/g, "")) || 1)}
                                          className={`w-10 h-6 text-center text-xs focus:outline-hidden ${
                                            item.quantity > item.product.ton_kho ? "text-rose-600 font-semibold" : "text-gray-900"
                                          }`}
                                          title={`(Tồn: ${item.product.ton_kho})`}
                                        />
                                        <button
                                          type="button"
                                          onClick={() => adjustQuantity(currentUniqueRowId, 1)}
                                          className="px-1.5 py-1 text-gray-500 hover:bg-gray-100 active:bg-gray-200 transition-colors cursor-pointer"
                                        >
                                          <Plus className="h-3 w-3" />
                                        </button>
                                      </div>
                                    </div>

                                    {/* Price */}
                                    <div className="w-48 text-left shrink-0 px-3">
                                      <div className="flex flex-col items-center gap-0.5">
                                        <button
                                          type="button"
                                          onClick={(e) => openPriceAdjustment(e, currentUniqueRowId)}
                                          className="text-base text-slate-900 font-mono font-medium cursor-pointer"
                                          title="Nhấp để thay đổi đơn giá"
                                        >
                                          {formatNumberWithDots(getItemUnitPrice(item))}
                                        </button>
                                        {item.discount > 0 && (
                                          <span className="text-[13px] text-rose-500 font-mono border-t border-slate-150">
                                            (-{formatNumberWithDots(item.discount)}{item.discountType === "%" ? "" : ""})
                                          </span>
                                        )}
                                      </div>
                                    </div>

                                    {/* Item Total */}
                                    <div className="w-36 text-right shrink-0 px-3">
                                      <div className="flex justify-end items-center">
                                        <button
                                          type="button"
                                          onClick={(e) => openPriceAdjustment(e, currentUniqueRowId)}
                                          className="px-3 py-1 font-mono text-base text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer text-right min-w-[110px]"
                                          title="Nhấp để thay đổi thành tiền"
                                        >
                                          {new Intl.NumberFormat("vi-VN").format(getItemSellingPrice(item) * item.quantity)}
                                        </button>
                                      </div>
                                    </div>

                                    {/* Extra plus icon: Chỉ hiển thị ở dòng đầu tiên */}
                                    <div className="w-10 text-center shrink-0 px-2">
                                      {!isDuplicateRow && (
                                        <button
                                          type="button"
                                          onClick={() => addProductRowToInvoice(item.product)}
                                          className="text-slate-900 hover:text-slate-700 p-1 rounded-full hover:bg-slate-200 transition-all cursor-pointer"
                                          title="Thêm một dòng sản phẩm chính nó"
                                        >
                                          <Plus className="h-4 w-4" />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        });
                      })()}
                      </div>
                    </div>
                  )}
                  {/* {activeInvoice.items.length > 0 && (
                    <div className="flex justify-end mt-2 text-base text-sky-700">
                      Tổng tiền mua mới: {new Intl.NumberFormat("vi-VN").format(totalBillCost)}
                    </div>
                  )} */}
                </div>
              </div>
            ) : (
              // Empty State (original)
              activeInvoice.items.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-gray-400 bg-gray-50/50 animate-in fade-in duration-200">
                  <div className="p-4 rounded-full bg-blue-50 text-blue-500 mb-3 border border-blue-100">
                    <ShoppingBag className="h-8 w-8" />
                  </div>
                  <h3 className="font-semibold text-gray-400">Chưa có sản phẩm nào trong hóa đơn này</h3>
                  <p className="text-xs text-gray-400 max-w-sm mt-1">
                    Sử dụng thanh tìm kiếm (F3) hoặc máy quét barcode để thêm hàng.
                  </p>
                </div>
              ) : (
                // Active Product Rows Table (original) Tab mua hàng chính thức
                <div className="flex-1 overflow-auto animate-in fade-in duration-200 p-2">
                  <div className="flex flex-col min-w-[700px] gap-y-0"> {/* gap-y-3 tạo khoảng cách giữa các block sản phẩm khác nhau */}
                        {/* Bước 1: Gom nhóm các item có cùng product.id lại với nhau */}
                        {(() => {
                          const grouped = (Object.values(
                            activeInvoice.items.reduce<Record<string, any[]>>((acc, item) => {
                              const pId = item.product.id;
                              if (!acc[pId]) acc[pId] = [];
                              acc[pId].push(item);
                              return acc;
                            }, {})
                          ) as any[][]);
                          return grouped.map((groupItems, groupIndex) => {
                            // Phần tử đầu tiên trong nhóm đóng vai trò là dòng sản phẩm chính
                            const firstItem = groupItems[0];
                            const mainUniqueRowId = firstItem.rowId || firstItem.product.id;
                            const displayIndex = grouped.length - groupIndex;

                            return (
                              <div
                                key={firstItem.product.id}
                                className="flex flex-col bg-white border border-slate-200 rounded-lg shadow-sm transition-all duration-300 ease-in-out hover:border-blue-500 hover:shadow-[0_0_15px_rgba(59,130,246,0.6)] overflow-hidden"
                              >
                                {/* LẶP QUA CÁC DÒNG BÊN TRONG CỦA SẢN PHẨM NÀY */}
                                {groupItems.map((item, subIndex) => {
                                  const currentUniqueRowId = item.rowId || item.product.id;
                                  const isDuplicateRow = subIndex > 0;

                                  return (
                                    <div
                                      key={currentUniqueRowId}
                                      className={`flex items-center p-2.5 relative ${isDuplicateRow ? "bg-amber-50/5" : ""}`}
                                    >
                                      {/* ĐƯỜNG NÉT ĐỨT PHÂN CÁCH: Chỉ xuất hiện từ dòng thứ 2 trở đi trong khối */}
                                      {isDuplicateRow && (
                                        <div className="absolute top-0 left-4 right-4 border-t border-dashed border-slate-300 pointer-events-none" />
                                      )}

                                      {/* index: Chỉ hiển thị ở dòng đầu tiên của khối */}
                                      <div className="w-10 text-center text-slate-900 font-medium text-sm select-none shrink-0">
                                        {!isDuplicateRow ? displayIndex : ""}
                                      </div>

                                {/* Trash Action */}
                                <div className="w-10 text-center shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => removeProductFromInvoice(currentUniqueRowId)}
                                    className="p-1 rounded-full text-slate-900 hover:text-rose-500 transition-colors cursor-pointer"
                                    title="Xóa dòng này"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>

                                {/* ID code: Chỉ hiển thị ở dòng đầu tiên */}
                                <div
                                  className="w-36 font-sans text-sm text-slate-900 font-medium shrink-0 px-2"
                                  title={`Tồn: ${item.product.ton_kho}`}
                                >
                                  {!isDuplicateRow ? item.product.id : ""}
                                </div>

                                {/* Name */}
                                <div
                                  className="flex-1 min-w-0 font-sans text-base text-slate-900 px-1"
                                  title={`Tồn: ${item.product.ton_kho}`}
                                >
                                  {isDuplicateRow ? (
                                    <span className="text-slate-400 italic text-xs flex items-center gap-1 pl-4">
                                    
                                    </span>
                                  ) : (
                                    item.product.ten_san_pham
                                  )}
                                </div>

                                {/* Quantity Counter */}
                                <div
                                  className="w-40 text-center shrink-0 px-3"
                                  title={`Tồn: ${item.product.ton_kho}`}
                                >
                                  <div className="inline-flex items-center border border-gray-300 rounded-md bg-white shadow-2xs">
                                    <button
                                      type="button"
                                      onClick={() => adjustQuantity(currentUniqueRowId, -1)}
                                      className="px-1.5 py-1 text-gray-500 hover:bg-gray-100 active:bg-gray-200 transition-colors cursor-pointer"
                                    >
                                      <Minus className="h-3 w-3" />
                                    </button>
                                    <input
                                      type="number"
                                      min="1"
                                      value={item.quantity}
                                      onChange={(e) => setItemQuantityDirectly(currentUniqueRowId, parseInt(e.target.value.replace(/\D/g, "")) || 1)}
                                      className={`w-10 h-6 text-center text-sm focus:outline-hidden ${
                                        item.quantity > item.product.ton_kho ? "text-rose-600" : "text-gray-900"
                                      }`}
                                      title={`Tồn: ${item.product.ton_kho}`}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => adjustQuantity(currentUniqueRowId, 1)}
                                      className="px-1.5 py-1 text-gray-500 hover:bg-gray-100 active:bg-gray-200 transition-colors cursor-pointer"
                                    >
                                      <Plus className="h-3 w-3" />
                                    </button>
                                  </div>
                                </div>

                                {/* Price */}
                                <div className="w-48 text-left shrink-0 px-3">
                                  <div className="flex flex-col items-center gap-0.5">
                                    <button
                                      type="button"
                                      onClick={(e) => openPriceAdjustment(e, currentUniqueRowId)}
                                      className="text-base text-slate-900 font-mono font-medium cursor-pointer"
                                      title="Nhấp để thay đổi đơn giá"
                                    >
                                      {formatNumberWithDots(getItemUnitPrice(item))}
                                    </button>
                                    {item.discount > 0 && (
                                      <span className="text-[13px] text-rose-500 font-mono border-t border-slate-150">
                                        (-{formatNumberWithDots(item.discount)}{item.discountType === "%" ? "" : ""})
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Item Total */}
                                <div className="w-36 text-right shrink-0 px-3">
                                  <div className="flex justify-end items-center">
                                    <button
                                      type="button"
                                      onClick={(e) => openPriceAdjustment(e, currentUniqueRowId)}
                                      className="px-3 py-1 font-mono text-base text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer text-right min-w-[110px]"
                                      title="Nhấp để thay đổi thành tiền"
                                    >
                                      {new Intl.NumberFormat("vi-VN").format(getItemSellingPrice(item) * item.quantity)}
                                    </button>
                                  </div>
                                </div>

                                {/* Extra plus icon: Chỉ hiển thị ở dòng đầu tiên */}
                                <div className="w-10 text-center shrink-0 px-2">
                                  {!isDuplicateRow && (
                                    <button
                                      type="button"
                                      onClick={() => addProductRowToInvoice(item.product)}
                                      className="text-slate-900 hover:text-slate-700 p-1 rounded-full hover:bg-slate-200 transition-all cursor-pointer"
                                      title="Thêm một dòng sản phẩm chính nó"
                                    >
                                      <Plus className="h-4 w-4" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    });
                  })()}
                  </div>
                </div>
              )
            )}

            {/* Note input area at bottom of grid */}
            <div className="bg-gray-50 border-t p-2 flex items-center gap-2">
              <span className="text-xs font-medium text-gray-500 shrink-0">Ghi chú hóa đơn:</span>
              <input
                type="text"
                placeholder="Ví dụ: Giao hàng lúc 5h chiều, gọi điện trước khi giao..."
                value={activeInvoice.note}
                onChange={(e) => {
                  const val = e.target.value;
                  updateActiveInvoice(inv => ({ ...inv, note: val }));
                }}
                className="flex-1 bg-white border border-gray-200 rounded-md py-1 px-3 text-xs focus:border-blue-500 focus:outline-hidden text-gray-800"
              />
            </div>
          </div>

          {/* Catalog shelves / Bán nhanh shelf at bottom */}
          {/* <div className="bg-white rounded-lg shadow-xs mt-2 border border-gray-200 flex flex-col shrink-0 overflow-hidden">
            <div className="flex justify-between items-center bg-gray-50 border-b px-3.5 py-1.5">
              <div className="flex gap-1.5 select-none">
                <button
                  onClick={() => setSaleMode("Bán nhanh")}
                  className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-md transition-all ${
                    saleMode === "Bán nhanh" ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  <Zap className="h-3.5 w-3.5" />
                  Bán nhanh
                </button>
                <button
                  onClick={() => setSaleMode("Bán thường")}
                  className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-md transition-all ${
                    saleMode === "Bán thường" ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  <Clock className="h-3.5 w-3.5" />
                  Bán thường
                </button>
              </div>
              <div className="text-[11px] text-gray-400 italic">Nhấp vào thẻ sản phẩm để thêm nhanh</div>
            </div>

            {saleMode === "Bán nhanh" && (
              <div className="p-3.5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 max-h-[195px] overflow-y-auto">
                {data.San_pham.map((p) => {
                  const isOutOfStock = p.ton_kho <= 0;
                  return (
                    <div
                      key={p.id}
                      onClick={() => !isOutOfStock && addProductToInvoice(p)}
                      className={`relative group rounded-lg border p-2.5 cursor-pointer select-none transition-all ${
                        isOutOfStock
                          ? "bg-gray-100 border-gray-200 opacity-65 cursor-not-allowed"
                          : "bg-white hover:bg-blue-50/50 hover:border-blue-300 border-gray-200 shadow-3xs active:scale-97"
                      }`}
                    >
                      <div className="text-xs font-semibold text-gray-900 group-hover:text-blue-700 line-clamp-2 min-h-8">
                        {p.ten_san_pham}
                      </div>
                      <div className="flex justify-between items-center mt-1.5">
                        <span className="text-[10px] font-mono text-gray-400">{p.id}</span>
                        <span className={`text-[10px] px-1 rounded-sm ${
                          p.ton_kho > 5 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-500"
                        }`}>
                          Kho: {p.ton_kho}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-blue-600 mt-1">
                        {new Intl.NumberFormat("vi-VN").format(p.gia_ban)} đ
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {saleMode === "Bán thường" && (
              <div className="p-6 text-center text-xs text-gray-400 bg-gray-50/20">
                Chế độ bán thường sử dụng máy quét mã vạch hoặc thanh tìm kiếm F3 ở góc trái trên cùng màn hình.
              </div>
            )}
          </div> */}
        </div>

        {/* RIGHT CHECKOUT SIDEBAR (~25% width) */}
        <aside className="w-[24%] bg-white border-l border-gray-200 flex flex-col overflow-hidden shrink-0">
          
          {/* Top Info: Cashier selector and Real clock time */}
          <div className="p-1.5 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between gap-2 text-xs text-gray-500 shrink-0">
            {/* Staff Selector */}
            <div className="flex items-center gap-1.5 flex-1">
              <User className="h-4 w-4 text-gray-400" />
              <select
                value={selectedEmployeeId}
                onChange={(e) => handleEmployeeChange(e.target.value)}
                className="bg-transparent font-medium text-gray-800 focus:outline-hidden cursor-pointer"
              >
                {data.Nhan_vien.map((emp) => (
                  <option key={emp.id} value={emp.id}>{emp.ho_ten}</option>
                ))}
              </select>
            </div>
            
            {/* Clock / Editable Transaction DateTime */}
            <div className="flex items-center gap-1 text-gray-700 bg-white border border-gray-200 px-2 py-1 rounded-md hover:border-blue-400 focus-within:border-blue-500 transition-colors shadow-2xs">
              <Calendar className="h-3.5 w-3.5 text-blue-500 shrink-0" />
              <input
                type="datetime-local"
                value={activeInvoice.customDate || getLocalISOString()}
                onChange={(e) => {
                  const val = e.target.value;
                  updateActiveInvoice(inv => ({ ...inv, customDate: val }));
                }}
                className="bg-transparent border-none text-[10px] font-medium text-gray-800 focus:outline-hidden cursor-pointer p-0 font-mono w-[130px]"
              />
            </div>
          </div>

          {/* Customer Lookup and Selector Section */}
          <div className="p-0.5 border-b border-gray-100 shrink-0">
            {activeInvoice.selectedCustomer ? (
              // Selected Customer state layout
              
                <div>
                  <div className="w-full bg-[#eef8ff] text-[#007ed3] border border-sky-300 rounded-sm py-0.5 pl-2 pr-2 text-sm font-bold flex items-center justify-between">
                    <User className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="truncate pr-1">{activeInvoice.selectedCustomer.ho_ten}    ({activeInvoice.selectedCustomer.so_dien_thoai})</span>
                    <button
                  onClick={() => updateActiveInvoice(inv => ({ ...inv, selectedCustomer: null }))}
                  className="p-1 rounded-full text-emerald-500 hover:bg-emerald-100 transition-all"
                  title="Bỏ chọn khách"
                >
                  <X className="h-4 w-4" />
                </button>
                  </div>
                  {/* <div className="text-[10px] text-emerald-600 flex items-center gap-2 mt-0.5">
                    <span>SĐT: {activeInvoice.selectedCustomer.so_dien_thoai}</span>
                    <span>|</span>
                    <span>Điểm: {activeInvoice.selectedCustomer.diem_tich_luy}</span>
                  </div> */}
                  {(() => {
                    const customerInvoices = data.Hoa_don.filter((inv) => inv.id_khach_hang === activeInvoice.selectedCustomer?.id);
                    const currentDebt = customerInvoices.reduce((acc, inv) => {
                      const diff = inv.khach_can_tra - inv.khach_da_tra;
                      return acc + (diff > 0 ? diff : 0);
                    }, 0);

                    if (currentDebt <= 0) return null;

                    return (
                      <div className="flex items-center px-1 py-1.5 justify-between">
                        <span className="w-full font-mono text-center text-sm text-rose-600 px-2 py-0.5 border border-rose-400 rounded bg-rose-50 shrink-0">
                          Nợ: {formatNumberWithDots(currentDebt)}
                        </span>
                      </div>
                    );
                  })()}
                </div>
              
            ) : (
              // Search input
              <div ref={customerSearchContainerRef} className="relative flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-gray-400">
                    <Search className="h-4 w-4" />
                  </span>
                  <input
                    ref={customerSearchRef}
                    type="text"
                    placeholder="Tìm khách hàng (F4)"
                    value={customerSearch}
                    onChange={(e) => {
                      setCustomerSearch(e.target.value);
                      setShowCustomerResults(true);
                    }}
                    onFocus={() => setShowCustomerResults(true)}
                    className="w-full rounded-md border border-gray-300 py-1.5 pl-8 pr-3 text-xs focus:border-blue-500 focus:outline-hidden text-gray-800 bg-white"
                  />
                </div>
                <button
                  onClick={() => setIsCustomerModalOpen(true)}
                  className="rounded-md bg-emerald-600 hover:bg-emerald-700 text-white p-1.5 transition-colors"
                  title="Thêm nhanh khách hàng"
                >
                  <Plus className="h-4.5 w-4.5" />
                </button>

                {/* Customer results dropdown */}
                {showCustomerResults && customerSearch.trim() && (
                  <div className="absolute top-8 left-0 w-full bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-52 overflow-y-auto text-gray-800 text-xs">
                    <div className="flex justify-between items-center bg-gray-50 px-2.5 py-1 text-[10px] text-gray-400">
                      <span>Chọn khách hàng</span>
                      <button onClick={() => setShowCustomerResults(false)}>
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                    {filteredCustomers.length === 0 ? (
                      <div className="p-3 text-center text-gray-400">Không tìm thấy khách hàng nào</div>
                    ) : (
                      filteredCustomers.map((c) => (
                        <div
                          key={c.id}
                          onClick={() => {
                            updateActiveInvoice(inv => ({ ...inv, selectedCustomer: c }));
                            setCustomerSearch("");
                            setShowCustomerResults(false);
                          }}
                          className="px-2.5 py-0.5 border-b border-gray-50 hover:bg-blue-50 cursor-pointer text-sm"
                        >
                          <div className="font-semibold text-gray-900 flex justify-between mt-0.5">
                          <span>{c.ho_ten}</span>
                          <span className="text-blue-600 font-bold">{c.so_dien_thoai}</span>
                          </div>
                          <div className="text-[10px] text-gray-400 flex justify-between">
                            <span>Mã: {c.id}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Pricing breakdown Details (Totals, Discount, Due payment) */}
          <div className="flex-1 p-2.5 space-y-2 overflow-y-auto text-sm text-gray-600">
            
            {activeInvoice.isReturn ? (
              // RETURN TRANSACTION PRICING BREAKDOWN Bên phải phần tính tiền bill
              <>
                <div className="flex justify-between items-center">
                  <span className="font-medium text-sm text-black">Tổng mua mới:</span>
                  <span className="text-base text-black pr-2">{new Intl.NumberFormat("vi-VN").format(totalBillCost)}</span>
                </div>
                
                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <span className="font-medium text-sm text-rose-700">Tổng tiền trả lại:</span>
                  <span className=" text-rose-600 text-base pr-2">-{new Intl.NumberFormat("vi-VN").format(totalReturn)}</span>
                </div>

                {/* Discount on the new purchase portion if any */}
                <div className="flex justify-between items-center">
                  <span className="font-medium text-black text-sm">Giảm giá mua mới:</span>
                  <div className="relative max-w-[130px]">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={activeInvoice.discountAmount ? formatNumberWithDots(activeInvoice.discountAmount) : ""}
                      placeholder="0"
                      onChange={(e) => {
                        const numericVal = parseNumberFromDots(e.target.value);
                        const val = Math.min(totalBillCost, Math.max(0, numericVal));
                        const calculatedNetBalance = totalBillCost - totalReturn - val;
                        updateActiveInvoice(inv => ({
                          ...inv,
                          discountAmount: val,
                          paidAmount: calculatedNetBalance >= 0 ? calculatedNetBalance : Math.abs(calculatedNetBalance)
                        }));
                      }}
                      className="w-full text-right text-base rounded-md border border-gray-300 py-1 px-2 focus:border-blue-500 focus:outline-hidden text-black"
                    />
                  </div>
                </div>

                {netBalance >= 0 ? (
                  // Case 1: Customer needs to pay more money
                  <>
                    <div className="flex justify-between items-center border-t border-gray-100 pt-3">
                      <span className="font-bold text-blue-600 text-sm">Khách cần trả thêm:</span>
                      <span className="font-black text-blue-600 text-lg pr-2">{new Intl.NumberFormat("vi-VN").format(netBalance)}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="font-medium text-sm text-slate-900">Khách thanh toán:</span>
                      <div className="relative max-w-[130px]">
                        <input
                          type="text"
                          inputMode="numeric"
                          value={activeInvoice.paidAmount ? formatNumberWithDots(activeInvoice.paidAmount) : ""}
                          placeholder="0"
                          onChange={(e) => {
                            const val = parseNumberFromDots(e.target.value);
                            updateActiveInvoice(inv => ({ ...inv, paidAmount: val }));
                          }}
                          className="w-full text-right text-base rounded-md border border-emerald-500 py-1 px-2 focus:ring-1 focus:ring-emerald-500 focus:outline-hidden text-emerald-700 bg-emerald-50/5"
                        />
                      </div>
                    </div>

                    {/* {activeInvoice.paidAmount > 0 && Math.max(0, activeInvoice.paidAmount - netBalance) > 0 && (
                      <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                        <span className="font-medium text-sm text-black">
                          {activeInvoice.refundType === "Tính vào công nợ" ? "Tính vào công nợ:" : "Tiền thừa trả khách:"}
                        </span>
                        <span className= "text-emerald-600 pr-2 text-sm">{new Intl.NumberFormat("vi-VN").format(Math.max(0, activeInvoice.paidAmount - netBalance))}</span>
                      </div>
                    )} */}
                  </>
                ) : (
                  // Case 2: Shop refunds money to customer
                  <>
                    <div className="flex justify-between items-center border-t border-gray-100 pt-3">
                      <span className="font-bold text-rose-700 text-sm">Tiền thối lại khách:</span>
                      <span className="font-black text-rose-600 pr-2 text-lg">{new Intl.NumberFormat("vi-VN").format(Math.abs(netBalance))}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-700">Đã thối trả khách:</span>
                      <div className="relative max-w-[130px]">
                        <input
                          type="text"
                          inputMode="numeric"
                          value={activeInvoice.paidAmount ? formatNumberWithDots(activeInvoice.paidAmount) : ""}
                          placeholder="0"
                          onChange={(e) => {
                            const val = parseNumberFromDots(e.target.value);
                            updateActiveInvoice(inv => ({ ...inv, paidAmount: val }));
                          }}
                          className="w-full text-right font-bold rounded-md border border-rose-400 py-1 px-2 focus:ring-1 focus:ring-rose-500 focus:outline-hidden text-rose-700 bg-rose-50/5"
                        />
                      </div>
                    </div>

                    <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                      <span className="font-medium text-gray-500">Còn lại cần trả:</span>
                      <span className="font-bold text-gray-600 text-xs">{new Intl.NumberFormat("vi-VN").format(Math.max(0, Math.abs(netBalance) - activeInvoice.paidAmount))}</span>
                    </div>
                  </>
                )}
              </>
            ) : (
              // STANDARD TRANSACTION PRICING BREAKDOWN Cộtt phải bill
              <>
                {/* Total items amount */}
                <div className="flex justify-between items-center">
                  <span className="font-medium">Tổng tiền hàng:</span>
                  <span className="pr-2.5 text-black text-base">{new Intl.NumberFormat("vi-VN").format(totalBillCost)}</span>
                </div>

                {/* Bill Discount input */}
                <div className="flex justify-between items-center">
                  <span className="font-medium">Giảm giá đơn hàng:</span>
                  <div className="relative max-w-[130px]">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={activeInvoice.discountAmount ? formatNumberWithDots(activeInvoice.discountAmount) : ""}
                      placeholder="0"
                      onChange={(e) => {
                        const numericVal = parseNumberFromDots(e.target.value);
                        const val = Math.min(totalBillCost, Math.max(0, numericVal));
                        updateActiveInvoice(inv => {
                          const LOYALTY_POINT_VALUE = 500;
                          const maxPoints = (inv.selectedCustomer?.diem_tich_luy || 0) * LOYALTY_POINT_VALUE;
                          const allowedDeduction = Math.max(0, totalBillCost - val);
                          const actualDeduction = inv.usePoints ? Math.min(inv.pointsDeduction || 0, maxPoints, allowedDeduction) : 0;
                          return {
                            ...inv,
                            discountAmount: val,
                            pointsDeduction: actualDeduction,
                            paidAmount: Math.max(0, totalBillCost - val - actualDeduction)
                          };
                        });
                      }}
                      className="w-full text-right text-sm rounded-md border border-gray-300 py-1 px-2 focus:border-blue-500 focus:outline-hidden text-gray-900"
                    />
                  </div>
                </div>

                {/* Net Amount Due */}
                <div className="flex justify-between items-center border-t border-gray-100 pt-3">
                  <span className="font-bold text-gray-800 text-sm">Khách cần trả:</span>
                  <span className="font-black pr-2.5 text-blue-600 text-lg">{new Intl.NumberFormat("vi-VN").format(netDue)}</span>
                </div>

                {/* Loyalty Points Deduction Module */}
                {!activeInvoice.selectedCustomer ? (
                  <div className="flex justify-between items-center bg-gray-50 p-2 rounded-lg border border-dashed border-gray-200">
                    <div className="flex items-center space-x-1.5 text-gray-400 font-medium text-xs">
                      <Sparkles className="w-3.5 h-3.5 text-gray-300" />
                      <span>Điểm:</span>
                    </div>
                    <span className="text-xs text-gray-400 font-medium">Chưa chọn khách hàng</span>
                  </div>
                ) : (
                  <div className="flex justify-between items-center bg-rose-50/40 p-2 rounded-lg border border-rose-100/70 gap-2">
                    <div className="flex items-center gap-1.5 shrink-0">
                      <div className="flex items-center space-x-1 text-rose-700 font-mono text-sm">
                        <Sparkles className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                        <span>
                          Điểm: <span className="font-mono text-rose-800">{new Intl.NumberFormat("vi-VN").format(maxPointsAvailable)}</span>
                        </span>
                      </div>
                      
                      {/* ON/OFF toggle button right next to points */}
                      <button
                        type="button"
                        onClick={() => {
                          const nextUsePoints = !activeInvoice.usePoints;
                          // Khi sử dụng on/off thì cho giá trị về 0
                          const defaultDeduction = 0;
                          updateActiveInvoice(inv => ({
                            ...inv,
                            usePoints: nextUsePoints,
                            pointsDeduction: defaultDeduction,
                            paidAmount: Math.max(0, totalBillCost - inv.discountAmount - defaultDeduction)
                          }));
                        }}
                        className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                          activeInvoice.usePoints ? "bg-rose-500" : "bg-gray-300"
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                            activeInvoice.usePoints ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>

                    {/* Right side: Input always on the same line, disabled if usePoints is false */}
                    <div className="flex items-center gap-1">
                      <div className="relative max-w-[110px]">
                        <input
                          type="text"
                          inputMode="numeric"
                          disabled={!activeInvoice.usePoints}
                          value={activeInvoice.usePoints && activeInvoice.pointsDeduction ? formatNumberWithDots(activeInvoice.pointsDeduction) : ""}
                          placeholder="0"
                          onChange={(e) => {
                            if (!activeInvoice.usePoints) return;
                            const enteredVal = parseNumberFromDots(e.target.value);
                            const capLimit = Math.min(maxPointsAvailable, totalBillCost - activeInvoice.discountAmount);
                            const finalVal = Math.min(enteredVal, capLimit);
                            updateActiveInvoice(inv => ({
                              ...inv,
                              pointsDeduction: finalVal,
                              paidAmount: Math.max(0, totalBillCost - inv.discountAmount - finalVal)
                            }));
                          }}
                          className={`w-full text-right font-slate-900 text-sm rounded-md h-6 border py-0.5 px-2 focus:outline-hidden transition-colors ${
                            activeInvoice.usePoints 
                              ? "border-rose-200 text-rose-700 bg-white focus:border-rose-400" 
                              : "border-gray-200 text-gray-400 bg-gray-100 cursor-not-allowed"
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Customer Paid input */}
                <div className="flex justify-between items-center">
                  <span className="font-medium text-sm text-slate-900">Khách thanh toán:</span>
                  <div className="relative max-w-[130px]">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={activeInvoice.paidAmount ? formatNumberWithDots(activeInvoice.paidAmount) : ""}
                      placeholder="0"
                      onChange={(e) => {
                        const val = parseNumberFromDots(e.target.value);
                        updateActiveInvoice(inv => ({ ...inv, paidAmount: val }));
                      }}
                      className="w-full text-right text-sm rounded-md border border-emerald-500 py-1 px-2 focus:ring-1 focus:ring-emerald-500 focus:outline-hidden text-emerald-700 bg-emerald-50/5"
                    />
                  </div>
                </div>

                {/* Change Return */}
                {/* {activeInvoice.paidAmount > 0 && changeDue > 0 && (
                  <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                    <span className="font-medium text-gray-500">
                      {activeInvoice.refundType === "Tính vào công nợ" ? "Tính vào công nợ:" : "Tiền thừa trả khách:"}
                    </span>
                    <span className="font-bold text-emerald-600 text-base">{new Intl.NumberFormat("vi-VN").format(changeDue)}</span>
                  </div>
                )} */}
              </>
            )}

            {/* Payment method toggle */}
            {!isCartEmpty && (
              <div className="space-y-1.5 pt-1 border-t border-slate-100/90">
                <div>
                  {/* Highly polished ultra-thin card-style payment selectors */}
                  <div className="grid grid-cols-4 gap-1.5 pb-1 border-b border-slate-100/70 border-dashed font-viet">
                    
                    {/* Tiền mặt Option */}
                    <button
                      type="button"
                      onClick={() => updateActiveInvoice(inv => ({ ...inv, paymentMethod: "Tiền mặt" }))}
                      className={`relative flex items-center justify-center space-x-1.5 py-1.5 px-1 rounded-lg border transition-all duration-150 cursor-pointer ${
                        activeInvoice.paymentMethod === "Tiền mặt"
                          ? 'border-emerald-500 bg-emerald-50/40 text-emerald-900 shadow-sm'
                          : 'border-slate-200 bg-white text-slate-500 hover:border-emerald-500 hover:bg-slate-50'
                      }`}
                    >
                      <DollarSign className="h-3.5 w-3.5" />
                      <span className="text-[10px] font-bold">Tiền mặt</span>
                    </button>

                    {/* Chuyển khoản Option */}
                    <button
                      type="button"
                      onClick={() => updateActiveInvoice(inv => ({ ...inv, paymentMethod: "Chuyển khoản", paidAmount: netDue }))}
                      className={`relative flex items-center justify-center space-x-1.5 py-1.5 px-1 rounded-lg border transition-all duration-150 cursor-pointer ${
                        activeInvoice.paymentMethod === "Chuyển khoản"
                          ? 'border-sky-500 bg-sky-50/40 text-sky-900 shadow-sm'
                          : 'border-slate-200 bg-white text-slate-500 hover:border-sky-500 hover:bg-slate-50'
                      }`}
                    >
                      <QrCode className= "w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold">Chuyển khoản</span>
                    </button>

                    {/* Thẻ Option */}
                    <button
                      type="button"
                      onClick={() => updateActiveInvoice(inv => ({ ...inv, paymentMethod: "Thẻ", paidAmount: netDue }))}
                      className={`relative flex items-center justify-center space-x-1.5 py-1.5 px-1 rounded-lg border transition-all duration-150 cursor-pointer ${
                        activeInvoice.paymentMethod === "Thẻ"
                          ? 'border-indigo-500 bg-indigo-50/40 text-indigo-900 shadow-sm'
                          : 'border-slate-200 bg-white text-slate-500 hover:border-indigo-500 hover:bg-slate-50'
                      }`}
                    >
                      <CreditCard className= "w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold">Thẻ POS</span>
                    </button>

                    {/* Ví Option */}
                    <button
                      type="button"
                      onClick={() => updateActiveInvoice(inv => ({ ...inv, paymentMethod: "Ví", paidAmount: netDue }))}
                      className={`relative flex items-center justify-center space-x-1.5 py-1.5 px-1 rounded-lg border transition-all duration-150 cursor-pointer ${
                        activeInvoice.paymentMethod === "Ví"
                          ? 'border-pink-500 bg-pink-50/40 text-pink-900 shadow-sm'
                          : 'border-slate-200 bg-white text-slate-500 hover:border-pink-500 hover:bg-slate-50'
                      }`}
                    >
                      <Wallet className="h-4 w-4" />
                      <span className="text-[10px] font-bold">Ví</span>
                    </button>
                  </div>
                </div>

                {/* Show QR code button trigger for non-cash payment options */}
                {activeInvoice.paymentMethod === "Chuyển khoản" && (
                  <div className="pt-1 animate-in fade-in duration-150">
                    <button
                      type="button"
                      onClick={() => {
                        setQrModalType("Chuyển khoản");
                        setQrModalOpen(true);
                      }}
                      className="w-full flex items-center justify-center gap-1.5 py-2 px-4 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-lg shadow-xs hover:shadow-md transition-all cursor-pointer border border-sky-700"
                    >
                      <QrCode className="h-3.5 w-3.5" />
                      <span>Hiện mã QRcode chuyển khoản</span>
                    </button>
                  </div>
                )}

                {activeInvoice.paymentMethod === "Thẻ" && (
                  <div className="pt-1 animate-in fade-in duration-200 space-y-3 bg-indigo-50/40 p-3 rounded-xl border border-indigo-100/50">
                    <div className="flex flex-col items-center justify-center text-center space-y-3">
                      <div className="inline-flex p-2.5 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200/50 shadow-xs animate-pulse">
                        <CreditCard className="h-5 w-5" />
                      </div>
                      
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Hình thức: Quét thẻ POS</h4>
                        <p className="text-[11px] text-slate-500 leading-relaxed px-1">
                          Tiến hành quẹt thẻ Visa/MasterCard hoặc ATM nội địa bằng thiết bị POS ngân hàng cầm tay tại quầy.
                        </p>
                      </div>

                      <div className="w-full text-[11px] space-y-1.5 bg-white p-2.5 rounded-lg border border-indigo-100/30">
                        <div className="flex justify-between items-center text-slate-600">
                          <span>Số tiền cần thanh toán:</span>
                          <span className="font-bold text-xs text-slate-900 font-mono">
                            {new Intl.NumberFormat("vi-VN").format(activeInvoice.paidAmount || 0)}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          updateActiveInvoice(inv => ({ ...inv, isPosConfirmed: !inv.isPosConfirmed }));
                        }}
                        className={`w-full py-2 px-3 font-bold text-xs rounded-lg transition-colors cursor-pointer shadow-xs text-center flex items-center justify-center gap-1.5 ${
                          activeInvoice.isPosConfirmed
                            ? "bg-[#00a65a] hover:bg-[#008d4c] text-white"
                            : "bg-indigo-600 hover:bg-indigo-700 text-white"
                        }`}
                      >
                        {activeInvoice.isPosConfirmed ? (
                          <>
                            <Check className="h-3.5 w-3.5 stroke-[3]" />
                            <span>Đã xác nhận thành công</span>
                          </>
                        ) : (
                          <span>Xác nhận quẹt thẻ thành công</span>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {activeInvoice.paymentMethod === "Ví" && (
                  <div className="pt-1 animate-in fade-in duration-150">
                    <button
                      type="button"
                      onClick={() => {
                        setQrModalType("Ví");
                        setQrModalOpen(true);
                      }}
                      className="w-full flex items-center justify-center gap-1.5 py-2 px-4 bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs rounded-lg shadow-xs hover:shadow-md transition-all cursor-pointer border border-pink-700"
                    >
                      <Wallet className="h-3.5 w-3.5" />
                      <span>Hiện mã QRcode Ví điện tử</span>
                    </button>
                  </div>
                )}

                {/* Suggested cash denominations */}
                {activeInvoice.paymentMethod === "Tiền mặt" && (activeInvoice.isReturn ? true : netDue > 0) && (
                  <div className="bg-emerald-50/20 p-1.5 rounded-lg border border-emerald-100/40 animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="flex flex-wrap gap-1.5">
                      {getSuggestedCashDenominations(activeInvoice.isReturn ? (netBalance >= 0 ? netBalance : Math.abs(netBalance)) : netDue).map((denom) => (
                        <button
                          key={denom}
                          type="button"
                          onClick={() => {
                            updateActiveInvoice(inv => ({ ...inv, paidAmount: denom }));
                          }}
                          className={`px-2 py-1 text-sm text-slate-900 font-mono rounded-md border transition-all duration-150 cursor-pointer ${
                            activeInvoice.paidAmount === denom
                              ? "bg-emerald-600 border-emerald-600 text-white shadow-sm scale-102"
                              : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-emerald-500"
                          }`}
                        >
                          {new Intl.NumberFormat("vi-VN").format(denom)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tiền thừa / Công nợ radio buttons - Shown below payment suggestions when there's surplus or deficit */}
                {activeInvoice.paidAmount > 0 && activeInvoice.paidAmount !== netDue && (
                  <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg animate-in fade-in duration-250 font-viet">
                    {activeInvoice.paidAmount > netDue ? (
                      <div className="flex items-center">
                        <label className="flex items-center gap-2 text-sm text-slate-900 cursor-pointer w-full">
                          <input
                            type="radio"
                            name="refundType"
                            checked={true}
                            onChange={() => {}}
                            className="h-4 w-4 text-emerald-600 border-slate-300 focus:ring-emerald-500 cursor-pointer"
                          />
                          <span>Tiền thừa trả khách:</span>
                          <span className="font-mono text-slate-900 font-mono text-sm ml-auto">
                            {new Intl.NumberFormat("vi-VN").format(activeInvoice.paidAmount - netDue)}
                          </span>
                        </label>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <label className="flex items-center gap-2 text-sm text-slate-900 cursor-pointer w-full">
                          <input
                            type="radio"
                            name="refundType"
                            checked={true}
                            onChange={() => {}}
                            className="h-4 w-4 text-rose-600 border-slate-300 focus:ring-rose-500 cursor-pointer"
                          />
                          <span>Tính vào công nợ:</span>
                          <span className="font-mono text-rose-600 font-mono text-sm ml-auto">
                            -{new Intl.NumberFormat("vi-VN").format(netDue - activeInvoice.paidAmount)}
                          </span>
                        </label>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Bottom actions: Pay and Receipt printing */}
          <div className="p-3 border-t border-gray-100 bg-gray-50 flex gap-2 shrink-0">
            <button
              onClick={() => setIsDraftReceiptOpen(true)}
              className="px-4 py-3 bg-slate-200 hover:bg-slate-300 active:bg-slate-400 text-slate-800 font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
              title="Xem trước và In hóa đơn nháp"
            >
              <Printer className="h-4 w-4" />
              <span>IN</span>
            </button>
            <button
              onClick={handleCheckout}
              disabled={
                activeInvoice.isReturn
                  ? ((activeInvoice.returnItems || []).reduce((sum, item) => sum + item.quantity, 0) === 0 && activeInvoice.items.length === 0)
                  : activeInvoice.items.length === 0
              }
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 font-bold text-white rounded-lg transition-colors shadow-md cursor-pointer ${
                (activeInvoice.isReturn
                  ? ((activeInvoice.returnItems || []).reduce((sum, item) => sum + item.quantity, 0) === 0 && activeInvoice.items.length === 0)
                  : activeInvoice.items.length === 0)
                  ? "bg-gray-300 cursor-not-allowed text-gray-500 shadow-none"
                  : activeInvoice.isReturn
                    ? "bg-rose-600 hover:bg-rose-700 active:bg-rose-800"
                    : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800"
              }`}
            >
              <span>{activeInvoice.isReturn ? "HOÀN TẤT ĐỔI TRẢ" : "THANH TOÁN"}</span>
              {/* <ArrowRight className="h-4 w-4" /> */}
            </button>
          </div>

        </aside>

      </div>

      {/* 3. Bottom Footer Status Bar */}
      <footer className="h-8 bg-gray-100 border-t border-gray-200 px-3 flex items-center justify-between text-[11px] text-gray-400 shrink-0 select-none">
        <div className="flex items-center gap-3">
          <span>Bản quyền © 2026</span>
        </div>
        
          {/* User & Admin mode toggle */}
          {/* <button
            onClick={onToggleScreen}
            className="flex items-center gap-1 bg-[#ff9100] hover:bg-[#e07f00] text-white text-xs font-semibold px-2.5 py-1 rounded-md transition-all shrink-0 uppercase tracking-wider"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Màn hình Quản Lý</span>
          </button> */}
      </footer>

      {/* Return Invoice Selector Modal */}
      {isReturnModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden border border-slate-200">
            {/* Header */}
            <div className="bg-[#0070d2] text-white px-5 py-3.5 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <RotateCcw className="h-5 w-5 animate-spin" style={{ animationDuration: '3s' }} />
                <h3 className="text-sm font-bold uppercase tracking-wider font-sans">
                  Chọn hóa đơn để khách trả hàng
                </h3>
              </div>
              <button
                onClick={() => setIsReturnModalOpen(false)}
                className="p-1 rounded-full hover:bg-white/10 text-white/90 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content: 2-Columns */}
            <div className="flex-1 flex overflow-hidden min-h-0 bg-slate-50">
              
              {/* LEFT COLUMN: List of Invoices (~60% width) */}
              <div className="w-[60%] flex flex-col border-r border-slate-200 bg-white min-h-0">
                <div className="px-4 py-2 bg-slate-50 border-b flex justify-between items-center text-xs font-bold text-slate-500 shrink-0">
                  <span>DANH SÁCH HÓA ĐƠN ({filteredInvoicesForReturn.length})</span>
                  <span className="italic font-normal text-[10px] text-blue-600">Nhấp vào hóa đơn để trả hàng</span>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1.5 bg-slate-50/30">
                  {filteredInvoicesForReturn.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
                      <ShoppingBag className="h-10 w-10 text-slate-300 mb-2" />
                      <p className="text-xs font-semibold">Không tìm thấy hóa đơn nào khớp bộ lọc</p>
                      <p className="text-[10px] text-slate-400 mt-1">Vui lòng điều chỉnh lại điều kiện tìm kiếm hoặc khoảng thời gian.</p>
                    </div>
                  ) : (
                    filteredInvoicesForReturn.map((invoice) => {
                      const cust = data.Khach_hang.find(c => c.id === invoice.id_khach_hang);
                      const invDate = new Date(invoice.ngay_lap);
                      const dateFormatted = invDate.toLocaleDateString("vi-VN") + " " + invDate.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
                      
                      return (
                        <div
                          key={invoice.id}
                          onClick={() => {
                            // Close modal
                            setIsReturnModalOpen(false);
                            
                            // Add return tab
                            const returnCount = invoices.filter(i => i.isReturn).length;
                            const newTabId = invoices.length > 0 ? Math.max(...invoices.map(i => i.id)) + 1 : 1;
                            
                            const newReturnTab = {
                              id: newTabId,
                              name: `Trả hàng ${returnCount + 1}`,
                              isReturn: true,
                              originalInvoiceId: invoice.id,
                              selectedCustomer: cust || null,
                              items: [], // newly purchased items
                              returnItems: invoice.chi_tiet_san_pham.map(detail => {
                                const prodDetailId = detail.id_sp || (detail as any).id_san_pham;
                                const prod = data.San_pham.find(p => p.id === prodDetailId) || {
                                  id: prodDetailId,
                                  ten_san_pham: `Sản phẩm (${prodDetailId})`,
                                  gia_ban: detail.don_gia,
                                  gia_von: detail.don_gia,
                                  ton_kho: 0,
                                  don_vi_tinh: "Cái",
                                  bar_code: "",
                                  id_nhom_hang: "",
                                  id_thuong_hieu: "",
                                  trang_thai: "ACTIVE"
                                };
                                return {
                                  product: prod,
                                  quantity: 0,
                                  maxQuantity: detail.so_luong,
                                  gia_tra: detail.don_gia
                                };
                              }),
                              discountAmount: 0,
                              paidAmount: 0,
                              paymentMethod: "Tiền mặt" as const,
                              note: `Khách trả hàng hóa đơn ${invoice.id}`
                            };
                            
                            // Compute default paidAmount for return tab
                            const totalReturnCost = newReturnTab.returnItems.reduce((sum, item) => sum + (item.gia_tra * item.quantity), 0);
                            newReturnTab.paidAmount = totalReturnCost; // default refund amount
                            
                            setInvoices([...invoices, newReturnTab]);
                            setActiveTabId(newTabId);
                          }}
                          className="p-3 bg-white border border-slate-200 rounded-lg hover:border-blue-400 hover:shadow-xs transition-all cursor-pointer flex justify-between items-center"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-xs text-[#0070d2]">{invoice.id}</span>
                              <span className="text-[10px] text-slate-400 font-medium">{dateFormatted}</span>
                            </div>
                            <div className="text-xs text-slate-700 font-semibold flex items-center gap-1">
                              <User className="h-3 w-3 text-slate-400" />
                              <span>{cust ? `${cust.ho_ten} - ${cust.so_dien_thoai}` : "Khách lẻ"}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs font-bold text-slate-900">
                              {new Intl.NumberFormat("vi-VN").format(invoice.khach_can_tra)} đ
                            </div>
                            <div className="text-[10px] text-emerald-600 font-semibold">
                              {invoice.phuong_thuc_thanh_toan}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* RIGHT COLUMN: Search Filters (~40% width) */}
              <div className="w-[40%] p-4 flex flex-col justify-between bg-white min-h-0">
                <div className="space-y-4 overflow-y-auto max-h-[100%] pr-1">
                  <div className="bg-slate-50 rounded-lg border p-3.5 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b pb-1.5 flex items-center gap-1.5">
                      <Search className="h-3.5 w-3.5 text-blue-600" />
                      Tìm kiếm hóa đơn
                    </h4>
                    
                    <div className="space-y-3 text-xs">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                          Mã hóa đơn
                        </label>
                        <input
                          type="text"
                          placeholder="Ví dụ: HD00001..."
                          value={returnSearchId}
                          onChange={(e) => setReturnSearchId(e.target.value)}
                          className="w-full rounded-md border border-slate-300 py-1.5 px-3 focus:border-blue-500 focus:outline-hidden bg-white text-slate-800"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                          Tên khách hàng
                        </label>
                        <input
                          type="text"
                          placeholder="Nhập tên khách hàng..."
                          value={returnSearchCustName}
                          onChange={(e) => setReturnSearchCustName(e.target.value)}
                          className="w-full rounded-md border border-slate-300 py-1.5 px-3 focus:border-blue-500 focus:outline-hidden bg-white text-slate-800"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                          Số điện thoại (ĐT)
                        </label>
                        <input
                          type="text"
                          placeholder="Nhập số điện thoại..."
                          value={returnSearchCustPhone}
                          onChange={(e) => setReturnSearchCustPhone(e.target.value)}
                          className="w-full rounded-md border border-slate-300 py-1.5 px-3 focus:border-blue-500 focus:outline-hidden bg-white text-slate-800"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-lg border p-3.5 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b pb-1.5 flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-blue-600" />
                      Thời gian lập phiếu
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                          Từ ngày
                        </label>
                        <input
                          type="date"
                          value={returnSearchFromDate}
                          onChange={(e) => setReturnSearchFromDate(e.target.value)}
                          className="w-full rounded-md border border-slate-300 py-1 px-2 focus:border-blue-500 focus:outline-hidden bg-white text-slate-800"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                          Đến ngày
                        </label>
                        <input
                          type="date"
                          value={returnSearchToDate}
                          onChange={(e) => setReturnSearchToDate(e.target.value)}
                          className="w-full rounded-md border border-slate-300 py-1 px-2 focus:border-blue-500 focus:outline-hidden bg-white text-slate-800"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        onClick={() => {
                          setReturnSearchId("");
                          setReturnSearchCustName("");
                          setReturnSearchCustPhone("");
                          setReturnSearchFromDate("");
                          setReturnSearchToDate("");
                        }}
                        className="text-[10px] text-blue-600 hover:underline font-semibold"
                      >
                        Xóa tất cả bộ lọc
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t mt-3">
                  <button
                    onClick={() => setIsReturnModalOpen(false)}
                    className="w-full py-2 bg-slate-200 hover:bg-slate-300 active:bg-slate-400 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    Đóng cửa sổ
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Add Customer Modal popup */}
      <AddCustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        onSave={handleQuickSaveCustomer}
      />

      <DraftReceiptModal
        isOpen={isDraftReceiptOpen}
        onClose={() => setIsDraftReceiptOpen(false)}
        items={activeInvoice.items}
        discountAmount={activeInvoice.discountAmount}
        pointsDeduction={activeInvoice.pointsDeduction || 0}
        usePoints={activeInvoice.usePoints || false}
        paymentMethod={activeInvoice.paymentMethod}
        selectedCustomer={activeInvoice.selectedCustomer}
        shopInfo={data.Thong_tin_shop}
        employeeName={data.Nhan_vien?.find(e => e.id === selectedEmployeeId)?.ho_ten || "Nhân viên hệ thống"}
        bankAccounts={data.Ngan_hang || []}
        isReturn={activeInvoice.isReturn || false}
        returnItems={(activeInvoice.returnItems || []).filter(item => item.quantity > 0)}
        totalReturn={totalReturn}
        paidAmount={activeInvoice.paidAmount}
      />

      {/* Large Centralized QR Code / Payment Modal */}
      {qrModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 flex items-center justify-center z-50 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 flex flex-col p-6 space-y-5 animate-in zoom-in-95 duration-200 relative">
            <div className="flex items-center space-x-1.5 text-sky-600">
                <QrCode className="w-5 h-5 text-sky-500 animate-pulse" />
                <span className="font-bold text-xs uppercase tracking-wider text-slate-700">
                  {qrModalType === 'Ví' ? 'Thanh toán Momo QR' : 'Chuyển khoản VietQR'}
                </span>
              </div>
            <button
              onClick={() => setQrModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer z-10"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Horizontal Payment Method Tabs */}
            {/* <div className="grid grid-cols-4 gap-1.5 border-b border-slate-100 pb-3 w-full">
              <button
                type="button"
                onClick={() => {
                  setQrModalType("Tiền mặt");
                  updateActiveInvoice(inv => ({ ...inv, paymentMethod: "Tiền mặt" }));
                }}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg border text-[11px] font-bold transition-all duration-150 cursor-pointer ${
                  qrModalType === "Tiền mặt"
                    ? "border-blue-600 bg-blue-50/50 text-blue-600 shadow-xs"
                    : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:border-slate-300"
                }`}
              >
                <DollarSign className="h-4 w-4 mb-0.5 shrink-0" />
                <span>Tiền mặt</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setQrModalType("Chuyển khoản");
                  updateActiveInvoice(inv => ({ ...inv, paymentMethod: "Chuyển khoản", paidAmount: netDue }));
                }}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg border text-[11px] font-bold transition-all duration-150 cursor-pointer ${
                  qrModalType === "Chuyển khoản"
                    ? "border-blue-600 bg-blue-50/50 text-blue-600 shadow-xs"
                    : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:border-slate-300"
                }`}
              >
                <QrCode className="h-4 w-4 mb-0.5 shrink-0" />
                <span>Chuyển QR</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setQrModalType("Thẻ");
                  updateActiveInvoice(inv => ({ ...inv, paymentMethod: "Thẻ", paidAmount: netDue }));
                }}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg border text-[11px] font-bold transition-all duration-150 cursor-pointer ${
                  qrModalType === "Thẻ"
                    ? "border-blue-600 bg-blue-50/50 text-blue-600 shadow-xs"
                    : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:border-slate-300"
                }`}
              >
                <CreditCard className="h-4 w-4 mb-0.5 shrink-0" />
                <span>Thẻ POS</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setQrModalType("Ví");
                  updateActiveInvoice(inv => ({ ...inv, paymentMethod: "Ví", paidAmount: netDue }));
                }}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg border text-[11px] font-bold transition-all duration-150 cursor-pointer ${
                  qrModalType === "Ví"
                    ? "border-blue-600 bg-blue-50/50 text-blue-600 shadow-xs"
                    : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:border-slate-300"
                }`}
              >
                <Smartphone className="h-4 w-4 mb-0.5 shrink-0" />
                <span>Momo</span>
              </button>
            </div> */}

            {/* TAB CONTENT: TIỀN MẶT */}
            {qrModalType === "Tiền mặt" && (
              <div className="flex flex-col items-center justify-center py-4 text-center space-y-4 w-full animate-in fade-in duration-200">
                <div className="inline-flex p-4 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-xs">
                  <DollarSign className="h-8 w-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-800">Hình thức: Thanh toán Tiền mặt</h3>
                  <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                    Thu tiền mặt trực tiếp từ khách hàng. Vui lòng kiểm tra kỹ số tiền nhận và trả lại tiền thừa (nếu có) trước khi hoàn tất.
                  </p>
                </div>

                <div className="w-full text-xs space-y-1.5 bg-slate-50/50 p-3 rounded-lg border border-slate-100 mt-2">
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Số tiền cần thanh toán:</span>
                    <span className="font-bold text-sm text-slate-900 font-mono">
                      {new Intl.NumberFormat("vi-VN").format(activeInvoice.paidAmount || 0)}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    updateActiveInvoice(inv => ({ ...inv, paymentMethod: "Tiền mặt" }));
                    setQrModalOpen(false);
                  }}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer shadow-sm"
                >
                  Xác nhận đã nhận đủ tiền & Đóng
                </button>
              </div>
            )}

   
            {/* TAB CONTENT: CHUYỂN QR */}
            {qrModalType === "Chuyển khoản" && (
              <div className="flex flex-col items-center w-full space-y-4 animate-in fade-in duration-200">
                <div className="text-center bg-sky-50 border border-sky-100 py-2.5 px-4 rounded-xl w-full mb-3.5">
                  <span className="text-[10px] text-sky-700 font-bold uppercase tracking-wide">Số tiền thanh toán:</span>
                  <p className="text-2xl font-black text-[#007ed3] font-mono tracking-tight">{new Intl.NumberFormat("vi-VN").format(activeInvoice.paidAmount || 0)}</p>
                </div>

                {/* QR Code Container */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center justify-center shadow-inner">
                  <img
                    src={`https://img.vietqr.io/image/vietinbank-113366668888-compact2.png?amount=${activeInvoice.paidAmount || 0}&addInfo=Thanh+toan+hoa+don+HD${activeInvoice.id}&accountName=Cua+Hang+POS`}
                    alt="Payment QR Code"
                    className="w-100 h-100 object-contain rounded-lg"
                    referrerPolicy="no-referrer"
                  />
                </div>

                {/* Account Details or Instructions */}
                {/* <div className="w-full text-xs space-y-1 bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                  <div className="flex justify-between items-center text-slate-600 pb-1 border-b border-slate-100">
                    <span>Số tiền thanh toán:</span>
                    <span className="font-bold text-sm text-slate-900 font-mono">
                      {new Intl.NumberFormat("vi-VN").format(activeInvoice.paidAmount || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600 pt-1">
                    <span>Ngân hàng:</span>
                    <span className="font-semibold text-slate-800">VietinBank (ICB)</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Số tài khoản:</span>
                    <span className="font-bold text-slate-900 font-mono">113366668888</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Chủ tài khoản:</span>
                    <span className="font-semibold text-slate-800 text-[11px]">CỬA HÀNG POS - ADMIN</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Nội dung chuyển:</span>
                    <span className="font-bold text-slate-900 font-mono text-[10px] bg-amber-50 px-1 py-0.5 rounded-sm border border-amber-200">
                      Thanh toan hoa don HD{activeInvoice.id}
                    </span>
                  </div>
                </div> */}

                <button
                  type="button"
                  onClick={() => {
                    updateActiveInvoice(inv => ({ ...inv, paymentMethod: "Chuyển khoản" }));
                    setQrModalOpen(false);
                  }}
                  className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer shadow-sm"
                >
                  Xác nhận đã nhận chuyển khoản & Đóng
                </button>
              </div>
            )}

            {/* TAB CONTENT: THẺ POS (EXACTLY MATCHES SPECIFIED ATTACHED IMAGE) */}
            {qrModalType === "Thẻ" && (
              <div className="flex flex-col items-center justify-center py-4 text-center space-y-4 w-full animate-in fade-in duration-200">
                <div className="inline-flex p-4 rounded-full bg-sky-50 text-sky-600 border border-sky-100 shadow-xs">
                  <CreditCard className="h-8 w-8" />
                </div>
                
                <div className="space-y-1.5">
                  <h3 className="text-sm font-bold text-slate-800">Hình thức: Quét thẻ POS</h3>
                  <p className="text-xs text-slate-500 max-w-xs leading-relaxed px-2">
                    Tiến hành quẹt thẻ Visa/MasterCard hoặc ATM nội địa bằng thiết bị POS ngân hàng cầm tay tại quầy.
                  </p>
                </div>

                <div className="w-full text-xs space-y-1.5 bg-slate-50/50 p-3 rounded-lg border border-slate-100 mt-2">
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Số tiền cần thanh toán:</span>
                    <span className="font-bold text-sm text-slate-900 font-mono">
                      {new Intl.NumberFormat("vi-VN").format(activeInvoice.paidAmount || 0)}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    updateActiveInvoice(inv => ({ ...inv, paymentMethod: "Thẻ" }));
                    setQrModalOpen(false);
                  }}
                  className="w-full py-2.5 bg-[#00a65a] hover:bg-[#008d4c] text-white font-bold text-xs rounded-xl transition-colors cursor-pointer shadow-sm text-center"
                >
                  Xác nhận quẹt thẻ thành công & Đóng
                </button>
              </div>
            )}

            {/* TAB CONTENT: MOMO (VÍ) */}
            {qrModalType === "Ví" && (
              <div className="flex flex-col items-center w-full space-y-4 animate-in fade-in duration-200">
                <div className="text-center bg-sky-50 border border-sky-100 py-2.5 px-4 rounded-xl w-full mb-3.5">
                  <span className="text-[10px] text-sky-700 font-bold uppercase tracking-wide">Số tiền thanh toán:</span>
                  <p className="text-2xl font-black text-[#007ed3] font-mono tracking-tight">{new Intl.NumberFormat("vi-VN").format(activeInvoice.paidAmount || 0)}</p>
                </div>

                {/* QR Code Container */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center justify-center shadow-inner">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=WALLET-MOMO-PAYMENT-${activeInvoice.id}-${activeInvoice.paidAmount || 0}`}
                    alt="Payment QR Code"
                    className="w-48 h-48 object-contain rounded-lg"
                    referrerPolicy="no-referrer"
                  />
                </div>

                {/* Account Details or Instructions */}
                <div className="w-full text-xs space-y-1.5 bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                  <div className="text-center text-slate-500 py-1 text-[11px] leading-relaxed border-t border-slate-100 mt-1 pt-1">
                    Hỗ trợ thanh toán qua Ví MoMo, ZaloPay, Viettel Money, ShopeePay. Quét mã tự động điền tiền và nội dung hóa đơn.
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    updateActiveInvoice(inv => ({ ...inv, paymentMethod: "Ví" }));
                    setQrModalOpen(false);
                  }}
                  className="w-full py-2.5 bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer shadow-sm"
                >
                  Xác nhận đã nhận Ví điện tử & Đóng
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Centralized Price & Discount Adjustment Modal */}
      {editingItemId && editingItem && editingItemPosition && (
        <div 
          onClick={() => setEditingItemId(null)}
          className="fixed inset-0 z-[60] bg-black/[0.01]"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{ 
              position: "fixed", 
              top: `${editingItemPosition.top}px`, 
              left: `${editingItemPosition.left}px` 
            }}
            className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl w-[270px] overflow-hidden border border-slate-200/90 flex flex-col p-4 space-y-3.5 animate-in zoom-in-95 duration-100 select-text"
          >
            
            {/* Close Button */}
            {/* <button
              onClick={() => setEditingItemId(null)}
              className="absolute top-3.5 right-3.5 p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button> */}

            {/* Header */}
            {/* <div className="space-y-0.5 pr-6">
              <h3 className="text-xs font-bold text-slate-800">
                Điều chỉnh giá &amp; Giảm giá
              </h3>
              <p className="text-[10px] text-slate-500 font-medium truncate">
                {editingItem.product.ten_san_pham}
              </p>
            </div> */}

            {/* Content panel */}
            <div className="space-y-2.5 pt-1">
              {/* Line 1: Đơn giá */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-slate-900">Đơn giá:</span>
                <input
                  type="text"
                  value={formatNumberWithDots(getItemUnitPrice(editingItem))}
                  onChange={(e) => {
                    const val = parseNumberFromDots(e.target.value);
                    updateInvoiceItemPrice(editingItemId, { customPrice: val });
                  }}
                  className="w-32 text-right px-2 py-1 border border-slate-200 rounded-md font-mono text-ms text-slate-800 focus:outline-hidden focus:border-blue-500 bg-white"
                />
              </div>
              
              {/* Line 2: Giảm giá */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-slate-900">Giảm giá:</span>
                <div className="flex items-center border border-slate-200 rounded-md bg-white overflow-hidden">
                  <input
                    type="text"
                    value={(editingItem.discountType || "VND") === "%" ? editingItem.discount : formatNumberWithDots(editingItem.discount)}
                    onChange={(e) => {
                      const isPercent = (editingItem.discountType || "VND") === "%";
                      const val = isPercent ? (parseInt(e.target.value.replace(/\D/g, ""), 10) || 0) : parseNumberFromDots(e.target.value);
                      updateInvoiceItemPrice(editingItemId, { discount: val });
                    }}
                    className="w-20 text-right px-2 py-1 text-sm text-slate-800 focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const nextType = (editingItem.discountType || "VND") === "%" ? "VND" : "%";
                      updateInvoiceItemPrice(editingItemId, { discountType: nextType, discount: 0 });
                    }}
                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-sm font-mono text-slate-600 border-l border-slate-200 cursor-pointer"
                  >
                    {editingItem.discountType || "VND"}
                  </button>
                </div>
              </div>

              {/* Line 3: Giá bán */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-slate-900">Giá bán:</span>
                <input
                  type="text"
                  value={formatNumberWithDots(getItemSellingPrice(editingItem))}
                  onChange={(e) => {
                    const val = parseNumberFromDots(e.target.value);
                    updateInvoiceItemSellingPriceDirectly(editingItemId, val);
                  }}
                  className="w-32 text-right px-2 py-1 border border-sky-200 rounded-md font-mono text-sm text-sky-700 bg-sky-50/30 focus:outline-hidden focus:border-sky-500"
                />
              </div>

              {/* Line 4: Thành tiền */}
              {/* <div className="flex items-center justify-between gap-4">
                <span className="text-[11px] text-emerald-800 font-bold">Thành tiền:</span>
                <input
                  type="text"
                  value={formatNumberWithDots(getItemSellingPrice(editingItem) * editingItem.quantity)}
                  onChange={(e) => {
                    const val = parseNumberFromDots(e.target.value);
                    updateInvoiceItemLineTotalDirectly(editingItemId, val);
                  }}
                  className="w-32 text-right px-2 py-1 border border-emerald-200 rounded-md font-mono text-xs font-bold text-emerald-700 bg-emerald-50/30 focus:outline-hidden focus:border-emerald-500"
                />
              </div> */}
            </div>

            {/* Quick action info */}
            {/* <div className="text-[9px] text-slate-400 text-center pt-0.5">
              Click ra ngoài hoặc click nút X để đóng bảng
            </div> */}
          </div>
        </div>
      )}

      {/* Staff change login modal */}
      {showEmployeeLoginModal && employeeToVerify && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-[100] p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-100 p-6 space-y-4">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-2 font-bold text-lg">
                🔑
              </div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                Đăng nhập thay đổi ca
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Vui lòng nhập mật khẩu cho nhân sự: <strong className="text-gray-900">{employeeToVerify.ho_ten}</strong>
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const expectedPass = employeeToVerify.mat_khau || "123456";
                if (employeePasswordInput === expectedPass) {
                  setSelectedEmployeeId(employeeToVerify.id);
                  setShowEmployeeLoginModal(false);
                } else {
                  setEmployeeLoginError("Mật khẩu không chính xác!");
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Mã nhân sự</label>
                <input
                  type="text"
                  disabled
                  value={employeeToVerify.id}
                  className="w-full rounded-md border border-gray-200 py-1.5 px-3 bg-gray-50 text-gray-500 font-mono text-xs focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Mật khẩu *</label>
                <input
                  type="password"
                  required
                  autoFocus
                  placeholder="Nhập mật khẩu đăng nhập..."
                  value={employeePasswordInput}
                  onChange={(e) => {
                    setEmployeePasswordInput(e.target.value);
                    if (employeeLoginError) setEmployeeLoginError("");
                  }}
                  className="w-full rounded-md border border-gray-300 py-2 px-3 focus:border-blue-500 focus:outline-hidden bg-white text-gray-800 text-xs text-center font-mono font-bold"
                />
              </div>

              {employeeLoginError && (
                <div className="text-[11px] text-red-600 bg-red-50 py-1 px-2 rounded text-center font-medium animate-pulse">
                  ⚠️ {employeeLoginError}
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowEmployeeLoginModal(false)}
                  className="flex-1 rounded-lg border border-gray-300 bg-white py-2 text-center text-xs font-semibold text-gray-700 hover:bg-gray-50 focus:outline-hidden cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white py-2 text-center text-xs font-bold focus:outline-hidden cursor-pointer uppercase tracking-wider"
                >
                  Xác nhận
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
