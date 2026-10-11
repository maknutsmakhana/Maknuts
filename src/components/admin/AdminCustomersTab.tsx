import React, { useState, useMemo } from 'react';
import { Order } from '../../types';
import { 
  Users, 
  Search, 
  MessageCircle, 
  Phone, 
  MapPin, 
  IndianRupee, 
  Download, 
  ExternalLink,
  ShoppingBag,
  Clock
} from 'lucide-react';
import { createWhatsAppUrl } from '../../utils/whatsapp';

interface AdminCustomersTabProps {
  orders: Order[];
  onOpenOrder: (order: Order) => void;
}

interface CustomerProfile {
  phone: string;
  name: string;
  address: string;
  pincode: string;
  orderCount: number;
  totalSpent: number;
  lastOrderDate: string;
  latestOrder: Order;
  orders: Order[];
}

export const AdminCustomersTab: React.FC<AdminCustomersTabProps> = ({
  orders,
  onOpenOrder,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerProfile | null>(null);

  // Derive unique customer profiles
  const customerMap = useMemo(() => {
    const map = new Map<string, CustomerProfile>();

    // Process from oldest to newest so newest order overrides latest address/date
    const sorted = [...orders].sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));

    for (const order of sorted) {
      const cleanPhone = order.phone.trim().replace(/\s+/g, '');
      if (!cleanPhone) continue;

      const existing = map.get(cleanPhone);
      if (existing) {
        existing.orderCount += 1;
        existing.totalSpent += (order.totalAmount || 0);
        existing.name = order.customerName || existing.name;
        existing.address = order.address || existing.address;
        existing.pincode = order.pincode || existing.pincode;
        existing.lastOrderDate = order.createdAt || existing.lastOrderDate;
        existing.latestOrder = order;
        existing.orders.push(order);
      } else {
        map.set(cleanPhone, {
          phone: cleanPhone,
          name: order.customerName,
          address: order.address,
          pincode: order.pincode,
          orderCount: 1,
          totalSpent: order.totalAmount || 0,
          lastOrderDate: order.createdAt || '',
          latestOrder: order,
          orders: [order],
        });
      }
    }

    return Array.from(map.values()).sort((a, b) => b.totalSpent - a.totalSpent);
  }, [orders]);

  // Filtering
  const filteredCustomers = customerMap.filter(c => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q) ||
      c.address.toLowerCase().includes(q) ||
      c.pincode.toLowerCase().includes(q)
    );
  });

  const handleExportCustomersCsv = () => {
    if (customerMap.length === 0) return;
    const headers = ['Customer Name', 'Phone', 'Orders Count', 'Total Spent (INR)', 'Last Order Date', 'Address', 'Pincode'];
    const rows = customerMap.map(c => [
      `"${c.name.replace(/"/g, '""')}"`,
      `"${c.phone}"`,
      c.orderCount,
      c.totalSpent,
      `"${c.lastOrderDate}"`,
      `"${c.address.replace(/"/g, '""')}"`,
      `"${c.pincode}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `maknuts_customers_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleWhatsAppContact = (customer: CustomerProfile) => {
    const text = `Hello ${customer.name}! Greetings from Maknuts Makhana. We are checking in to see if you are enjoying your fresh harvest Fox Nuts! Let us know if you need any assistance or fresh restock.`;
    const url = createWhatsAppUrl(customer.phone, text);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Export */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-stone-900 font-serif flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-800" />
            <span>Customer Profiles & CRM</span>
          </h2>
          <p className="text-xs text-stone-500">
            {customerMap.length} unique buyers who have placed orders across your store.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCustomersCsv}
          className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Customers CSV</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3 rounded-2xl border border-stone-200/90 shadow-2xs">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Search by customer name, phone number, city, or pincode..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
          />
        </div>
      </div>

      {/* Customers List & Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className={`${selectedCustomer ? 'lg:col-span-7' : 'lg:col-span-12'} bg-white rounded-2xl border border-stone-200/90 shadow-2xs overflow-hidden`}>
          <div className="p-4 border-b border-stone-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-stone-900 font-serif">
              Customer Directory ({filteredCustomers.length})
            </h3>
            <span className="text-[11px] text-stone-500">
              Sorted by Lifetime Spend
            </span>
          </div>

          {filteredCustomers.length === 0 ? (
            <div className="p-8 text-center text-stone-400 text-xs">
              No customer records match your search.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-stone-50/70 border-b border-stone-100 text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                    <th className="py-2.5 px-4">Customer</th>
                    <th className="py-2.5 px-4">Location</th>
                    <th className="py-2.5 px-4">Orders</th>
                    <th className="py-2.5 px-4">Total Spent</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredCustomers.map(customer => {
                    const isSelected = selectedCustomer?.phone === customer.phone;
                    return (
                      <tr 
                        key={customer.phone}
                        onClick={() => setSelectedCustomer(customer)}
                        className={`hover:bg-amber-50/30 transition-colors cursor-pointer ${isSelected ? 'bg-emerald-50/60 font-medium' : ''}`}
                      >
                        <td className="py-3 px-4">
                          <div className="font-bold text-stone-900">{customer.name}</div>
                          <div className="text-[11px] text-stone-500 font-mono">{customer.phone}</div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="text-stone-700 truncate max-w-[150px]">
                            {customer.address}
                          </div>
                          <div className="text-[10px] text-stone-400 font-mono">
                            PIN: {customer.pincode}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-800 font-bold font-mono text-[10px]">
                            {customer.orderCount} {customer.orderCount === 1 ? 'order' : 'orders'}
                          </span>
                        </td>

                        <td className="py-3 px-4 font-mono font-bold text-emerald-950">
                          ₹{customer.totalSpent.toLocaleString()}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => handleWhatsAppContact(customer)}
                              className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 rounded-lg transition-colors cursor-pointer"
                              title="WhatsApp Customer"
                            >
                              <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedCustomer(customer)}
                              className="px-2 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-[10px] font-bold"
                            >
                              View
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Customer Detail Drawer */}
        {selectedCustomer && (
          <div className="lg:col-span-5 bg-white rounded-2xl border border-stone-200/90 shadow-2xs p-5 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <h3 className="text-sm font-bold text-stone-900 font-serif">
                  {selectedCustomer.name}
                </h3>
                <p className="text-xs text-stone-500 font-mono">{selectedCustomer.phone}</p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="text-stone-400 hover:text-stone-600 p-1"
              >
                ✕
              </button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <span className="text-[10px] text-stone-400 uppercase font-bold block">Total Spent</span>
                <span className="text-base font-black text-emerald-950 font-mono">
                  ₹{selectedCustomer.totalSpent.toLocaleString()}
                </span>
              </div>

              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <span className="text-[10px] text-stone-400 uppercase font-bold block">Orders Placed</span>
                <span className="text-base font-black text-stone-900 font-mono">
                  {selectedCustomer.orderCount}
                </span>
              </div>
            </div>

            {/* Address */}
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs space-y-1">
              <span className="text-[10px] text-stone-400 uppercase font-bold block">Delivery Address</span>
              <p className="text-stone-800 font-medium">{selectedCustomer.address}</p>
              <p className="text-stone-500 font-mono text-[11px]">PIN: {selectedCustomer.pincode}</p>
            </div>

            {/* WhatsApp Contact Button */}
            <button
              type="button"
              onClick={() => handleWhatsAppContact(selectedCustomer)}
              className="w-full py-2.5 px-4 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 text-[#25D366]" />
              <span>Contact Customer via WhatsApp</span>
            </button>

            {/* Customer Orders History */}
            <div className="space-y-2 pt-2 border-t border-stone-100">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 block">
                Purchase History ({selectedCustomer.orders.length})
              </span>
              <div className="space-y-2 max-h-60 overflow-y-auto no-scrollbar">
                {selectedCustomer.orders.map(o => (
                  <div
                    key={o.id}
                    onClick={() => onOpenOrder(o)}
                    className="p-2.5 bg-stone-50 hover:bg-amber-50/50 rounded-xl border border-stone-200 text-xs flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <div>
                      <div className="font-mono font-bold text-emerald-950">{o.orderNumber}</div>
                      <div className="text-[10px] text-stone-500">{o.productName} · Qty {o.quantity}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-stone-900">₹{o.totalAmount}</div>
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-stone-200 text-stone-700">
                        {o.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
