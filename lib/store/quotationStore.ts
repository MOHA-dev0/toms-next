import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Domain Models
export interface Passenger {
  id: string; // client-side temporary ID
  name: string;
  type: 'adult' | 'child' | 'infant';
  passport?: string;
}

export interface HotelSegment {
  id: string;
  checkIn: Date;
  checkOut: Date;
  cityId: string;
  hotelId: string;
  roomTypeId: string;
  boardType: string;
  roomsCount: number;
  usage: 'sgl' | 'dbl' | 'tpl' | 'quad';
  purchasePrice: number;
  sellingPrice: number;
  currency: string;
  notes?: string;
  isVoucherVisible: boolean;
}

export interface ServiceItem {
  id: string;
  dayNumber: number; // For daily program
  date: Date;
  serviceId: string;
  name: string; // For custom/other services
  quantity: number;
  purchasePrice: number;
  sellingPrice: number;
  currency: string;
  notes?: string;
}

export interface FlightSegment {
  id: string;
  date: Date;
  description: string; // Service (e.g. ANKARA TO ISTANBUL)
  type: 'domestic' | 'international';
  paxCount: number;
  price: number; // User just said "Price", assuming selling price
  currency: string;
}

export interface CarRental {
  id: string;
  pickupDate: Date;
  dropoffDate: Date;
  days: number;
  description: string; // Service (Car details & route)
  price: number;
  currency: string;
}

export interface QuotationState {
  // Step 1: Basic Info
  basicInfo: {
    channel: 'b2b' | 'b2c';
    agencyId?: string;
    salesPersonId?: string;
    referenceNumber?: string;
    quotationId?: string;
    companyId?: string;
    destinationCityIds: string[];
    adults: number;
    children: number;
    infants: number;
    passengers: Passenger[];
    nights?: number;
    startDate?: Date;
    endDate?: Date;
  };

  // Steps 2-6 Data
  hotelSegments: HotelSegment[];
  itineraryServices: ServiceItem[];
  otherServices: ServiceItem[];
  
  isFlightsEnabled: boolean;
  flights: FlightSegment[];
  
  isCarsEnabled: boolean;
  carRentals: CarRental[];

  // Step 7: Financials
  financials: {
    marginType: 'percentage' | 'fixed';
    marginValue: number;
    commissionType: 'percentage' | 'fixed';
    commissionValue: number;
    currency: string;
  };

  // Actions
  setBasicInfo: (info: Partial<QuotationState['basicInfo']>) => void;
  addPassenger: () => void;
  removePassenger: (id: string) => void;
  updatePassenger: (id: string, data: Partial<Passenger>) => void;
  syncPassengersCount: (adults: number, children: number, infants: number) => void;
  
  addHotelSegment: (segment: HotelSegment) => void;
  updateHotelSegment: (id: string, segment: Partial<HotelSegment>) => void;
  removeHotelSegment: (id: string) => void;

  addService: (service: ServiceItem, type: 'itinerary' | 'other') => void;
  updateService: (id: string, service: Partial<ServiceItem>, type: 'itinerary' | 'other') => void;
  removeService: (id: string, type: 'itinerary' | 'other') => void;

  setSectionEnabled: (section: 'flights' | 'cars', enabled: boolean) => void;

  addFlight: (flight: FlightSegment) => void;
  updateFlight: (id: string, flight: Partial<FlightSegment>) => void;
  removeFlight: (id: string) => void;

  addCarRental: (rental: CarRental) => void;
  updateCarRental: (id: string, rental: Partial<CarRental>) => void;
  removeCarRental: (id: string) => void;

  setFinancials: (financials: Partial<QuotationState['financials']>) => void;
  
  reset: () => void;
}

export const useQuotationStore = create<QuotationState>()(
  persist(
    (set) => ({
      basicInfo: {
        channel: 'b2c',
        adults: 1,
        children: 0,
        infants: 0,
        passengers: [{ id: '1', name: '', type: 'adult' }],
        destinationCityIds: [],
      },
      hotelSegments: [],
      itineraryServices: [],
      otherServices: [],
      
      isFlightsEnabled: false,
      flights: [],
      
      isCarsEnabled: false,
      carRentals: [],
      
      financials: {
        marginType: 'percentage',
        marginValue: 0,
        commissionType: 'percentage',
        commissionValue: 0,
        currency: 'USD',
      },

      setBasicInfo: (info) =>
        set((state) => ({ basicInfo: { ...state.basicInfo, ...info } })),

      addPassenger: () =>
        set((state) => {
          const newPassengers = [
            ...state.basicInfo.passengers,
            { id: crypto.randomUUID(), name: '', type: 'adult' as const },
          ];
          return {
            basicInfo: {
              ...state.basicInfo,
              passengers: newPassengers,
              adults: newPassengers.filter(p => p.type === 'adult').length,
              children: newPassengers.filter(p => p.type === 'child').length,
              infants: newPassengers.filter(p => p.type === 'infant').length,
            },
          };
        }),

      removePassenger: (id) =>
        set((state) => {
          const newPassengers = state.basicInfo.passengers.filter((p) => p.id !== id);
          return {
            basicInfo: {
              ...state.basicInfo,
              passengers: newPassengers,
              adults: Math.max(1, newPassengers.filter(p => p.type === 'adult').length),
              children: newPassengers.filter(p => p.type === 'child').length,
              infants: newPassengers.filter(p => p.type === 'infant').length,
            },
          };
        }),

      updatePassenger: (id, data) =>
        set((state) => {
          const newPassengers = state.basicInfo.passengers.map((p) =>
            p.id === id ? { ...p, ...data } : p
          );
          return {
            basicInfo: {
              ...state.basicInfo,
              passengers: newPassengers,
              adults: Math.max(1, newPassengers.filter(p => p.type === 'adult').length), // Ensure at least 1 adult
              children: newPassengers.filter(p => p.type === 'child').length,
              infants: newPassengers.filter(p => p.type === 'infant').length,
            },
          };
        }),

      syncPassengersCount: (adults: number, children: number, infants: number) =>
        set((state) => {
          let current = [...state.basicInfo.passengers];
          let pAdults = current.filter(p => p.type === 'adult');
          let pChildren = current.filter(p => p.type === 'child');
          let pInfants = current.filter(p => p.type === 'infant');

          while (pAdults.length < adults) pAdults.push({ id: crypto.randomUUID(), name: '', type: 'adult' });
          if (pAdults.length > adults) pAdults = pAdults.slice(0, Math.max(1, adults));

          while (pChildren.length < children) pChildren.push({ id: crypto.randomUUID(), name: '', type: 'child' });
          if (pChildren.length > children) pChildren = pChildren.slice(0, children);

          while (pInfants.length < infants) pInfants.push({ id: crypto.randomUUID(), name: '', type: 'infant' });
          if (pInfants.length > infants) pInfants = pInfants.slice(0, infants);

          return {
            basicInfo: {
              ...state.basicInfo,
              adults: Math.max(1, adults),
              children,
              infants,
              passengers: [...pAdults, ...pChildren, ...pInfants]
            }
          };
        }),

      addHotelSegment: (segment) =>
        set((state) => ({ hotelSegments: [...state.hotelSegments, segment] })),
      updateHotelSegment: (id, segment) =>
        set((state) => ({
            hotelSegments: state.hotelSegments.map((s) => s.id === id ? { ...s, ...segment } : s)
        })),
      removeHotelSegment: (id) =>
        set((state) => ({ hotelSegments: state.hotelSegments.filter((s) => s.id !== id) })),

      addService: (service, type) =>
        set((state) => {
            const key = type === 'itinerary' ? 'itineraryServices' : 'otherServices';
            return { [key]: [...state[key], service] };
        }),
      updateService: (id, service, type) =>
        set((state) => {
            const key = type === 'itinerary' ? 'itineraryServices' : 'otherServices';
            return { [key]: state[key].map((s) => s.id === id ? { ...s, ...service } : s) };
        }),
      removeService: (id, type) =>
        set((state) => {
            const key = type === 'itinerary' ? 'itineraryServices' : 'otherServices';
            return { [key]: state[key].filter((s) => s.id !== id) };
        }),

      setSectionEnabled: (section, enabled) => 
        set((state) => ({ 
            [section === 'flights' ? 'isFlightsEnabled' : 'isCarsEnabled']: enabled 
        })),

      addFlight: (flight) => set((state) => ({ flights: [...state.flights, flight] })),
      updateFlight: (id, flight) => set((state) => ({ flights: state.flights.map((f) => f.id === id ? { ...f, ...flight } : f) })),
      removeFlight: (id) => set((state) => ({ flights: state.flights.filter((f) => f.id !== id) })),

      addCarRental: (rental) => set((state) => ({ carRentals: [...state.carRentals, rental] })),
      updateCarRental: (id, rental) => set((state) => ({ carRentals: state.carRentals.map((r) => r.id === id ? { ...r, ...rental } : r) })),
      removeCarRental: (id) => set((state) => ({ carRentals: state.carRentals.filter((r) => r.id !== id) })),

      setFinancials: (financials) => set((state) => ({ financials: { ...state.financials, ...financials } })),

      reset: () => set({
        basicInfo: { channel: 'b2c', adults: 1, children: 0, infants: 0, passengers: [{ id: '1', name: '', type: 'adult' }], destinationCityIds: [] },
        hotelSegments: [],
        itineraryServices: [],
        otherServices: [],
        isFlightsEnabled: false,
        flights: [],
        isCarsEnabled: false,
        carRentals: [],
        financials: { marginType: 'percentage', marginValue: 0, commissionType: 'percentage', commissionValue: 0, currency: 'USD' }
      }),
    }),
    {
      name: 'quotation-storage',
      skipHydration: true,
    }
  )
);
