export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type FlightStatus = "scheduled" | "delayed" | "cancelled";
export type SeatClass = "economy" | "business" | "first";
export type BookingStatus = "confirmed" | "rescheduled" | "cancelled";

export type Database = {
  public: {
    Tables: {
      flights: {
        Row: {
          id: string;
          flight_no: string;
          origin: string;
          destination: string;
          departs_at: string;
          arrives_at: string;
          aircraft_type: string;
          status: FlightStatus;
          base_price: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["flights"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["flights"]["Insert"]>;
        Relationships: [];
      };
      seats: {
        Row: {
          id: string;
          flight_id: string;
          seat_number: string;
          class: SeatClass;
          is_available: boolean;
          extra_fee: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["seats"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["seats"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "seats_flight_id_fkey";
            columns: ["flight_id"];
            isOneToOne: false;
            referencedRelation: "flights";
            referencedColumns: ["id"];
          },
        ];
      };
      bookings: {
        Row: {
          id: string;
          user_id: string;
          flight_id: string;
          seat_id: string;
          status: BookingStatus;
          booked_at: string;
          total_price: number;
          pnr_code: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["bookings"]["Row"], "id" | "booked_at" | "created_at" | "updated_at"> & {
          id?: string;
          booked_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["bookings"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "bookings_flight_id_fkey";
            columns: ["flight_id"];
            isOneToOne: false;
            referencedRelation: "flights";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bookings_seat_id_fkey";
            columns: ["seat_id"];
            isOneToOne: true;
            referencedRelation: "seats";
            referencedColumns: ["id"];
          },
        ];
      };
      passengers: {
        Row: {
          id: string;
          booking_id: string;
          full_name: string;
          passport_no: string;
          nationality: string;
          dob: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["passengers"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["passengers"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "passengers_booking_id_fkey";
            columns: ["booking_id"];
            isOneToOne: true;
            referencedRelation: "bookings";
            referencedColumns: ["id"];
          },
        ];
      };
      reschedules: {
        Row: {
          id: string;
          booking_id: string;
          old_flight_id: string;
          new_flight_id: string;
          requested_at: string;
          fee_charged: number;
        };
        Insert: Omit<Database["public"]["Tables"]["reschedules"]["Row"], "id" | "requested_at"> & {
          id?: string;
          requested_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["reschedules"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "reschedules_booking_id_fkey";
            columns: ["booking_id"];
            isOneToOne: false;
            referencedRelation: "bookings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reschedules_old_flight_id_fkey";
            columns: ["old_flight_id"];
            isOneToOne: false;
            referencedRelation: "flights";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reschedules_new_flight_id_fkey";
            columns: ["new_flight_id"];
            isOneToOne: false;
            referencedRelation: "flights";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      reserve_seat: {
        Args: {
          p_flight_id: string;
          p_seat_id: string;
          p_passenger_full_name: string;
          p_passport_no: string;
          p_nationality: string;
          p_dob: string;
        };
        Returns: { booking_id: string; pnr_code: string; total_price: number }[];
      };
      reserve_seats: {
        Args: {
          p_flight_id: string;
          p_bookings: {
            seat_id: string;
            full_name: string;
            passport_no: string;
            nationality: string;
            dob: string;
          }[];
        };
        Returns: { booking_id: string; pnr_code: string; total_price: number }[];
      };
      cancel_booking: {
        Args: { p_booking_id: string };
        Returns: { booking_id: string; status: BookingStatus }[];
      };
      reschedule_booking: {
        Args: { p_booking_id: string; p_new_flight_id: string; p_new_seat_id: string };
        Returns: { booking_id: string; status: BookingStatus; fee_charged: number }[];
      };
    };
    Enums: {
      flight_status: FlightStatus;
      seat_class: SeatClass;
      booking_status: BookingStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};
