
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Utensils, 
  BookOpen, 
  BarChart3, 
  History, 
  Plus, 
  Trash2, 
  Send, 
  Table as TableIcon, 
  Users, 
  ChevronRight,
  Eye,
  EyeOff,
  Edit2,
  Check,
  X,
  CreditCard,
  Save,
  CheckCircle2,
  Clock,
  RotateCcw,
  ShoppingBag,
  DollarSign,
  Banknote,
  Package,
  Link as LinkIcon,
  Archive
} from 'lucide-react';
import { MenuItem, Order, ViewState, Customer, OrderItem, DraftOrder } from './types';
import { INITIAL_MENU, CURRENCY, TABLE_COLORS, TABLE_COLORS_ACTIVE } from './constants';

const TABLES = Array.from({ length: 12 }, (_, i) => `Table ${i + 1}`);

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('pos');
  const [menu, setMenu] = useState<MenuItem[]>(() => {
    const saved = localStorage.getItem('food-shop-menu');
    return saved ? JSON.parse(saved) : INITIAL_MENU;
  });
  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('food-shop-orders');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [draft, setDraft] = useState<DraftOrder>(() => {
    const saved = localStorage.getItem('food-shop-draft');
    return saved ? JSON.parse(saved) : {
      customer: { name: '', contact: '', whatsapp: '' },
      tableNo: '',
      persons: '1',
      items: [],
      paidAmount: '',
      orderType: null
    };
  });

  const [isAdminVisible, setIsAdminVisible] = useState(false);
  const [paymentOrder, setPaymentOrder] = useState<Order | null>(null);
  const [receivedAmount, setReceivedAmount] = useState<string>('');

  useEffect(() => localStorage.setItem('food-shop-menu', JSON.stringify(menu)), [menu]);
  useEffect(() => localStorage.setItem('food-shop-orders', JSON.stringify(orders)), [orders]);
  useEffect(() => localStorage.setItem('food-shop-draft', JSON.stringify(draft)), [draft]);

  const addMenuItem = (name: string, price: number) => {
    setMenu([...menu, { id: Date.now().toString(), name, price }]);
  };

  const updateMenuItem = (id: string, name: string, price: number) => {
    setMenu(menu.map(item => item.id === id ? { ...item, name, price } : item));
  };

  const deleteMenuItem = (id: string) => {
    setMenu(menu.filter(item => item.id !== id));
  };

  const saveOrder = (order: Order) => {
    setOrders(prev => {
      const exists = prev.find(o => o.id === order.id);
      if (exists) {
        return prev.map(o => o.id === order.id ? order : o);
      }
      return [order, ...prev];
    });
    clearDraft();
    setView('history');
  };

  const startSettle = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (order) {
      setPaymentOrder(order);
      setReceivedAmount(order.total.toString());
    }
  };

  const finishPayment = () => {
    if (!paymentOrder) return;
    const paidAmount = parseFloat(receivedAmount) || 0;
    
    if (paidAmount < paymentOrder.total) {
      alert(`Insufficient amount! Minimum: ${CURRENCY} ${paymentOrder.total}`);
      return;
    }

    const updatedOrder: Order = {
      ...paymentOrder,
      status: 'completed',
      paidAmount,
      balance: paidAmount - paymentOrder.total,
      timestamp: Date.now()
    };

    setOrders(prev => prev.map(o => o.id === paymentOrder.id ? updatedOrder : o));
    setPaymentOrder(null);
    setReceivedAmount('');
  };

  const clearDraft = () => {
    setDraft({
      customer: { name: '', contact: '', whatsapp: '' },
      tableNo: '',
      persons: '1',
      items: [],
      paidAmount: '',
      orderType: null
    });
  };

  const handleEditFromHistory = (order: Order) => {
    setDraft({
      editingOrderId: order.id,
      customer: order.customer,
      tableNo: order.tableNo,
      persons: order.persons.toString(),
      items: order.items,
      paidAmount: (order.paidAmount || order.total).toString(),
      orderType: order.orderType
    });
    setView('pos');
  };

  const activeTablesData = useMemo(() => {
    return orders.filter(o => o.status === 'active' && o.orderType === 'Dine In');
  }, [orders]);

  const activeTableNames = activeTablesData.map(o => o.tableNo);

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-900 overflow-hidden select-none">
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center z-20 shadow-sm shrink-0 pt-[env(safe-area-inset-top,16px)]">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-100 rounded-lg">
            <Utensils className="text-emerald-600 w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800 leading-none">Oh My Dosa!</h1>
            <span className="text-[10px] text-emerald-600 font-black uppercase tracking-wider">Mobile POS</span>
          </div>
        </div>
        <button 
          onClick={() => setIsAdminVisible(!isAdminVisible)}
          className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-emerald-600 transition-colors bg-slate-50 px-3 py-1.5 rounded-full"
        >
          {isAdminVisible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-6xl mx-auto pb-48"> 
          {view === 'pos' && (
            <POSView 
              menu={menu} 
              draft={draft} 
              setDraft={setDraft} 
              onOrderSave={saveOrder} 
              onClear={clearDraft}
              activeTables={activeTablesData}
              onEdit={handleEditFromHistory}
            />
          )}
          {view === 'menu' && (
            <MenuView 
              menu={menu} 
              onAdd={addMenuItem} 
              onUpdate={updateMenuItem} 
              onDelete={deleteMenuItem} 
            />
          )}
          {view === 'history' && <HistoryView orders={orders} onEdit={handleEditFromHistory} onSettle={startSettle} />}
          {view === 'reports' && <ReportsView orders={orders} visible={isAdminVisible} />}
        </div>
      </main>

      {/* Payment Modal */}
      {paymentOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-black text-slate-800">Payment</h2>
                  <p className="text-sm font-bold text-slate-400">{paymentOrder.customer.name} • {paymentOrder.tableNo}</p>
                </div>
                <button onClick={() => setPaymentOrder(null)} className="p-2 bg-slate-50 rounded-full text-slate-400">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="bg-slate-50 p-6 rounded-3xl flex justify-between items-center">
                  <span className="text-sm font-black text-slate-400 uppercase tracking-widest">Total Bill</span>
                  <span className="text-3xl font-black text-slate-900">{CURRENCY} {paymentOrder.total.toLocaleString()}</span>
                </div>

                <div>
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Cash Received</label>
                  <div className="relative">
                    <Banknote className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={24} />
                    <input 
                      autoFocus
                      type="number" 
                      className="w-full pl-14 pr-6 py-5 bg-white border-2 border-slate-100 rounded-3xl outline-none focus:border-emerald-500 transition-all font-black text-2xl text-slate-800"
                      value={receivedAmount}
                      onChange={e => setReceivedAmount(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && finishPayment()}
                    />
                  </div>
                </div>

                <div className={`p-6 rounded-3xl flex justify-between items-center border-2 ${parseFloat(receivedAmount) >= paymentOrder.total ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                  <span className="text-sm font-black text-slate-500 uppercase tracking-widest">Balance</span>
                  <span className={`text-2xl font-black ${parseFloat(receivedAmount) >= paymentOrder.total ? 'text-emerald-600' : 'text-red-500'}`}>
                    {CURRENCY} {(Math.max(0, (parseFloat(receivedAmount) || 0) - paymentOrder.total)).toLocaleString()}
                  </span>
                </div>

                <button 
                  onClick={finishPayment}
                  className="w-full py-6 bg-emerald-600 text-white rounded-3xl font-black text-xl shadow-xl shadow-emerald-100 flex items-center justify-center gap-3"
                >
                  <Check size={28} /> Paid & Settle
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t px-6 py-3 pb-[env(safe-area-inset-bottom,12px)] flex justify-around items-center shadow-[0_-4px_20px_rgba(0,0,0,0.1)] z-50 shrink-0">
        <NavButton active={view === 'pos'} onClick={() => setView('pos')} icon={<Plus size={22}/>} label="Order" />
        <NavButton active={view === 'menu'} onClick={() => setView('menu')} icon={<BookOpen size={22}/>} label="Menu" />
        <NavButton active={view === 'history'} onClick={() => setView('history')} icon={<History size={22}/>} label="Log" />
        <NavButton active={view === 'reports'} onClick={() => setView('reports'} icon={<BarChart3 size={22}/>} label="Income" />
      </nav>
    </div>
  );
};

const NavButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${active ? 'text-emerald-600 bg-emerald-50 scale-110' : 'text-slate-400'}`}>
    {icon}
    <span className="text-[10px] font-black uppercase tracking-wider">{label}</span>
  </button>
);

const POSView: React.FC<{ 
  menu: MenuItem[]; 
  draft: DraftOrder; 
  setDraft: React.Dispatch<React.SetStateAction<DraftOrder>>;
  onOrderSave: (order: Order) => void;
  onClear: () => void;
  activeTables: Order[];
  onEdit: (order: Order) => void;
}> = ({ menu, draft, setDraft, onOrderSave, onClear, activeTables, onEdit }) => {
  const qtyInputRefs = useRef<Map<string, HTMLInputElement | null>>(new Map());
  const [lastAddedId, setLastAddedId] = useState<string | null>(null);
  const [takeAwaySubMode, setTakeAwaySubMode] = useState<'selection' | 'ordering' | null>(null);

  const activeTableNames = activeTables.map(o => o.tableNo);

  useEffect(() => {
    if (lastAddedId) {
      const el = qtyInputRefs.current.get(lastAddedId);
      if (el) { el.focus(); el.select(); }
      setLastAddedId(null);
    }
  }, [lastAddedId]);

  const selectType = (type: 'Dine In' | 'Take Away') => {
    if (type === 'Take Away') {
      setTakeAwaySubMode('selection');
    } else {
      setDraft({ ...draft, orderType: type, tableNo: '' });
    }
  };

  const startNewTakeAway = () => {
    const tableNo = `TA-${Math.floor(Math.random() * 900) + 100}`;
    setDraft({ ...draft, orderType: 'Take Away', tableNo });
    setTakeAwaySubMode('ordering');
  };

  const linkToActiveTable = (order: Order) => {
    onEdit(order);
    setTakeAwaySubMode('ordering');
  };
  
  const addToOrder = (item: MenuItem) => {
    setDraft(prev => {
      const existing = prev.items.find(i => i.menuId === item.id);
      let newItems;
      if (existing) {
        newItems = prev.items.map(i => i.menuId === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      } else {
        // Logic 1: If we started from Take-Away flow (even if linked to table), default to Packed
        const defaultPacked = takeAwaySubMode === 'ordering' || prev.orderType === 'Take Away';
        newItems = [...prev.items, { 
          menuId: item.id, 
          name: item.name, 
          price: item.price, 
          quantity: 1, 
          isPacked: defaultPacked 
        }];
      }
      return { ...prev, items: newItems };
    });
    setLastAddedId(item.id);
  };

  const updateQuantity = (menuId: string, value: string) => {
    const num = parseInt(value) || 0;
    setDraft(prev => ({
      ...prev,
      items: prev.items.map(item => item.menuId === menuId ? { ...item, quantity: Math.max(0, num) } : item).filter(i => i.quantity > 0)
    }));
  };

  const togglePack = (menuId: string) => {
    setDraft(prev => ({
      ...prev,
      items: prev.items.map(item => item.menuId === menuId ? { ...item, isPacked: !item.isPacked } : item)
    }));
  };

  const total = draft.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleSubmit = () => {
    if ((!draft.tableNo && draft.orderType === 'Dine In') || draft.items.length === 0 || !draft.customer.name) {
      alert('Required: Name, Table/Token, and Items.');
      return;
    }
    
    const order: Order = {
      id: draft.editingOrderId || Date.now().toString(),
      tableNo: draft.tableNo,
      persons: parseInt(draft.persons) || 1,
      customer: draft.customer,
      items: draft.items,
      total,
      timestamp: Date.now(),
      status: 'active',
      orderType: draft.orderType as 'Dine In' | 'Take Away'
    };
    onOrderSave(order);
    setTakeAwaySubMode(null);
  };

  if (!draft.orderType && !takeAwaySubMode) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-in fade-in zoom-in-95">
        <h2 className="text-2xl font-black text-slate-800 mb-10">Choose Order Mode</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl px-4">
          <button 
            onClick={() => selectType('Take Away')}
            className="flex flex-col items-center gap-6 p-10 bg-slate-800 text-white rounded-[3rem] shadow-xl hover:scale-105 active:scale-95 transition-all"
          >
            <div className="p-6 bg-white/10 rounded-full"><ShoppingBag size={64} /></div>
            <div className="text-center">
              <div className="text-2xl font-black">Take Away</div>
              <p className="text-xs text-slate-400 mt-2 font-bold">Token or Active Table Link</p>
            </div>
          </button>
          <button 
            onClick={() => selectType('Dine In')}
            className="flex flex-col items-center gap-6 p-10 bg-emerald-600 text-white rounded-[3rem] shadow-xl hover:scale-105 active:scale-95 transition-all shadow-emerald-200"
          >
            <div className="p-6 bg-white/10 rounded-full"><Utensils size={64} /></div>
            <div className="text-center">
              <div className="text-2xl font-black">Stay Table</div>
              <p className="text-xs text-emerald-100 mt-2 font-bold">Select table for customer</p>
            </div>
          </button>
        </div>
      </div>
    );
  }

  if (takeAwaySubMode === 'selection' && !draft.orderType) {
    return (
      <div className="flex flex-col items-center justify-center py-10 animate-in fade-in slide-in-from-bottom-4">
        <div className="w-full max-w-2xl px-4 space-y-10">
          <div className="flex items-center gap-4">
            <button onClick={() => setTakeAwaySubMode(null)} className="p-2 bg-slate-200 rounded-full text-slate-600"><RotateCcw size={20}/></button>
            <h2 className="text-2xl font-black text-slate-800">Take Away Options</h2>
          </div>

          <button 
            onClick={startNewTakeAway}
            className="w-full flex items-center justify-between p-8 bg-white border-2 border-slate-100 rounded-[2.5rem] shadow-sm hover:border-slate-800 transition-all group"
          >
            <div className="flex items-center gap-6">
              <div className="p-4 bg-slate-100 rounded-full text-slate-800 group-hover:bg-slate-800 group-hover:text-white transition-colors"><Plus size={32} /></div>
              <div className="text-left">
                <div className="text-xl font-black text-slate-800">New Take-Away Order</div>
                <p className="text-sm text-slate-400 font-bold">For new walk-in customers</p>
              </div>
            </div>
            <ChevronRight className="text-slate-200" size={32} />
          </button>

          <div className="space-y-4">
            <div className="flex items-center gap-2 px-2">
              <LinkIcon size={16} className="text-emerald-500" />
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Link to Active Stay Tables</h3>
            </div>
            
            {activeTables.length === 0 ? (
              <div className="p-8 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] text-center text-slate-400 font-bold">
                No active tables found
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {activeTables.map(order => {
                  const tableIdx = parseInt(order.tableNo.split(' ')[1]) - 1;
                  return (
                    <button 
                      key={order.id}
                      onClick={() => linkToActiveTable(order)}
                      className={`flex items-center justify-between p-6 border-2 rounded-[2rem] shadow-sm hover:scale-[1.02] transition-all text-left ${TABLE_COLORS[tableIdx] || 'bg-white border-slate-100'}`}
                    >
                      <div>
                        <div className="text-sm font-black uppercase tracking-tighter mb-1">{order.tableNo}</div>
                        <div className="text-lg font-black truncate max-w-[150px]">{order.customer.name}</div>
                      </div>
                      <div className="p-2 rounded-full bg-white/40"><Plus size={20} /></div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in slide-in-from-bottom-4">
      <div className="space-y-6">
        <header className="flex items-center justify-between">
           <div className="flex items-center gap-3">
             <button onClick={() => { onClear(); setTakeAwaySubMode(null); }} className="p-2 bg-slate-200 rounded-full text-slate-600 hover:bg-red-50 hover:text-red-500 transition-all"><RotateCcw size={18}/></button>
             <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">
               {draft.editingOrderId ? 'Updating Bill' : `New ${draft.orderType}`}
             </h2>
           </div>
           <div className={`px-4 py-2 rounded-full font-black text-xs ${draft.orderType === 'Take Away' ? 'bg-slate-800 text-white' : 'bg-emerald-600 text-white'}`}>
             {draft.tableNo || 'Selecting...'}
           </div>
        </header>

        {draft.orderType === 'Dine In' && !draft.editingOrderId && (
          <section className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Select Table</h2>
            <div className="grid grid-cols-4 gap-2">
              {TABLES.map((t, idx) => {
                const isOccupied = activeTableNames.includes(t) && draft.tableNo !== t;
                const isSelected = draft.tableNo === t;
                return (
                  <button
                    key={t}
                    disabled={isOccupied}
                    onClick={() => setDraft({ ...draft, tableNo: t })}
                    className={`py-4 rounded-2xl border text-sm font-black transition-all ${
                      isSelected ? 'ring-4 ring-offset-2 ring-emerald-500 shadow-lg scale-105' : ''
                    } ${
                      isOccupied ? 'bg-slate-50 border-slate-100 text-slate-200 opacity-40' : TABLE_COLORS[idx]
                    }`}
                  >
                    {t.split(' ')[1]}
                  </button>
                );
              })}
            </div>
          </section>
        )}

        <section className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-black mb-4 flex items-center gap-2 text-slate-800"><Users size={18} className="text-emerald-600" /> Customer</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <input 
                type="text" placeholder="Customer Name"
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold"
                value={draft.customer.name}
                onChange={e => setDraft({...draft, customer: {...draft.customer, name: e.target.value}})}
              />
            </div>
            <div>
              <input 
                type="tel" placeholder="WhatsApp Number"
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold"
                value={draft.customer.whatsapp}
                onChange={e => setDraft({...draft, customer: {...draft.customer, whatsapp: e.target.value}})}
              />
            </div>
            <div>
              <input 
                type="number" placeholder="Persons"
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold"
                value={draft.persons}
                onChange={e => setDraft({...draft, persons: e.target.value})}
              />
            </div>
          </div>
        </section>

        <section className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-black mb-4 text-slate-800">Menu Items</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {menu.map(item => (
              <button
                key={item.id}
                onClick={() => addToOrder(item)}
                className="p-3 text-left border border-slate-100 bg-slate-50 rounded-2xl hover:bg-emerald-50 active:scale-95 transition-all"
              >
                <div className="font-bold text-slate-800 text-sm truncate">{item.name}</div>
                <div className="text-xs font-black text-emerald-600">{CURRENCY} {item.price}</div>
              </button>
            ))}
          </div>
        </section>
      </div>

      <div className="flex flex-col">
        <section className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-200 sticky top-4">
          <h2 className="text-lg font-black mb-4 text-slate-800">Order Summary</h2>
          <div className="overflow-y-auto mb-6 max-h-[380px] min-h-[100px] pr-1">
            {draft.items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-300">
                <Utensils size={40} className="opacity-10 mb-4" />
                <p className="text-xs font-black uppercase tracking-widest">Add some food</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <tbody className="divide-y divide-slate-50">
                  {draft.items.map(item => (
                    <tr key={item.menuId}>
                      <td className="py-4 pr-2">
                        <div className="font-black text-slate-700">{item.name}</div>
                        <button 
                          onClick={() => togglePack(item.menuId)}
                          className={`mt-1 flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 rounded-full transition-colors ${item.isPacked ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}
                        >
                          {item.isPacked ? <Package size={10} /> : <Utensils size={10} />} 
                          {item.isPacked ? 'PACKED/TO-GO' : 'EAT HERE'}
                        </button>
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-2 py-1">
                          <input 
                            ref={(el) => qtyInputRefs.current.set(item.menuId, el)}
                            type="number" className="w-10 text-center font-black bg-transparent outline-none"
                            value={item.quantity}
                            onChange={e => updateQuantity(item.menuId, e.target.value)}
                          />
                        </div>
                      </td>
                      <td className="py-4 text-right font-black text-slate-800">{(item.price * item.quantity).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="space-y-4 pt-6 border-t-2 border-dashed border-slate-100">
            <div className="bg-slate-900 rounded-[2rem] p-7 text-white flex justify-between items-center shadow-lg">
              <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Total Bill</span>
              <span className="text-3xl font-black">{CURRENCY} {total.toLocaleString()}</span>
            </div>
            <button 
              onClick={handleSubmit}
              disabled={draft.items.length === 0}
              className={`w-full py-6 rounded-[2rem] font-black text-lg shadow-xl active:scale-95 transition-all text-white ${draft.orderType === 'Take Away' && !draft.editingOrderId ? 'bg-slate-800' : 'bg-emerald-600 shadow-emerald-100'}`}
            >
              {draft.editingOrderId ? 'Update Bill' : `Confirm ${draft.orderType} Order`}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

const MenuView: React.FC<{ menu: MenuItem[]; onAdd: (n: string, p: number) => void; onUpdate: (id: string, n: string, p: number) => void; onDelete: (id: string) => void; }> = ({ menu, onAdd, onUpdate, onDelete }) => {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');

  const handleAdd = () => { if (!name || !price) return; onAdd(name, parseFloat(price)); setName(''); setPrice(''); };
  const startEdit = (item: MenuItem) => { setEditingId(item.id); setEditName(item.name); setEditPrice(item.price.toString()); };
  const saveEdit = () => { if (editingId && editName && editPrice) { onUpdate(editingId, editName, parseFloat(editPrice)); setEditingId(null); } };

  return (
    <div className="max-w-xl mx-auto space-y-8">
      <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200">
        <h2 className="text-xl font-black text-slate-800 mb-6">Master Menu</h2>
        <div className="flex flex-col gap-3 mb-8">
          <input type="text" placeholder="Item Name" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" value={name} onChange={e => setName(e.target.value)} />
          <div className="flex gap-2">
            <input type="number" placeholder="Price" className="flex-1 px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black" value={price} onChange={e => setPrice(e.target.value)} />
            <button onClick={handleAdd} className="px-8 py-4 bg-emerald-600 text-white font-black rounded-2xl">Add</button>
          </div>
        </div>
        <div className="grid gap-2">
          {menu.map(item => (
            <div key={item.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-4">
              {editingId === item.id ? (
                <div className="flex-1 flex gap-2">
                  <input type="text" className="flex-1 px-3 py-1 border rounded-lg" value={editName} onChange={e => setEditName(e.target.value)} />
                  <button onClick={saveEdit} className="p-2 bg-emerald-600 text-white rounded-lg"><Check size={18} /></button>
                </div>
              ) : (
                <>
                  <div className="flex-1">
                    <div className="font-black text-slate-800">{item.name}</div>
                    <div className="text-xs font-bold text-emerald-600">{CURRENCY} {item.price}</div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => startEdit(item)} className="p-2 text-slate-400"><Edit2 size={16}/></button>
                    <button onClick={() => onDelete(item.id)} className="p-2 text-slate-300"><Trash2 size={16}/></button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

const HistoryView: React.FC<{ orders: Order[]; onEdit: (o: Order) => void; onSettle: (id: string) => void }> = ({ orders, onEdit, onSettle }) => {
  const [showCompleted, setShowCompleted] = useState(false);

  const activeTakeAwayCount = orders.filter(o => o.status === 'active' && o.orderType === 'Take Away').length;
  const activeTableCount = orders.filter(o => o.status === 'active' && o.orderType === 'Dine In').length;

  const displayedOrders = useMemo(() => {
    return orders.filter(o => showCompleted ? true : o.status === 'active');
  }, [orders, showCompleted]);

  const sendWhatsApp = (order: Order) => {
    const cleanPhone = order.customer.whatsapp.replace(/\D/g, '');
    const phone = cleanPhone.startsWith('94') ? cleanPhone : '94' + (cleanPhone.startsWith('0') ? cleanPhone.slice(1) : cleanPhone);
    let text = `*Oh My Dosa! Bill*%0A%0A`;
    text += `Customer: *${order.customer.name}*%0A`;
    text += `Type: *${order.orderType} (${order.tableNo})*%0A`;
    text += `---------------------------%0A`;
    order.items.forEach(item => {
      text += `• ${item.name} x ${item.quantity} ${item.isPacked ? '(📦 PACKED)' : '(🍽️ EAT HERE)'} = ${CURRENCY} ${item.price * item.quantity}%0A`;
    });
    text += `---------------------------%0A`;
    text += `*Total: ${CURRENCY} ${order.total.toLocaleString()}*%0A`;
    if (order.status === 'completed') {
      text += `*Paid: ${CURRENCY} ${order.paidAmount?.toLocaleString()}*%0A`;
      text += `*Balance: ${CURRENCY} ${order.balance?.toLocaleString()}*%0A`;
    }
    text += `---------------------------%0A%0AThank you!`;
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
  };

  return (
    <div className="space-y-4">
      {/* Active Tracking Bar */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-800 p-4 rounded-2xl text-white">
          <div className="flex items-center gap-1.5 mb-0.5">
            <ShoppingBag size={14} className="text-slate-400" />
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Take-Away</span>
          </div>
          <div className="text-2xl font-black">{activeTakeAwayCount}</div>
        </div>
        <div className="bg-emerald-600 p-4 rounded-2xl text-white shadow-lg shadow-emerald-100">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Utensils size={14} className="text-emerald-100" />
            <span className="text-[9px] font-black uppercase tracking-widest text-emerald-100">Tables</span>
          </div>
          <div className="text-2xl font-black">{activeTableCount}</div>
        </div>
      </div>

      <div className="flex justify-between items-center px-1 mt-2">
        <h2 className="text-lg font-black text-slate-800">Recent Sales</h2>
        <button 
          onClick={() => setShowCompleted(!showCompleted)}
          className={`flex items-center gap-2 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full transition-all ${
            showCompleted ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-600'
          }`}
        >
          {showCompleted ? <Eye size={12} /> : <Archive size={12} />}
          {showCompleted ? 'All' : 'Paid'}
        </button>
      </div>

      <div className="grid gap-3">
        {displayedOrders.length === 0 ? (
          <div className="text-center py-10 text-slate-300 font-bold uppercase tracking-widest text-xs">
            {showCompleted ? 'No records' : 'All clear'}
          </div>
        ) : (
          displayedOrders.map(order => {
            const tableIdx = order.orderType === 'Dine In' ? parseInt(order.tableNo.split(' ')[1]) - 1 : -1;
            const tableClass = tableIdx >= 0 ? TABLE_COLORS[tableIdx] : 'bg-slate-800 text-white';
            
            return (
              <div key={order.id} className={`bg-white rounded-3xl shadow-sm border overflow-hidden transition-all ${order.status === 'completed' ? 'border-slate-100 opacity-75 scale-[0.98]' : 'border-amber-100 ring-2 ring-amber-50'}`}>
                <div className="p-4">
                  <div className="flex justify-between items-center mb-3">
                    <div className={`px-3 py-1 rounded-xl font-black text-[10px] uppercase ${tableClass}`}>
                      {order.tableNo}
                    </div>
                    <div className="flex gap-1.5">
                      {order.items.some(i => i.isPacked) && (
                        <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-[8px] font-black uppercase flex items-center gap-0.5">
                          <Package size={8} /> Pack
                        </span>
                      )}
                      <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase ${order.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {order.status === 'completed' ? 'Paid' : 'Due'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-baseline mb-0.5">
                    <div className="font-black text-lg text-slate-800 truncate pr-4">{order.customer.name}</div>
                    <div className="text-xl font-black text-slate-900 shrink-0">{CURRENCY} {order.total.toLocaleString()}</div>
                  </div>
                  
                  <div className="text-[9px] text-slate-400 font-black uppercase mb-3 flex items-center gap-1.5">
                    <Clock size={10} /> {new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {order.items.length} ITM
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-2xl text-[10px] text-slate-600 font-bold mb-3 leading-relaxed flex flex-wrap gap-x-2">
                    {order.items.map((item, idx) => (
                      <span key={idx} className={item.isPacked ? 'text-amber-600' : 'text-emerald-700'}>
                        {item.name}{item.quantity > 1 ? ` (${item.quantity})` : ''}{item.isPacked ? '📦' : '🍽️'} 
                      </span>
                    ))}
                  </div>
                  
                  <div className="flex justify-between items-center pt-3 border-t border-slate-50">
                     <div className="flex gap-1.5">
                       <button onClick={() => sendWhatsApp(order)} className="p-2.5 bg-slate-50 text-emerald-600 rounded-xl hover:bg-emerald-50 shadow-sm">
                         <Send size={18} />
                       </button>
                       <button onClick={() => onEdit(order)} className="p-2.5 bg-slate-50 text-slate-400 rounded-xl shadow-sm">
                         <Edit2 size={18} />
                       </button>
                     </div>
                     {order.status === 'active' ? (
                       <button 
                         onClick={() => onSettle(order.id)}
                         className="px-5 py-2.5 bg-amber-500 text-white rounded-xl font-black text-[11px] flex items-center gap-1.5 shadow-md shadow-amber-50 active:scale-95"
                       >
                         <Banknote size={16} /> Pay Bill
                       </button>
                     ) : (
                       <div className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                         <CheckCircle2 size={14} /> Closed
                       </div>
                     )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

const ReportsView: React.FC<{ orders: Order[]; visible: boolean }> = ({ orders, visible }) => {
  const stats = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const result = { today: 0, month: 0, count: 0 };
    orders.filter(o => o.status === 'completed').forEach(o => {
      if (o.timestamp >= todayStart) { result.today += o.total; result.count++; }
      result.month += o.total;
    });
    return result;
  }, [orders]);

  if (!visible) return (
    <div className="flex flex-col items-center justify-center py-40 text-slate-300">
      <EyeOff size={64} className="opacity-10 mb-4" />
      <p className="text-xs font-black uppercase tracking-widest">Toggle Header Icon to view Income</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-in zoom-in-95">
      <h2 className="text-2xl font-black text-slate-800">Financial Insights</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-emerald-600 p-10 rounded-[3rem] text-white shadow-2xl shadow-emerald-100">
          <div className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Daily Revenue</div>
          <div className="text-5xl font-black">{CURRENCY} {stats.today.toLocaleString()}</div>
          <div className="mt-4 text-[11px] font-bold bg-white/20 px-4 py-2 rounded-full inline-block">{stats.count} Bills Closed Today</div>
        </div>
        <div className="bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl">
          <div className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Total Accumulated</div>
          <div className="text-5xl font-black">{CURRENCY} {stats.month.toLocaleString()}</div>
        </div>
      </div>
    </div>
  );
};

export default App;
