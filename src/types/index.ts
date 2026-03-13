export interface Service {
  id: string;
  name: string;
  price: number;
  durationMinutes: number;
}

export interface Tenant {
  id: string;
  name: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
  };
  services: Service[];
  availableDates: string[]; // ISO format YYYY-MM-DD
  timeSlots: Record<string, string[]>; // { '2023-10-25': ['10:00', '11:00'] }
}
