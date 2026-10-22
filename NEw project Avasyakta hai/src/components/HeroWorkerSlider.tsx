import {
  HardHat,
  Zap,
  Package,
  UtensilsCrossed,
  Car,
  Hammer,
  Paintbrush,
  Wrench,
  Building2,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Truck,
} from 'lucide-react';

interface WorkerSlideItem {
  id: string;
  roleEn: string;
  roleHi: string;
  category: string;
  imageUrl: string;
  icon: React.ReactNode;
  tag: string;
}

const ROW_1_WORKERS: WorkerSlideItem[] = [
  {
    id: 'w1',
    roleEn: 'Construction Worker',
    roleHi: 'निर्माण कारीगर / राजमिस्त्री',
    category: 'Construction',
    imageUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&auto=format&fit=crop&q=80',
    icon: <HardHat size={14} className="text-amber-400" />,
    tag: 'Daily Wage / दैनिक',
  },
  {
    id: 'w2',
    roleEn: 'Certified Electrician',
    roleHi: 'बिजली कारीगर / इलेक्ट्रीशियन',
    category: 'Electrician',
    imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&auto=format&fit=crop&q=80',
    icon: <Zap size={14} className="text-yellow-400" />,
    tag: 'Verified / सत्यापित',
  },
  {
    id: 'w3',
    roleEn: 'Delivery Partner',
    roleHi: 'डिलीवरी बॉय / कूरियर',
    category: 'Delivery',
    imageUrl: 'https://images.unsplash.com/photo-1617347454431-f49d7ff5c3b1?w=600&auto=format&fit=crop&q=80',
    icon: <Package size={14} className="text-emerald-400" />,
    tag: 'Bike / Auto',
  },
  {
    id: 'w4',
    roleEn: 'Restaurant Chef & Cook',
    roleHi: 'होटल शेफ / रसोइया',
    category: 'Cook',
    imageUrl: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=600&auto=format&fit=crop&q=80',
    icon: <UtensilsCrossed size={14} className="text-orange-400" />,
    tag: 'Full Time / पार्ट टाइम',
  },
  {
    id: 'w5',
    roleEn: 'Commercial Driver',
    roleHi: 'वाहन चालक / पर्सनल ड्राइवर',
    category: 'Driver',
    imageUrl: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=600&auto=format&fit=crop&q=80',
    icon: <Car size={14} className="text-blue-400" />,
    tag: 'DL Verified',
  },
  {
    id: 'w6',
    roleEn: 'Expert Carpenter',
    roleHi: 'बढ़ई / फर्नीचर मेकर',
    category: 'Carpenter',
    imageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&auto=format&fit=crop&q=80',
    icon: <Hammer size={14} className="text-amber-300" />,
    tag: 'Woodwork',
  },
  {
    id: 'w7',
    roleEn: 'House Painter',
    roleHi: 'पेंटर / रंगाई पुट्टी',
    category: 'Painter',
    imageUrl: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=600&auto=format&fit=crop&q=80',
    icon: <Paintbrush size={14} className="text-pink-400" />,
    tag: 'Contract / ठेका',
  },
  {
    id: 'w8',
    roleEn: 'Plumber & Pipe Fitter',
    roleHi: 'प्लम्बर / नलसाज',
    category: 'Plumber',
    imageUrl: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=600&auto=format&fit=crop&q=80',
    icon: <Wrench size={14} className="text-cyan-400" />,
    tag: 'Emergency / 24x7',
  },
];

const ROW_2_WORKERS: WorkerSlideItem[] = [
  {
    id: 'w9',
    roleEn: 'Warehouse Helper',
    roleHi: 'गोदाम हेल्पर / लोडिंग',
    category: 'Warehouse',
    imageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&auto=format&fit=crop&q=80',
    icon: <Truck size={14} className="text-lime-400" />,
    tag: 'Logistics / लॉजिस्टिक्स',
  },
  {
    id: 'w10',
    roleEn: 'Housekeeping & Cleaner',
    roleHi: 'सफाई कर्मी / हाउसकीपिंग',
    category: 'Housekeeping',
    imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&auto=format&fit=crop&q=80',
    icon: <Sparkles size={14} className="text-teal-400" />,
    tag: 'Office / Home',
  },
  {
    id: 'w11',
    roleEn: 'Equipment Technician',
    roleHi: 'उपकरण तकनीशियन / रिपेयर',
    category: 'Technician',
    imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80',
    icon: <Wrench size={14} className="text-indigo-400" />,
    tag: 'Expertise',
  },
  {
    id: 'w12',
    roleEn: 'Direct Recruiter Hiring',
    roleHi: 'सीधी भर्ती / भरोसेमंद संपर्क',
    category: 'Direct Connect',
    imageUrl: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=600&auto=format&fit=crop&q=80',
    icon: <CheckCircle2 size={14} className="text-emerald-400" />,
    tag: 'Zero Commission',
  },
  {
    id: 'w13',
    roleEn: 'Security Personnel',
    roleHi: 'सुरक्षा गार्ड / चौकीदार',
    category: 'Security',
    imageUrl: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?w=600&auto=format&fit=crop&q=80',
    icon: <ShieldCheck size={14} className="text-purple-400" />,
    tag: 'Day / Night Shift',
  },
  {
    id: 'w14',
    roleEn: 'Factory & Plant Worker',
    roleHi: 'फैक्ट्री कारीगर / ऑपरेटर',
    category: 'Manufacturing',
    imageUrl: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600&auto=format&fit=crop&q=80',
    icon: <Building2 size={14} className="text-amber-400" />,
    tag: 'Industrial',
  },
  {
    id: 'w15',
    roleEn: 'Automobile Mechanic',
    roleHi: 'मोटर मैकेनिक / गैराज',
    category: 'Mechanic',
    imageUrl: 'https://images.unsplash.com/photo-1530046339160-ce3e530c7d2f?w=600&auto=format&fit=crop&q=80',
    icon: <Wrench size={14} className="text-red-400" />,
    tag: '2 & 4 Wheeler',
  },
  {
    id: 'w16',
    roleEn: 'Office Assistant / Peon',
    roleHi: 'ऑफिस असिस्टेंट / प्यून',
    category: 'Peon',
    imageUrl: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=600&auto=format&fit=crop&q=80',
    icon: <Package size={14} className="text-sky-400" />,
    tag: 'Full Time',
  },
];

export function HeroWorkerSlider() {
  // Duplicate arrays to create seamless infinite loops
  const row1Items = [...ROW_1_WORKERS, ...ROW_1_WORKERS];
  const row2Items = [...ROW_2_WORKERS, ...ROW_2_WORKERS];

  return (
    <div className="hero-slider-wrap pointer-events-none absolute inset-0 overflow-hidden select-none z-0 hero-slider-mask">
      {/* Subtle Background Glow behind slides */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 rounded-full bg-emerald-300/20 dark:bg-emerald-600/10 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-96 h-96 rounded-full bg-teal-300/20 dark:bg-teal-600/10 blur-3xl pointer-events-none" />

      <div className="flex flex-col justify-between h-full py-4 opacity-85 dark:opacity-40">
        {/* ROW 1: Slides Left smoothly */}
        <div className="overflow-hidden w-full flex items-center">
          <div className="animate-hero-slide-left flex items-center gap-6 py-2">
            {row1Items.map((worker, index) => (
              <div
                key={`${worker.id}-${index}`}
                className="relative shrink-0 w-56 sm:w-64 md:w-72 h-64 sm:h-72 md:h-80 rounded-3xl overflow-hidden shadow-2xl border-4 border-white/90 dark:border-stone-800/90 bg-stone-200 dark:bg-stone-800"
              >
                  <img
                    src={worker.imageUrl}
                    alt={worker.roleEn}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />

                  {/* Gradient shadow for text contrast */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

                  {/* Top Badge */}
                  <div className="absolute top-3 right-3">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-emerald-300 border border-emerald-500/30 shadow-xs">
                      <CheckCircle2 size={11} className="text-emerald-400" />
                      {worker.tag}
                    </span>
                  </div>

                  {/* Bottom Worker Information */}
                  <div className="absolute bottom-3.5 left-3.5 right-3.5">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/15 backdrop-blur-md text-white text-xs font-semibold mb-1 border border-white/20">
                      {worker.icon}
                      <span className="truncate">{worker.category}</span>
                    </div>
                    <div className="text-white font-extrabold text-sm leading-tight drop-shadow-md">
                      {worker.roleHi}
                    </div>
                    <div className="text-stone-300 text-[11px] font-medium leading-none mt-0.5 truncate drop-shadow-xs">
                      {worker.roleEn}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* ROW 2: Slides Right smoothly */}
        <div className="overflow-hidden w-full flex items-center">
          <div className="animate-hero-slide-right flex items-center gap-6 py-2">
            {row2Items.map((worker, index) => (
              <div
                key={`${worker.id}-${index}`}
                className="relative shrink-0 w-56 sm:w-64 md:w-72 h-64 sm:h-72 md:h-80 rounded-3xl overflow-hidden shadow-2xl border-4 border-white/90 dark:border-stone-800/90 bg-stone-200 dark:bg-stone-800"
              >
                  <img
                    src={worker.imageUrl}
                    alt={worker.roleEn}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />

                  {/* Gradient shadow for text contrast */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

                  {/* Top Badge */}
                  <div className="absolute top-3 right-3">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-emerald-300 border border-emerald-500/30 shadow-xs">
                      <CheckCircle2 size={11} className="text-emerald-400" />
                      {worker.tag}
                    </span>
                  </div>

                  {/* Bottom Worker Information */}
                  <div className="absolute bottom-3.5 left-3.5 right-3.5">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/15 backdrop-blur-md text-white text-xs font-semibold mb-1 border border-white/20">
                      {worker.icon}
                      <span className="truncate">{worker.category}</span>
                    </div>
                    <div className="text-white font-extrabold text-sm leading-tight drop-shadow-md">
                      {worker.roleHi}
                    </div>
                    <div className="text-stone-300 text-[11px] font-medium leading-none mt-0.5 truncate drop-shadow-xs">
                      {worker.roleEn}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
